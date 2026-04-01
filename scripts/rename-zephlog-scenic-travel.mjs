/**
 * 扁平化：筆記/日本觀光列車/觀光列車一覽 → 筆記/日本觀光列車/
 * 檔名：依規則改為可讀 slug；筆記根目錄 item-* 亦改為 title slug
 * 產出：src/data/zephlogBlogPathRedirects.json 供 [...slug] 舊網址轉址
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BLOG = path.join(__dirname, '../src/content/blog');
const ZEPH = path.join(BLOG, 'zephlog');
const TRAVEL = path.join(ZEPH, '筆記');
const SCENIC_NESTED = path.join(TRAVEL, '日本觀光列車', '觀光列車一覽');
const SCENIC_FLAT = path.join(TRAVEL, '日本觀光列車');
const REDIRECT_OUT = path.join(__dirname, '../src/data/zephlogBlogPathRedirects.json');

function readRaw(p) {
  return fs.readFileSync(p, 'utf8');
}

function parseTitle(raw) {
  if (!raw.startsWith('---')) return '';
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return '';
  const block = raw.slice(3, end);
  const m = block.match(/^title:\s*(.+)$/m);
  if (!m) return '';
  let v = m[1].trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).replace(/\\"/g, '"');
  }
  return v.trim();
}

function slugFromTitle(title) {
  if (!title) return 'untitled';
  let s = title
    .replace(/[\\/:*?"<>|#\r\n\t]/g, '')
    .replace(/\s+/g, '-')
    .replace(/·/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .trim();
  if (!s) return 'untitled';
  return s.slice(0, 96);
}

/** 觀光列車一覽內：優先保留 train-* / 固定英文名（排除 train- + 長 hex 的匯入檔） */
function scenicPreferredSlug(filePath) {
  const base = path.basename(filePath, '.md');
  const afterTrain = base.startsWith('train-') ? base.slice(6) : '';
  if (
    afterTrain &&
    /^[a-f0-9]+$/i.test(afterTrain) &&
    afterTrain.length >= 20
  ) {
    return null;
  }
  if (/^train-[a-z0-9-]+$/i.test(base)) return base;
  if (/^yufuin-no-mori$/i.test(base)) return 'yufuin-no-mori';
  if (/^aoniyoshi-train$/i.test(base)) return 'aoniyoshi-train';
  return null;
}

function collectMovesFromDir(sourceDir, destDir, idPrefix) {
  if (!fs.existsSync(sourceDir)) return [];
  const files = fs.readdirSync(sourceDir).filter((f) => f.endsWith('.md'));
  const jobs = files.map((f) => {
    const from = path.join(sourceDir, f);
    const raw = readRaw(from);
    const title = parseTitle(raw);
    const pref = scenicPreferredSlug(from);
    const baseSlug = pref || slugFromTitle(title || path.basename(f, '.md'));
    return { from, destDir, baseSlug, oldId: `${idPrefix}/${path.basename(f, '.md')}` };
  });
  return jobs;
}

function collectTravelRootItems() {
  const jobs = [];
  if (!fs.existsSync(TRAVEL)) return jobs;
  for (const name of fs.readdirSync(TRAVEL, { withFileTypes: true })) {
    if (!name.isFile() || !name.name.endsWith('.md')) continue;
    if (!/^item-[a-f0-9-]+(?:-[a-f0-9-]+)?\.md$/i.test(name.name)) continue;
    const from = path.join(TRAVEL, name.name);
    const raw = readRaw(from);
    const title = parseTitle(raw);
    const baseSlug = slugFromTitle(title || name.name);
    jobs.push({
      from,
      destDir: TRAVEL,
      baseSlug,
      oldId: `zephlog/旅行紀錄/${path.basename(name.name, '.md')}`,
    });
  }
  return jobs;
}

function assignUniqueDest(jobs) {
  /** 每個目的目錄各自追蹤 slug，避免與筆記根目錄同名誤判 */
  const usedByDir = new Map();
  function usedFor(dir) {
    if (!usedByDir.has(dir)) usedByDir.set(dir, new Map());
    return usedByDir.get(dir);
  }
  const out = [];
  const sorted = [...jobs].sort((a, b) => {
    const pa = scenicPreferredSlug(a.from) ? 0 : 1;
    const pb = scenicPreferredSlug(b.from) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return a.from.localeCompare(b.from);
  });

  for (const j of sorted) {
    const used = usedFor(j.destDir);
    let slug = j.baseSlug;
    if (!used.has(slug)) {
      used.set(slug, j.from);
      out.push({ ...j, newSlug: slug });
      continue;
    }
    const short = path.basename(j.from, '.md').replace(/[^a-f0-9]/gi, '').slice(-8) || 'x';
    let n = 2;
    let candidate = `${slug}-${short}`;
    while (used.has(candidate)) {
      candidate = `${slug}-${short}-${n++}`;
    }
    used.set(candidate, j.from);
    out.push({ ...j, newSlug: candidate });
  }
  return out;
}

function main() {
  const redirects = {};

  const scenicJobs = collectMovesFromDir(
    SCENIC_NESTED,
    SCENIC_FLAT,
    'zephlog/旅行紀錄/日本觀光列車/觀光列車一覽',
  );
  const rootItemJobs = collectTravelRootItems();
  const allAssigned = assignUniqueDest([...scenicJobs, ...rootItemJobs]);

  fs.mkdirSync(SCENIC_FLAT, { recursive: true });

  for (const j of allAssigned) {
    const dest = path.join(j.destDir, `${j.newSlug}.md`);
    if (path.resolve(j.from) === path.resolve(dest)) continue;
    if (fs.existsSync(dest) && path.resolve(j.from) !== path.resolve(dest)) {
      console.warn('skip exists:', dest, '<-', j.from);
      continue;
    }
    fs.renameSync(j.from, dest);
    const newId = `zephlog/筆記/${path.relative(TRAVEL, dest).split(path.sep).join('/').replace(/\.md$/, '')}`;
    if (j.oldId !== newId) {
      redirects[j.oldId] = newId;
    }
    console.log(j.oldId, '->', newId);
  }

  if (fs.existsSync(SCENIC_NESTED)) {
    try {
      fs.rmdirSync(SCENIC_NESTED);
    } catch {
      console.warn('could not remove 觀光列車一覽 (not empty?)');
    }
  }

  const prev = fs.existsSync(REDIRECT_OUT) ? JSON.parse(fs.readFileSync(REDIRECT_OUT, 'utf8')) : {};
  const merged = { ...prev, ...redirects };
  fs.mkdirSync(path.dirname(REDIRECT_OUT), { recursive: true });
  fs.writeFileSync(REDIRECT_OUT, JSON.stringify(merged, null, 2), 'utf8');
  console.log('Wrote', REDIRECT_OUT, Object.keys(redirects).length, 'redirects');
}

main();
