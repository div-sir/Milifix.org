#!/usr/bin/env node
/**
 * 一次性腳本：補齊步行／巴士／渡輪段的實際路徑幾何（viaCoords），做法與
 * scripts/fetch-rail-geometry.mjs（鐵路類）相同的「離線烘焙」原則——執行期
 * 純靜態網站不打任何外部 API，路徑幾何由具備網路存取的環境（本機／CI）
 * 跑一次後寫回資料檔。詳見 fetch-rail-geometry.mjs 檔頭關於「為什麼一次性」
 * 的說明，此處不重複。
 *
 * 使用方式（需要在有網路存取的環境執行；資料檔為 .ts，需透過 tsx 載入）：
 *   npx tsx scripts/fetch-path-geometry.mjs [tripSlug]
 *   # 或：npm run fetch:paths -- [tripSlug]
 * 不帶參數則處理 src/data/trips/index.ts 註冊的全部報告書。
 * 執行後請用 `git diff` 檢視變更，確認合理再 commit。
 *
 * 三種交通方式，三種不同做法（重要：不是同一套演算法）：
 *
 * 1. 渡輪（ferry）：跟鐵路一樣，OSM 上有具名的 route=ferry 航線關係可查，
 *    直接沿用 fetch-rail-geometry.mjs 的 buildCorridor + sliceBetween
 *    （具名路線→縫合→在起訖站之間裁切），候選名稱見 FERRY_ROUTES。
 *
 * 2. 步行（walk）／巴士＋計程車接駁（bus）：這兩者在 OSM 上都沒有「具名
 *    路線關係」可以直接查詢與裁切——尤其巴士段在本資料集中標記的都是
 *    約僱接駁車／計程車（如「接駁巴士／計程車」「春巴士（社區巴士）／
 *    計程車」），本來就沒有固定唯一路線。因此改用「路網最短路徑」：
 *    在起訖點周邊查詢 Overpass 道路網（步行用人行可通行的 highway 類型，
 *    巴士用一般可行駛道路類型），把 way 的節點與線段組成圖，起訖點各自
 *    snap 到最近的路網節點，跑 Dijkstra 最短路徑，取得節點座標序列。
 *    這是「合理的路徑近似」，不代表當時實際走的每一步——巴士／計程車
 *    尤其如此（司機實際路線未知，這裡只是道路網上的最短可行路徑）。
 *
 * 已知限制：
 * - 路網最短路徑忽略單行道（oneway）限制，把路網當雙向圖處理：目的是
 *   合理呈現「大致怎麼走」，不是逐轉彎精確重現實際駕駛路徑。
 * - 起訖點必須落在查詢範圍內且離路網節點夠近（見 MAX_SNAP_KM），否則會
 *   略過該段並記錄警告，不影響其他段落，也不會清空原有 viaCoords。
 * - Overpass 資料完整度不一，郊區步道或小路可能查無資料。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { lineString } from '@turf/helpers';
import length from '@turf/length';
import simplify from '@turf/simplify';
import {
  buildCorridor,
  sliceBetween,
  haversineKm,
  patchSegmentLine,
  overpassQuery,
  TRIPS_DIR,
} from './fetch-rail-geometry.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
void __dirname; // 保留供未來擴充；目前路徑一律透過 TRIPS_DIR（自 fetch-rail-geometry.mjs 匯入）取得

// ── 渡輪：候選名稱 → OSM route=ferry relation（做法比照鐵路）───────────
// 值為 null 代表尚未確認候選名稱，仍會退回用 label 本身＋地理範圍模糊比對嘗試。
const FERRY_ROUTES = {
  'JR 宮島渡輪': { legs: [['宮島航路', 'JR宮島フェリー', 'Miyajima Ferry', 'JR Miyajima Ferry']] },
};

// ── 步行／巴士：路網最短路徑用的 highway=* 類型（依走法不同各自過濾）──
const WALK_HIGHWAY_TYPES = [
  'footway', 'path', 'pedestrian', 'steps', 'living_street',
  'residential', 'service', 'track', 'unclassified',
  'tertiary', 'secondary', 'primary', 'cycleway',
];
const DRIVE_HIGHWAY_TYPES = [
  'motorway', 'motorway_link', 'trunk', 'trunk_link',
  'primary', 'primary_link', 'secondary', 'secondary_link',
  'tertiary', 'tertiary_link', 'unclassified', 'residential',
  'service', 'living_street',
];

const MIN_PADDING_KM = 0.4; // 查詢範圍最小緩衝（避免起訖點極近時查詢範圍過窄）
const MAX_PADDING_KM = 6; // 查詢範圍緩衝上限（避免長程段查出過大範圍拖垮 Overpass）
const MAX_SNAP_KM = 0.35; // 起訖點與最近路網節點的距離超過此值視為 snap 失敗
const MAX_DETOUR_RATIO = 5; // 路網路徑長度上限＝直線距離的幾倍（步行/巴士繞路本就比鐵路彈性大）
const MAX_DETOUR_ABS_KM = 3; // 額外的絕對容許值，處理短程但確實繞路的情況
const SIMPLIFY_TOLERANCE_DEG = 0.00015; // 簡化容許誤差，約 15–17m，貼近地圖可視尺度

/** 計算起訖點周邊的查詢緩衝範圍（公里），依直線距離縮放並夾在上下限之間。 */
function paddingKmFor(straightKm) {
  return Math.min(MAX_PADDING_KM, Math.max(MIN_PADDING_KM, straightKm * 0.6));
}

/** 以 [lng,lat] 座標與緩衝公里數算出 Overpass bbox（south,west,north,east）。 */
function bboxAround(fromCoord, toCoord, paddingKm) {
  const south = Math.min(fromCoord[1], toCoord[1]);
  const north = Math.max(fromCoord[1], toCoord[1]);
  const west = Math.min(fromCoord[0], toCoord[0]);
  const east = Math.max(fromCoord[0], toCoord[0]);
  const latPad = paddingKm / 111;
  const midLat = (south + north) / 2;
  const lngPad = paddingKm / (111 * Math.max(0.15, Math.cos((midLat * Math.PI) / 180)));
  return { south: south - latPad, west: west - lngPad, north: north + latPad, east: east + lngPad };
}

/** 把 Overpass `out geom;` 回傳的 way 元素組成路網圖：節點座標表 + 雙向鄰接表。
 *  無視 oneway——目的是合理近似「大致怎麼走」，不是精確重現駕駛方向。 */
function buildNetworkGraph(elements) {
  const nodeCoord = new Map();
  const adjacency = new Map();
  const addEdge = (a, b, distKm) => {
    if (!adjacency.has(a)) adjacency.set(a, []);
    adjacency.get(a).push({ to: b, distKm });
  };
  for (const el of elements) {
    if (el.type !== 'way' || !Array.isArray(el.nodes) || !Array.isArray(el.geometry)) continue;
    if (el.nodes.length !== el.geometry.length) continue;
    for (let i = 0; i < el.nodes.length; i++) {
      const g = el.geometry[i];
      if (g) nodeCoord.set(el.nodes[i], [g.lon, g.lat]);
    }
    for (let i = 0; i < el.nodes.length - 1; i++) {
      const a = el.nodes[i];
      const b = el.nodes[i + 1];
      const ca = nodeCoord.get(a);
      const cb = nodeCoord.get(b);
      if (!ca || !cb) continue;
      const d = haversineKm(ca, cb);
      addEdge(a, b, d);
      addEdge(b, a, d);
    }
  }
  return { nodeCoord, adjacency };
}

/** 路網中離給定座標最近的節點（線性掃描；單一 bbox 內節點數對離線腳本而言足夠快）。 */
function nearestNodeId(nodeCoord, coord) {
  let bestId = null;
  let bestKm = Infinity;
  for (const [id, c] of nodeCoord) {
    const d = haversineKm(c, coord);
    if (d < bestKm) {
      bestKm = d;
      bestId = id;
    }
  }
  return bestId === null ? null : { id: bestId, distKm: bestKm };
}

/** 樸素 Dijkstra（O(V^2)）：單一 bbox 內的路網規模對一次性腳本來說不需要堆積優化。
 *  找不到路徑回傳 null，否則回傳依序的節點 id 陣列（含起訖點）。 */
function dijkstra(adjacency, startId, endId) {
  const dist = new Map([[startId, 0]]);
  const prev = new Map();
  const visited = new Set();
  const candidates = new Set(adjacency.keys());
  candidates.add(startId);
  candidates.add(endId);

  for (;;) {
    let u = null;
    let uDist = Infinity;
    for (const n of candidates) {
      if (visited.has(n)) continue;
      const d = dist.get(n);
      if (d !== undefined && d < uDist) {
        uDist = d;
        u = n;
      }
    }
    if (u === null || u === endId) break;
    visited.add(u);
    for (const { to, distKm } of adjacency.get(u) ?? []) {
      const nd = uDist + distKm;
      if (nd < (dist.get(to) ?? Infinity)) {
        dist.set(to, nd);
        prev.set(to, u);
      }
    }
  }

  if (!dist.has(endId)) return null;
  const pathIds = [endId];
  let cur = endId;
  while (cur !== startId) {
    const p = prev.get(cur);
    if (p === undefined) return null;
    pathIds.push(p);
    cur = p;
  }
  return pathIds.reverse();
}

/** 查詢起訖點周邊路網、蓋圖、跑最短路徑，回傳 { coords } 或 { error }。 */
async function networkPathCoords(fromCoord, toCoord, highwayTypes) {
  const straightKm = haversineKm(fromCoord, toCoord);
  const bbox = bboxAround(fromCoord, toCoord, paddingKmFor(straightKm));
  const regex = highwayTypes.join('|');
  const ql =
    `[out:json][timeout:120];\n` +
    `way["highway"~"^(${regex})$"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});\n` +
    `out geom;`;

  let data;
  try {
    data = await overpassQuery(ql);
  } catch (err) {
    return { error: `Overpass 查詢失敗（${err.message}）` };
  }
  const elements = data.elements ?? [];
  if (elements.length === 0) return { error: '查詢範圍內查無可用路網' };

  const { nodeCoord, adjacency } = buildNetworkGraph(elements);
  if (nodeCoord.size === 0) return { error: '路網節點為空' };

  const fromSnap = nearestNodeId(nodeCoord, fromCoord);
  const toSnap = nearestNodeId(nodeCoord, toCoord);
  if (!fromSnap || !toSnap) return { error: '起訖點無法對應到路網節點' };
  if (fromSnap.distKm > MAX_SNAP_KM || toSnap.distKm > MAX_SNAP_KM) {
    return {
      error: `起訖點與最近路網節點距離過遠（${fromSnap.distKm.toFixed(2)}km / ${toSnap.distKm.toFixed(2)}km）`,
    };
  }

  const nodePath = dijkstra(adjacency, fromSnap.id, toSnap.id);
  if (!nodePath || nodePath.length < 2) return { error: '路網上找不到可行路徑（可能查詢範圍未涵蓋連通道路）' };

  const coords = nodePath.map((id) => nodeCoord.get(id));
  const pathKm = length(lineString(coords), { units: 'kilometers' });
  const maxAllowedKm = Math.max(straightKm * MAX_DETOUR_RATIO, straightKm + MAX_DETOUR_ABS_KM);
  if (pathKm > maxAllowedKm) {
    return { error: `路徑長度異常（${pathKm.toFixed(2)}km，直線距離僅 ${straightKm.toFixed(2)}km），疑似 snap 錯節點` };
  }

  const simplified = simplify(lineString(coords), { tolerance: SIMPLIFY_TOLERANCE_DEG, highQuality: true });
  return { coords: simplified.geometry.coordinates };
}

function fmtCoord([lng, lat]) {
  return `{ lat: ${round(lat)}, lng: ${round(lng)} }`;
}
function round(n) {
  return Math.round(n * 1e5) / 1e5;
}

async function processTripFile(filePath) {
  let mod;
  try {
    mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
  } catch (err) {
    console.warn(`跳過：無法載入 ${path.basename(filePath)}（${err.message}）`);
    return;
  }
  const trip = Object.values(mod).find((v) => v && typeof v === 'object' && Array.isArray(v.days));
  if (!trip) {
    console.warn(`跳過 ${filePath}：找不到 TripReport 匯出`);
    return;
  }

  const stopById = new Map();
  for (const day of trip.days) for (const s of day.stops) if (!stopById.has(s.id)) stopById.set(s.id, s);

  let fileText = readFileSync(filePath, 'utf-8');
  let ok = 0;
  let skipped = 0;

  for (const day of trip.days) {
    for (const seg of day.segments ?? []) {
      if (seg.mode !== 'walk' && seg.mode !== 'bus' && seg.mode !== 'ferry') continue;
      const from = stopById.get(seg.from);
      const to = stopById.get(seg.to);
      if (!from || !to) {
        console.warn(`  ⚠ Day${day.day} [${seg.label}] 找不到 stop 座標 (${seg.from} → ${seg.to})，跳過`);
        skipped++;
        continue;
      }

      console.log(`\nDay${day.day} [${seg.mode}] ${seg.label}：${from.name} → ${to.name}`);

      let result;
      try {
        if (seg.mode === 'ferry') {
          const route = FERRY_ROUTES[seg.label];
          const legs = route?.legs ?? [[seg.label]];
          const anchors = [from.coords, to.coords];
          const corridor = await buildCorridor(legs, ['ferry'], anchors);
          if (corridor.length < 2) {
            result = { error: '未取得任何航線幾何' };
          } else {
            result = sliceBetween(corridor, [from.coords.lng, from.coords.lat], [to.coords.lng, to.coords.lat]);
          }
        } else {
          const highwayTypes = seg.mode === 'walk' ? WALK_HIGHWAY_TYPES : DRIVE_HIGHWAY_TYPES;
          result = await networkPathCoords(
            [from.coords.lng, from.coords.lat],
            [to.coords.lng, to.coords.lat],
            highwayTypes
          );
        }
      } catch (err) {
        result = { error: err.message };
      }

      if (!result || result.error) {
        console.warn(`  ⚠ ${result?.error ?? '路徑擷取失敗'}，跳過（保留原有 viaCoords）`);
        skipped++;
        continue;
      }

      const via = result.coords.slice(1, -1);
      const literal = via.map(fmtCoord).join(', ');
      const patch = patchSegmentLine(fileText, seg.from, seg.to, literal);
      if (patch.patchedCount === 0) {
        console.warn('  ⚠ 在檔案中找不到對應的 segment 行，未寫入（可能非單行格式）');
        skipped++;
        continue;
      }
      fileText = patch.text;
      console.log(`  ✓ 取得 ${via.length} 個中繼點，已寫入`);
      ok++;
    }
  }

  writeFileSync(filePath, fileText, 'utf-8');
  console.log(`\n${path.basename(filePath)}：成功 ${ok} 段，略過 ${skipped} 段。請用 git diff 檢視後再 commit。`);
}

async function main() {
  const args = process.argv.slice(2);
  const NON_DATA = new Set(['types', 'index']);
  const arg = args.find((a) => !a.startsWith('--'));
  if (arg && !/^[a-z0-9-]+$/i.test(arg)) {
    console.error(`參數「${arg}」不是有效的報告書 slug（只能是英數字與連字號）。`);
    process.exit(1);
  }
  const files = arg
    ? [path.join(TRIPS_DIR, `${arg}.ts`)]
    : [
        ...new Set(
          (readFileSync(path.join(TRIPS_DIR, 'index.ts'), 'utf-8').match(/from '\.\/([a-z0-9-]+)'/g) ?? [])
            .map((m) => m.match(/'\.\/(.+)'/)[1])
            .filter((slug) => !NON_DATA.has(slug))
        ),
      ].map((slug) => path.join(TRIPS_DIR, `${slug}.ts`));

  if (files.length === 0) {
    console.error('找不到任何報告書資料檔。');
    process.exit(1);
  }

  for (const f of files) {
    console.log(`\n=== ${path.basename(f)} ===`);
    await processTripFile(f);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { bboxAround, buildNetworkGraph, nearestNodeId, dijkstra, paddingKmFor };
