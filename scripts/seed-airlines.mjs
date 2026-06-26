/**
 * 批次匯入航空公司到 Payload CMS（idempotent：已存在的 slug 會跳過）。
 *
 * 用法：
 *   CMS_EMAIL=you@example.com CMS_PASSWORD=secret node scripts/seed-airlines.mjs
 *
 * 可選環境變數：
 *   CMS_URL              Payload 位址（預設 http://localhost:3000）
 *   CMS_AUTH_COLLECTION  登入用的 auth collection slug（預設 users）
 *
 * 旗標：
 *   --dry-run            只印出將建立哪些，不實際寫入
 *
 * 註：logo 留空，前端球面會自動以 IATA 代碼向 pics.avs.io 取圖。
 */
import { readFile } from 'node:fs/promises';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 自動載入專案根目錄的 .env（已 gitignore），免在指令列／聊天貼帳密
function loadDotenv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!existsSync(envPath)) return;
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const key = m[1];
    let val = m[2].trim().replace(/^["']|["']$/g, '');
    if (process.env[key] === undefined) process.env[key] = val;
  }
}
loadDotenv();

const CMS_URL = (process.env.CMS_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const AUTH_COLLECTION = process.env.CMS_AUTH_COLLECTION ?? 'users';
const EMAIL = process.env.CMS_EMAIL;
const PASSWORD = process.env.CMS_PASSWORD;
const DRY_RUN = process.argv.includes('--dry-run');

function die(msg) {
  console.error(`✖ ${msg}`);
  process.exit(1);
}

async function login() {
  const res = await fetch(`${CMS_URL}/api/${AUTH_COLLECTION}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!res.ok) die(`登入失敗（${res.status}）：確認 CMS_EMAIL / CMS_PASSWORD / CMS_AUTH_COLLECTION（目前=${AUTH_COLLECTION}）`);
  const data = await res.json();
  if (!data.token) die('登入回應沒有 token');
  return data.token;
}

async function airlineExists({ slug, iataCode }, token) {
  // slug 或 IATA 任一已存在就視為重複，避免同公司不同 slug 被重複建立
  const params = new URLSearchParams({ limit: '1' });
  params.set('where[or][0][slug][equals]', slug);
  params.set('where[or][1][iataCode][equals]', iataCode);
  const res = await fetch(`${CMS_URL}/api/airlines?${params}`, {
    headers: { Authorization: `JWT ${token}` },
  });
  if (!res.ok) die(`查詢 "${slug}/${iataCode}" 失敗（${res.status}）`);
  const data = await res.json();
  return (data.docs?.length ?? 0) > 0;
}

async function createAirline(airline, token) {
  const res = await fetch(`${CMS_URL}/api/airlines`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `JWT ${token}` },
    body: JSON.stringify(airline),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`建立 "${airline.name}" 失敗（${res.status}）：${text.slice(0, 200)}`);
  }
}

async function main() {
  if (!DRY_RUN && (!EMAIL || !PASSWORD)) die('請設定 CMS_EMAIL 與 CMS_PASSWORD 環境變數');

  const raw = await readFile(path.join(__dirname, 'airlines-seed.json'), 'utf8');
  const airlines = JSON.parse(raw);
  console.log(`讀入 ${airlines.length} 家航空。CMS=${CMS_URL}${DRY_RUN ? '（dry-run）' : ''}`);

  const token = DRY_RUN ? null : await login();

  let created = 0, skipped = 0, failed = 0;
  for (const a of airlines) {
    try {
      if (token && (await airlineExists(a, token))) {
        console.log(`· 跳過（已存在）：${a.name} [${a.iataCode}]`);
        skipped++;
        continue;
      }
      if (DRY_RUN) {
        console.log(`+ 將建立：${a.name} [${a.iataCode}] · ${a.alliance}`);
        created++;
        continue;
      }
      await createAirline(a, token);
      console.log(`✔ 已建立：${a.name} [${a.iataCode}]`);
      created++;
    } catch (err) {
      console.error(`✖ ${err.message}`);
      failed++;
    }
  }

  console.log(`\n完成：建立 ${created}、跳過 ${skipped}、失敗 ${failed}`);
  if (failed) process.exit(1);
}

main().catch((err) => die(err.message));
