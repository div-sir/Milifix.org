#!/usr/bin/env node
/**
 * 一次性腳本：從 OpenStreetMap Overpass API 擷取鐵路路線的實際軌道幾何，
 * 裁切出每段「兩站之間」的精確路徑，寫回 src/data/trips/*.ts 各鐵路段的 viaCoords。
 *
 * 為什麼要「一次性」而非執行期即時查詢：
 * 開發沙箱的網路政策為白名單制，連不到 Overpass 等外部地圖服務；
 * 但正式網站是純靜態輸出，執行期也不該依賴外部 API（穩定性與速度考量）。
 * 因此改成：由具備網路存取的環境（本機／CI）跑一次，把結果「烘焙」進資料檔，
 * 之後網站永遠讀本地靜態資料，不再需要任何外部服務。
 *
 * 使用方式（需要在有網路存取的環境執行；資料檔為 .ts，需透過 tsx 載入）：
 *   npm install                       # 確保 tsx / @turf/turf 已安裝（devDependencies）
 *   npx tsx scripts/fetch-rail-geometry.mjs [tripSlug]
 *   # 或：npm run fetch:rail -- [tripSlug]
 *
 * 不帶參數則處理 src/data/trips/index.ts 註冊的全部報告書。
 * 執行後請用 `git diff` 檢視 src/data/trips/*.ts 的變更，確認合理再 commit。
 *
 * 運作方式：
 * 1. 讀取每篇報告書的 TripDay[]，收集所有「鐵路類」交通段
 *    （shinkansen / train / tram / monorail / night-train；步行/巴士/渡輪/航班不處理）。
 * 2. 依 RAIL_NAME_OVERRIDES 找出該段對應的 OSM route relation 名稱（可能多條，
 *    依地理順序串接，例如夜車橫跨東海道本線＋山陽本線）。找不到對應名稱的段落，
 *    會用 label 本身當作查詢名稱嘗試。
 * 3. 對每個 relation：查詢其成員 way 的完整幾何，並以「就近端點縫合」演算法
 *    串成一條連續路線（能處理未依序排列、方向不一的 way）。
 * 4. 多個 relation 依序串接成單一 corridor 折線。
 * 5. 用該段起訖站的實際座標，在 corridor 上做 nearestPointOnLine + lineSlice，
 *    裁出兩站之間的精確路徑，寫回資料檔對應段落的 viaCoords（依起點→終點排序）。
 * 6. 任何一步失敗（查無 relation／裁切結果離站點過遠）僅記錄警告並跳過該段，
 *    不影響其他段落，最後印出成功/略過清單。
 *
 * 已知限制：
 * - OSM 的 route relation 資料完整度不一，少數地方支線或新開通路段可能查無資料。
 * - 就近端點縫合是啟發式算法，遇到複雜的調車場/多線並行路段可能拼出小瑕疵；
 *   已略過的段落會保留原本手動描繪的 viaCoords，不會被清空。
 * - 部分段落 label 描述的移動方式跨越多條實體路線（如「湘南單軌電車」的實際
 *   路線是大船–湘南江之島，與其行程敘述終點不完全一致），此類段落若裁切距離
 *   站點過遠會被跳過並提示，需要人工確認後調整 RAIL_NAME_OVERRIDES。
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { lineString, point } from '@turf/helpers';
import nearestPointOnLine from '@turf/nearest-point-on-line';
import lineSlice from '@turf/line-slice';
import distance from '@turf/distance';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TRIPS_DIR = path.join(__dirname, '../src/data/trips');

// ── 段落 label → OSM route relation name（依地理順序，多條代表跨線）──────
// 找不到對應項目時，會直接拿 label 本身當查詢名稱（去除中文說明性字尾）。
const RAIL_NAME_OVERRIDES = {
  '京急線・東急線': ['京急本線'],
  'JR 橫須賀線 → 江之電': ['横須賀線'],
  '江之電（江ノ島電鐵）': ['江ノ島電鉄線'],
  '湘南單軌電車': ['湘南モノレール線'],
  'JR 上野東京線': ['上野東京ライン'],
  'JR 山手線': ['山手線'],
  '上越新幹線': ['上越新幹線'],
  '上越新幹線（清晨返回東京）': ['上越新幹線'],
  '東武城市公園線': ['東武アーバンパークライン'],
  '東武線・JR 線': ['東武アーバンパークライン', '武蔵野線'],
  'Sunrise 寢台特急': ['東海道本線', '山陽本線'],
  '山陽新幹線': ['山陽新幹線'],
  '廣島電鐵路面電車': ['広島電鉄本線'],
  'JR 山陽本線': ['山陽本線'],
  'JR 宮島渡輪': null, // 渡輪，非鐵路
  '岡山電鐵路面電車（或步行）': ['岡山電気軌道東山本線'],
  'JR 瀨戶大橋線': ['瀬戸大橋線'],
  'JR 土讚線': ['土讃線'],
  'JR 土讚線・瀨戶大橋線': ['土讃線', '瀬戸大橋線'],
  'JR 山陽本線・山陽新幹線': ['山陽本線', '山陽新幹線'],
  "N'EX 成田特快": ['成田線'],
  'JR 山手線（承前日）': ['山手線'],
};

const RAIL_MODES = new Set(['shinkansen', 'train', 'tram', 'monorail', 'night-train']);

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const SNAP_WARN_KM = 3; // 起訖站與 corridor 最近點距離超過此值，視為對不上、跳過
const STITCH_GAP_KM = 0.3; // 就近端點縫合的容許間隙

async function overpassQuery(ql) {
  let lastErr;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: ql,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      lastErr = err;
      await sleep(1500);
    }
  }
  throw lastErr ?? new Error('Overpass 查詢失敗');
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 依名稱找出鐵路 route relation id（取成員數最多者，通常代表最完整的路線） */
async function findRelationId(name) {
  const ql = `[out:json][timeout:60];\nrelation["type"="route"]["route"="railway"]["name"="${name}"];\nout ids tags;`;
  const data = await overpassQuery(ql);
  if (!data.elements?.length) return null;
  // 部分路線有「上行／下行」兩個 relation，member 數最多者通常最完整
  let best = null;
  for (const el of data.elements) {
    const memberCount = el.tags?.['member_count'] ?? 0;
    if (!best || memberCount > (best.tags?.['member_count'] ?? 0)) best = el;
  }
  return (best ?? data.elements[0]).id;
}

/** 抓 relation 所有成員 way 的完整幾何（未縫合、未排序）*/
async function fetchRelationWays(relationId) {
  const ql = `[out:json][timeout:90];\nrelation(${relationId});\nway(r);\nout geom;`;
  const data = await overpassQuery(ql);
  return (data.elements ?? [])
    .filter((el) => el.type === 'way' && el.geometry?.length > 1)
    .map((el) => el.geometry.map((g) => [g.lon, g.lat]));
}

function haversineKm([lng1, lat1], [lng2, lat2]) {
  return distance(point([lng1, lat1]), point([lng2, lat2]), { units: 'kilometers' });
}

/** 就近端點縫合：把一批未排序、方向不一的 way 座標串成最長的連續折線 */
function stitchWays(ways) {
  if (ways.length === 0) return [];
  const remaining = ways.map((w) => w.slice());
  let chain = remaining.shift();

  while (remaining.length > 0) {
    const head = chain[0];
    const tail = chain[chain.length - 1];
    let bestIdx = -1;
    let bestDist = Infinity;
    let bestMode = null; // 'append-forward' | 'append-reverse' | 'prepend-forward' | 'prepend-reverse'

    remaining.forEach((w, idx) => {
      const wHead = w[0];
      const wTail = w[w.length - 1];
      const candidates = [
        { d: haversineKm(tail, wHead), mode: 'append-forward' },
        { d: haversineKm(tail, wTail), mode: 'append-reverse' },
        { d: haversineKm(head, wTail), mode: 'prepend-forward' },
        { d: haversineKm(head, wHead), mode: 'prepend-reverse' },
      ];
      for (const c of candidates) {
        if (c.d < bestDist) {
          bestDist = c.d;
          bestIdx = idx;
          bestMode = c.mode;
        }
      }
    });

    if (bestDist > STITCH_GAP_KM) break; // 沒有夠近的可縫合，視為已達最長連續段

    const w = remaining.splice(bestIdx, 1)[0];
    if (bestMode === 'append-forward') chain = chain.concat(w);
    else if (bestMode === 'append-reverse') chain = chain.concat(w.slice().reverse());
    else if (bestMode === 'prepend-forward') chain = w.concat(chain);
    else chain = w.slice().reverse().concat(chain);
  }

  return chain;
}

/** 依名稱清單依序抓取＋縫合＋串接成單一 corridor 折線 */
async function buildCorridor(names) {
  let corridor = [];
  for (const name of names) {
    const relId = await findRelationId(name);
    if (!relId) {
      console.warn(`  ⚠ 查無 route relation：「${name}」`);
      continue;
    }
    await sleep(1200); // 對公開 Overpass 服務保持禮貌節流
    const ways = await fetchRelationWays(relId);
    await sleep(1200);
    const line = stitchWays(ways);
    if (line.length < 2) {
      console.warn(`  ⚠ 「${name}」（relation ${relId}）縫合後點數不足`);
      continue;
    }
    corridor = corridor.length === 0 ? line : corridor.concat(line);
  }
  return corridor;
}

/** 在 corridor 上裁出 fromCoord→toCoord 之間的精確路徑 */
function sliceBetween(corridor, fromCoord, toCoord) {
  if (corridor.length < 2) return null;
  const line = lineString(corridor);
  const fromPt = point(fromCoord);
  const toPt = point(toCoord);

  const fromSnap = nearestPointOnLine(line, fromPt);
  const toSnap = nearestPointOnLine(line, toPt);
  if (fromSnap.properties.pointDistance > SNAP_WARN_KM || toSnap.properties.pointDistance > SNAP_WARN_KM) {
    return { error: `起訖站與路線距離過遠（${fromSnap.properties.pointDistance.toFixed(1)}km / ${toSnap.properties.pointDistance.toFixed(1)}km）` };
  }

  const sliced = lineSlice(fromPt, toPt, line);
  let coords = sliced.geometry.coordinates;
  if (coords.length < 2) return { error: '裁切結果點數不足' };

  // lineSlice 依線本身方向輸出，可能與 from→to 語意方向相反，比對後視需要反轉
  const distToFromStart = haversineKm(coords[0], fromCoord);
  const distToToStart = haversineKm(coords[0], toCoord);
  if (distToToStart < distToFromStart) coords = coords.slice().reverse();

  return { coords };
}

function fmtCoord([lng, lat]) {
  return `{ lat: ${round(lat)}, lng: ${round(lng)} }`;
}
function round(n) {
  return Math.round(n * 1e5) / 1e5;
}

/** 在 .ts 原始文字中，找到符合 from/to 的那一行 segment，並替換／插入 viaCoords */
function patchSegmentLine(fileText, from, to, viaCoordsLiteral) {
  const lines = fileText.split('\n');
  let patchedCount = 0;
  const out = lines.map((line) => {
    if (!line.includes(`from: '${from}'`) || !line.includes(`to: '${to}'`)) return line;
    patchedCount++;
    if (/viaCoords:\s*\[[^\]]*\]/.test(line)) {
      return line.replace(/viaCoords:\s*\[[^\]]*\]/, `viaCoords: [${viaCoordsLiteral}]`);
    }
    // 尚無 viaCoords：插入在結尾 ` },` 之前
    return line.replace(/\s*\},\s*$/, ` viaCoords: [${viaCoordsLiteral}] },`);
  });
  return { text: out.join('\n'), patchedCount };
}

async function processTripFile(filePath) {
  const mod = await import(`${pathToFileURL(filePath).href}?t=${Date.now()}`);
  const trip = Object.values(mod).find((v) => v && typeof v === 'object' && Array.isArray(v.days));
  if (!trip) {
    console.warn(`跳過 ${filePath}：找不到 TripReport 匯出`);
    return;
  }

  // 全域 stop 座標查找（跨日引用）
  const stopById = new Map();
  for (const day of trip.days) for (const s of day.stops) if (!stopById.has(s.id)) stopById.set(s.id, s);

  let fileText = readFileSync(filePath, 'utf-8');
  let ok = 0;
  let skipped = 0;

  for (const day of trip.days) {
    for (const seg of day.segments ?? []) {
      if (!RAIL_MODES.has(seg.mode)) continue;
      const from = stopById.get(seg.from);
      const to = stopById.get(seg.to);
      if (!from || !to) {
        console.warn(`  ⚠ Day${day.day} [${seg.label}] 找不到 stop 座標 (${seg.from} → ${seg.to})，跳過`);
        skipped++;
        continue;
      }

      const override = RAIL_NAME_OVERRIDES[seg.label];
      if (override === null) continue; // 明確標記為非鐵路（如渡輪），略過不警告
      const names = override ?? [seg.label];

      console.log(`\nDay${day.day} [${seg.label}] ${from.name} → ${to.name}`);
      console.log(`  查詢路線：${names.join(' → ')}`);

      try {
        const corridor = await buildCorridor(names);
        if (corridor.length < 2) {
          console.warn('  ⚠ 未取得任何路線幾何，跳過（保留原有 viaCoords）');
          skipped++;
          continue;
        }
        const result = sliceBetween(
          corridor,
          [from.coords.lng, from.coords.lat],
          [to.coords.lng, to.coords.lat]
        );
        if (!result || result.error) {
          console.warn(`  ⚠ ${result?.error ?? '裁切失敗'}，跳過（保留原有 viaCoords）`);
          skipped++;
          continue;
        }
        // 排除頭尾（緊貼站點本身），只留中繼點作為 viaCoords
        const via = result.coords.slice(1, -1);
        const literal = via.map(fmtCoord).join(', ');
        const patch = patchSegmentLine(fileText, seg.from, seg.to, literal);
        if (patch.patchedCount === 0) {
          console.warn('  ⚠ 在檔案中找不到對應的 segment 行，未寫入（可能非單行格式）');
          skipped++;
          continue;
        }
        fileText = patch.text;
        console.log(`  ✓ 取得 ${via.length} 個精確中繼點，已寫入`);
        ok++;
      } catch (err) {
        console.warn(`  ⚠ 發生錯誤：${err.message}，跳過（保留原有 viaCoords）`);
        skipped++;
      }
    }
  }

  writeFileSync(filePath, fileText, 'utf-8');
  console.log(`\n${path.basename(filePath)}：成功 ${ok} 段，略過 ${skipped} 段。請用 git diff 檢視後再 commit。`);
}

async function main() {
  const arg = process.argv[2];
  const files = arg
    ? [path.join(TRIPS_DIR, `${arg}.ts`)]
    : readFileSync(path.join(TRIPS_DIR, 'index.ts'), 'utf-8')
        .match(/from '\.\/([a-z0-9-]+)'/g)
        ?.map((m) => path.join(TRIPS_DIR, `${m.match(/'\.\/(.+)'/)[1]}.ts`))
        .filter((p) => !p.endsWith('index.ts')) ?? [];

  if (files.length === 0) {
    console.error('找不到任何報告書資料檔。');
    process.exit(1);
  }

  for (const f of files) {
    console.log(`\n=== ${path.basename(f)} ===`);
    await processTripFile(f);
  }
}

// 僅在直接執行本檔（而非被測試檔 import）時才啟動，方便離線單元測試核心演算法
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { stitchWays, sliceBetween, buildCorridor, haversineKm };
