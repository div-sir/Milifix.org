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
 *   npm install                                        # 確保 tsx / @turf/turf 已安裝
 *   npx tsx scripts/fetch-rail-geometry.mjs --verify-names   # ① 先驗證線名（數十秒，不改檔）
 *   npx tsx scripts/fetch-rail-geometry.mjs [tripSlug]       # ② 名稱都對得上後再跑完整幾何
 *   # 或用 npm script：npm run fetch:rail -- --verify-names / npm run fetch:rail -- [tripSlug]
 *
 * 建議兩步驟流程：先跑 --verify-names 確認 RAIL_ROUTES 裡的候選名稱能對應到 OSM
 * relation（查無者會列出，到 openstreetmap.org / overpass-turbo.eu 查正確 name 後
 * 更新候選名稱重驗）；名稱都綠了再跑完整幾何擷取，避免白花時間抓錯線。
 *
 * 關於速度：公開 Overpass 服務有 slot 配額與限流（429）。本腳本會查 /api/status
 * 等待空檔、遇 429/5xx 指數退避重試，並快取重複線路，因此完整擷取可能需要數分鐘，
 * 過程中看到「等待 Overpass 空檔…」「Overpass 429…等待後重試」是正常的，請耐心等候，
 * 不要中斷。若持續大量 429，可稍後離峰再跑。
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

// ── 段落 label → 鐵路路線（依實際地理順序的「leg」陣列）───────────────
//
//   每個 leg 是一組「候選 OSM route relation 名稱」，會依序嘗試直到某個
//   名稱查得到 relation（容忍 OSM 命名不一致）。多個 leg 代表該段跨越多條
//   實體路線（例如夜車跨東海道本線＋山陽本線），依序串接成完整走廊。
//
//   線名來源：以 ekidata（open-data-jp-railway-lines）的正式 name_kanji 為主，
//   再補上常見 OSM 變體作為後備候選。OSM 的 route relation `name` 標記與
//   ekidata 未必完全一致，某些路面電車／機場支線／跨線接續仍可能需要人工微調；
//   請先用 `--verify-names` 模式快速確認哪些候選名稱查得到，再跑完整幾何擷取。
//
//   值為 null：明確標記為非鐵路（如渡輪），略過不處理、不警告。
//   未列出的 label：退回用 label 本身當單一候選名稱嘗試。
const RAIL_ROUTES = {
  // Day2
  '京急線・東急線': [['京急空港線'], ['京急本線', '京浜急行電鉄本線']],
  'JR 橫須賀線 → 江之電': [['横須賀線', 'JR横須賀線']],
  '江之電（江ノ島電鐵）': [['江ノ島電鉄線', '江ノ島電鉄']],
  '湘南單軌電車': [['湘南モノレール江の島線', '湘南モノレール'], ['東海道本線']],
  // Day3
  'JR 上野東京線': [['東海道本線'], ['東北本線', '宇都宮線']],
  'JR 山手線': [['山手線', 'JR山手線']],
  // '上越新幹線' 出現於 Day3（上野→燕三條）與 Day4（上野→大宮）兩段，label 相同；
  // 上越新幹線 relation 通常涵蓋東京/大宮–新潟全段，兩段都能正確裁切，故共用單一候選。
  '上越新幹線': [['上越新幹線']],
  // Day4
  '上越新幹線（清晨返回東京）': [['上越新幹線']],
  '東武城市公園線': [['東武野田線', '東武アーバンパークライン', '野田線']],
  '東武線・JR 線': [['東武野田線'], ['武蔵野線'], ['東北本線']],
  'Sunrise 寢台特急': [['東海道本線'], ['山陽本線']],
  // Day5
  '山陽新幹線': [['山陽新幹線']],
  '廣島電鐵路面電車': [['広電本線', '広電２号線(宮島線)', '広電１号線(宇品線)']],
  'JR 山陽本線': [['山陽本線', 'JR山陽本線']],
  'JR 宮島渡輪': null, // 渡輪，非鐵路
  'JR 山陽本線・山陽新幹線': [['山陽本線'], ['山陽新幹線']],
  // Day6
  '岡山電鐵路面電車（或步行）': [['岡山電軌東山本線', '東山本線', '東山線']],
  'JR 瀨戶大橋線': [['宇野線'], ['瀬戸大橋線', '本四備讃線'], ['予讃線']],
  'JR 土讚線': [['予讃線'], ['土讃線', 'JR土讃線']],
  'JR 土讚線・瀨戶大橋線': [['土讃線'], ['予讃線'], ['瀬戸大橋線', '本四備讃線'], ['宇野線']],
  // Day7 沿用 'JR 山手線'
  // Day8
  "N'EX 成田特快": [['総武本線'], ['成田線', 'JR成田線'], ['成田線空港支線']],
  'JR 山手線（承前日）': [['山手線', 'JR山手線']],
};

const RAIL_MODES = new Set(['shinkansen', 'train', 'tram', 'monorail', 'night-train']);

// Overpass 公開伺服器。overpass-api.de 有明確的 slot 配額機制（/api/status），
// 優先使用它並遵守其空檔；kumi.systems 作為備援。
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];
const OVERPASS_MAX_ATTEMPTS = 5; // 每次查詢的重試上限（含 429 退避）
// Overpass 使用政策要求識別身分的 User-Agent；部分公開端點的前置 CDN／
// bot 防護（如 Cloudflare）也會對缺少 Accept/User-Agent 的「無臉」腳本
// 請求直接回 406，補上這兩個標頭可避免被誤判。
const OVERPASS_HEADERS = {
  'Content-Type': 'text/plain; charset=UTF-8',
  Accept: 'application/json, */*;q=0.8',
  'User-Agent': 'milifix-trip-report-rail-geometry/1.0 (one-time data bake script; https://github.com/div-sir/Milifix.org)',
};
const OVERPASS_MIN_SPACING_MS = 1500; // 相鄰請求的全域最小間隔，避免瞬間灌爆
const OVERPASS_TIMEOUT_MS = 180_000; // 單次請求逾時（含伺服器端 timeout）

const SNAP_WARN_KM = 3; // 起訖站與 corridor 最近點距離超過此值，視為對不上、跳過
const STITCH_GAP_KM = 0.3; // 就近端點縫合的容許間隙

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let lastRequestAt = 0;
async function globalSpacing() {
  const wait = OVERPASS_MIN_SPACING_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

/**
 * 查詢 overpass-api.de 的 /api/status，若目前沒有可用 slot 就等到有空檔為止，
 * 這是避免 429（限流）最正規的做法。status 查不到時直接返回、交由退避處理。
 */
async function waitForSlot(interpreterUrl) {
  const statusUrl = interpreterUrl.replace('/interpreter', '/status');
  try {
    const res = await fetch(statusUrl, {
      headers: { 'User-Agent': OVERPASS_HEADERS['User-Agent'] },
      signal: AbortSignal.timeout(30_000),
    });
    const txt = await res.text();
    if (/slots? available now/i.test(txt) || !/Slot available after/i.test(txt)) return;
    const waits = [...txt.matchAll(/in (\d+) seconds/g)].map((m) => Number(m[1]));
    if (waits.length) {
      const w = Math.min(...waits);
      if (w > 0) {
        console.log(`    · 等待 Overpass 空檔約 ${w}s…`);
        await sleep((w + 2) * 1000);
      }
    }
  } catch {
    /* status 端點查不到就略過，直接嘗試查詢 */
  }
}

/**
 * 送出 Overpass QL 查詢，內建：全域間隔節流、slot 等待、429／5xx 指數退避重試、
 * 尊重 Retry-After、端點輪替、逾時保護。多次重試仍失敗才 throw。
 */
async function overpassQuery(ql) {
  let endpointIdx = 0;
  let lastErr;
  for (let attempt = 1; attempt <= OVERPASS_MAX_ATTEMPTS; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[endpointIdx % OVERPASS_ENDPOINTS.length];
    await globalSpacing();
    if (endpoint.includes('overpass-api.de')) await waitForSlot(endpoint);

    let res;
    try {
      res = await fetch(endpoint, {
        method: 'POST',
        headers: OVERPASS_HEADERS,
        body: ql,
        signal: AbortSignal.timeout(OVERPASS_TIMEOUT_MS),
      });
    } catch (err) {
      // 網路錯誤／逾時：屬暫時性，退避後重試
      lastErr = err;
      if (attempt === OVERPASS_MAX_ATTEMPTS) break;
      const backoff = Math.min(60_000, 4000 * 2 ** (attempt - 1));
      console.log(`    · 連線失敗（${err.message}），等待 ${Math.round(backoff / 1000)}s 後重試（${attempt}/${OVERPASS_MAX_ATTEMPTS}）…`);
      endpointIdx++;
      await sleep(backoff);
      continue;
    }

    // 429（限流）／406（常見於前置 CDN 對無 UA 請求的誤判）／504／5xx：視為暫時性，退避後重試
    if (res.status === 429 || res.status === 406 || res.status === 504 || res.status >= 500) {
      const retryAfter = Number(res.headers.get('retry-after')) || 0;
      const backoff = retryAfter * 1000 || Math.min(60_000, 4000 * 2 ** (attempt - 1));
      console.log(`    · Overpass ${res.status}（限流/忙碌/暫時性阻擋），等待 ${Math.round(backoff / 1000)}s 後重試（${attempt}/${OVERPASS_MAX_ATTEMPTS}）…`);
      endpointIdx++; // 換另一個端點
      lastErr = new Error(`HTTP ${res.status}`);
      await sleep(backoff);
      continue;
    }

    // 其餘非 2xx（4xx，如 400 查詢錯、403 政策阻擋）：確定性錯誤，不重試、立即拋出
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  }
  throw lastErr ?? new Error('Overpass 查詢失敗');
}

// 線名 → way 幾何 的快取：同一條線（山手線、上越新幹線…）跨多段重複出現時，
// 只查一次 Overpass，大幅降低請求數與被限流的機率。
const lineWaysCache = new Map();

/** 一次查詢取得某線名對應 route relation 的所有 way 幾何（合併 id 解析與幾何抓取）。
 *  查無該線名時回傳空陣列。結果依線名快取。 */
async function fetchLineWays(name) {
  if (lineWaysCache.has(name)) return lineWaysCache.get(name);
  const ql = `[out:json][timeout:120];\nrelation["type"="route"]["route"="railway"]["name"="${name}"];\nway(r);\nout geom;`;
  const data = await overpassQuery(ql);
  const ways = (data.elements ?? [])
    .filter((el) => el.type === 'way' && el.geometry?.length > 1)
    .map((el) => el.geometry.map((g) => [g.lon, g.lat]));
  lineWaysCache.set(name, ways);
  return ways;
}

/** 輕量檢查某線名是否存在對應 route relation（--verify-names 用，只取 id 不抓幾何）*/
async function relationExists(name) {
  const ql = `[out:json][timeout:60];\nrelation["type"="route"]["route"="railway"]["name"="${name}"];\nout ids;`;
  const data = await overpassQuery(ql);
  return (data.elements?.length ?? 0) > 0;
}

/** 依候選名稱清單依序嘗試，回傳第一個查得到幾何的 { name, ways }。
 *  皆查無回傳 null；若因網路/服務錯誤而無法判定，回傳 { error }（讓上層區分
 *  「名稱錯」與「連不到 Overpass」，避免把網路問題誤報成名稱需要調整）。 */
async function resolveLeg(candidates) {
  let sawError = null;
  for (const name of candidates) {
    try {
      const ways = await fetchLineWays(name);
      if (ways.length > 0) return { name, ways };
    } catch (err) {
      sawError = err.message;
    }
  }
  return sawError ? { error: sawError } : null;
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

/** 依「leg（候選名稱組）」清單依序抓取＋縫合＋串接成單一 corridor 折線。
 *  每個 leg 會嘗試其候選名稱直到查到 relation；查無則跳過該 leg（記警告）。 */
async function buildCorridor(legs) {
  let corridor = [];
  for (const candidates of legs) {
    const resolved = await resolveLeg(candidates);
    if (!resolved) {
      console.warn(`  ⚠ 此段候選名稱皆查無 route relation：${candidates.join(' / ')}`);
      continue;
    }
    if (resolved.error) {
      // 連不到 Overpass 或查詢失敗：整段擷取交由上層 try/catch 中止，保留原有 viaCoords
      throw new Error(`Overpass 查詢失敗（${resolved.error}）`);
    }
    const line = stitchWays(resolved.ways);
    if (line.length < 2) {
      console.warn(`  ⚠ 「${resolved.name}」縫合後點數不足`);
      continue;
    }
    console.log(`    · 使用路線「${resolved.name}」（${line.length} 點）`);
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

      const route = RAIL_ROUTES[seg.label];
      if (route === null) continue; // 明確標記為非鐵路（如渡輪），略過不警告
      const legs = route ?? [[seg.label]];

      console.log(`\nDay${day.day} [${seg.label}] ${from.name} → ${to.name}`);
      console.log(`  路線候選：${legs.map((l) => l.join('/')).join(' → ')}`);

      try {
        const corridor = await buildCorridor(legs);
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

/**
 * --verify-names 模式：只對對應表中所有候選名稱做輕量 `out ids` 查詢，
 * 印出每個 leg「用了哪個候選 / 全部查無」，讓使用者在跑重量級幾何擷取前，
 * 先花幾十秒確認名稱是否對得上 OSM，快速收斂需要人工調整的線名。
 * 不觸碰任何資料檔。
 */
async function verifyNames() {
  console.log('名稱驗證模式：逐一查詢對應表候選名稱是否存在於 OSM …\n');
  let resolvedCount = 0;
  let unresolved = [];
  let networkErrors = 0;
  for (const [label, route] of Object.entries(RAIL_ROUTES)) {
    if (route === null) {
      console.log(`◦ [${label}] 非鐵路，略過`);
      continue;
    }
    console.log(`[${label}]`);
    for (const candidates of route) {
      // 輕量檢查：逐一候選名稱查是否存在對應 relation（只取 id，不抓幾何）
      let hit = null;
      let sawError = null;
      for (const name of candidates) {
        try {
          if (await relationExists(name)) {
            hit = name;
            break;
          }
        } catch (err) {
          sawError = err.message;
        }
      }
      if (hit) {
        console.log(`  ✓ ${hit}  ← 候選：${candidates.join(' / ')}`);
        resolvedCount++;
      } else if (sawError) {
        console.log(`  ⚠ 查詢失敗（${sawError}）：${candidates.join(' / ')}`);
        networkErrors++;
      } else {
        console.log(`  ✗ 全部查無：${candidates.join(' / ')}`);
        unresolved.push(`[${label}] ${candidates.join(' / ')}`);
      }
    }
  }
  if (networkErrors > 0) {
    console.log(`\n⚠ 有 ${networkErrors} 個 leg 因網路/服務錯誤無法判定（非名稱問題）。請確認此環境能連到 Overpass 後重跑。`);
  }
  console.log(`\n── 完成：${resolvedCount} 個 leg 有對應 relation。`);
  if (unresolved.length) {
    console.log(`需要人工調整候選名稱的 leg（共 ${unresolved.length}）：`);
    for (const u of unresolved) console.log(`  · ${u}`);
    console.log('\n請到 https://www.openstreetmap.org 或 https://overpass-turbo.eu 查該路線的正確 name 標記，更新 RAIL_ROUTES 後重跑。');
  } else {
    console.log('全部候選名稱皆可對應，可直接執行完整幾何擷取。');
  }
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes('--verify-names')) {
    await verifyNames();
    return;
  }

  // 從 index.ts 收集報告書資料檔；排除非資料模組（types / index）
  const NON_DATA = new Set(['types', 'index']);
  const arg = args.find((a) => !a.startsWith('--'));
  if (arg && !/^[a-z0-9-]+$/i.test(arg)) {
    console.error(`參數「${arg}」不是有效的報告書 slug（只能是英數字與連字號）。`);
    console.error('提示：若貼上的指令含有 zsh 不支援的行內「#」註解，「#」可能被誤當成參數。');
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

// 僅在直接執行本檔（而非被測試檔 import）時才啟動，方便離線單元測試核心演算法
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { stitchWays, sliceBetween, buildCorridor, haversineKm };
