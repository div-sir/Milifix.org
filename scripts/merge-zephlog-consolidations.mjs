/**
 * 合併：東京必比登清單、JR PASS & 參考票價（含 curated jr-passes、筆記根目錄 jr-pass 單檔）
 * 搬移：curated/scenic-trains → 筆記/日本觀光列車
 * 刪除：curated overview travel-catalog、curated/categories 全部
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZEPH = path.join(__dirname, '../src/content/blog/zephlog');
const TRAVEL = path.join(ZEPH, '筆記');
const TOKYO_DIR = path.join(TRAVEL, '東京必比登清單');
const JR_DIR = path.join(TRAVEL, 'JR PASS & 參考票價');
const SCENIC_DEST = path.join(TRAVEL, '日本觀光列車');
const CURATED_SCENIC = path.join(ZEPH, 'curated/scenic-trains');
const CURATED_JR = path.join(ZEPH, 'curated/jr-passes');
const CURATED_OVERVIEW = path.join(ZEPH, 'curated/overview/travel-catalog.md');
const CURATED_CATEGORIES = path.join(ZEPH, 'curated/categories');

const TOKYO_OUT = path.join(TRAVEL, '東京必比登餐廳110家統整-米其林筆記.md');
const JR_OUT = path.join(TRAVEL, 'jr-pass-與參考票價-統整.md');

function walkMd(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  const stack = [dir];
  while (stack.length) {
    const d = stack.pop();
    for (const name of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, name.name);
      if (name.isDirectory()) stack.push(p);
      else if (name.isFile() && name.name.endsWith('.md')) out.push(p);
    }
  }
  return out;
}

function parseMd(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  if (!raw.startsWith('---')) {
    return { title: path.basename(filePath, '.md'), description: '', body: raw.trim(), date: '2026-03-31' };
  }
  const end = raw.indexOf('\n---', 3);
  if (end === -1) {
    return { title: path.basename(filePath, '.md'), description: '', body: raw.trim(), date: '2026-03-31' };
  }
  const fmBlock = raw.slice(3, end);
  const body = raw.slice(end + 4).replace(/^\r?\n/, '');
  const data = {};
  for (const line of fmBlock.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z0-9_]+):\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).replace(/\\"/g, '"');
    }
    data[m[1]] = v;
  }
  return {
    title: data.title || path.basename(filePath, '.md'),
    description: data.description || '',
    date: data.date || '2026-03-31',
    body: body.trimEnd(),
  };
}

function yamlEscape(s) {
  const t = String(s).replace(/\r\n/g, '\n');
  if (/[\n:#"']/.test(t)) return JSON.stringify(t);
  return t;
}

function mergeTokyo() {
  const files = walkMd(TOKYO_DIR);
  if (!files.length) {
    console.warn('mergeTokyo: no files under', TOKYO_DIR);
    return;
  }
  const entries = files.map((f) => ({ f, ...parseMd(f) }));
  entries.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'));

  const lines = [
    '---',
    `title: ${yamlEscape('東京必比登餐廳 110 家統整：米其林筆記')}`,
    `description: ${yamlEscape(`共 ${entries.length} 筆餐廳條目，併附原始 CSV 匯出連結；以下由原「東京必比登清單」資料夾合併。`)}`,
    "date: '2026-03-31'",
    'draft: false',
    '---',
    '',
    '> 以下由原多筆 Markdown 合併，條目間以 `---` 分隔；標題依餐廳／店家名稱排序。',
    '',
  ];

  for (const e of entries) {
    const rel = path.relative(TOKYO_DIR, e.f).replace(/\\/g, '/');
    lines.push(`## ${e.title}`, '');
    lines.push(`*來源檔：\`${rel}\`*`, '');
    if (e.body.trim()) lines.push(e.body.trim(), '');
    lines.push('---', '');
  }

  fs.writeFileSync(TOKYO_OUT, lines.join('\n'), 'utf8');
  fs.rmSync(TOKYO_DIR, { recursive: true, force: true });
  console.log('Tokyo merged →', TOKYO_OUT, 'removed tree', TOKYO_DIR);
}

function jrSectionTitle(relFromJrRoot) {
  const parts = relFromJrRoot.split(path.sep).filter(Boolean);
  if (parts.length <= 1) return '根目錄';
  return parts.slice(0, -1).join(' / ');
}

function mergeJr() {
  const files = [...walkMd(JR_DIR)];
  const extra = [
    path.join(CURATED_JR, 'tokyo-wide-pass.md'),
    path.join(CURATED_JR, 'nex-roundtrip-ticket.md'),
    path.join(TRAVEL, 'jr-pass-1d64cd6fef0c80aea2a0d8c9c3f70875.md'),
  ];
  for (const p of extra) {
    if (fs.existsSync(p)) files.push(p);
  }

  const curatedFirst = [];
  const fromJrTree = [];
  const loose = [];

  for (const f of files) {
    const norm = f.replace(/\\/g, '/');
    if (norm.includes('/curated/jr-passes/')) curatedFirst.push(f);
    else if (norm.includes('/JR PASS & 參考票價/')) fromJrTree.push(f);
    else loose.push(f);
  }

  const ordered = [...curatedFirst, ...loose.sort(), ...fromJrTree.sort()];

  const lines = [
    '---',
    `title: ${yamlEscape('JR PASS 與參考票價（統整）')}`,
    `description: ${yamlEscape(
      'JR PASS、周遊券與新幹線參考票價等筆記統整（含原 curated JR Pass 與筆記資料夾）。',
    )}`,
    "date: '2026-03-31'",
    'draft: false',
    '---',
    '',
    '> 由原「JR PASS & 參考票價」多檔與精選 JR Pass 條目合併；區段依來源路徑分組。',
    '',
  ];

  if (curatedFirst.length) {
    lines.push('## 精選 JR Pass（原 curated）', '');
    for (const f of curatedFirst) {
      const e = parseMd(f);
      lines.push(`### ${e.title}`, '');
      if (e.body.trim()) lines.push(e.body.trim(), '');
      lines.push('---', '');
    }
  }

  if (loose.length) {
    lines.push('## 筆記 · 其他 JR 筆記', '');
    for (const f of loose) {
      const e = parseMd(f);
      lines.push(`### ${e.title}`, '');
      lines.push(`*來源：\`${path.relative(ZEPH, f).replace(/\\/g, '/')}\`*`, '');
      if (e.body.trim()) lines.push(e.body.trim(), '');
      lines.push('---', '');
    }
  }

  const bySection = new Map();
  for (const f of fromJrTree) {
    const rel = path.relative(JR_DIR, f);
    const sec = jrSectionTitle(rel);
    if (!bySection.has(sec)) bySection.set(sec, []);
    bySection.get(sec).push({ f, ...parseMd(f) });
  }

  const secKeys = [...bySection.keys()].sort((a, b) => a.localeCompare(b, 'zh-Hant'));
  for (const sec of secKeys) {
    lines.push(`## ${sec}`, '');
    const items = bySection.get(sec);
    items.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'));
    for (const e of items) {
      const rel = path.relative(JR_DIR, e.f).replace(/\\/g, '/');
      lines.push(`### ${e.title}`, '');
      lines.push(`*來源檔：\`${rel}\`*`, '');
      if (e.body.trim()) lines.push(e.body.trim(), '');
      lines.push('---', '');
    }
  }

  fs.writeFileSync(JR_OUT, lines.join('\n'), 'utf8');
  fs.rmSync(JR_DIR, { recursive: true, force: true });
  for (const p of curatedFirst) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  for (const p of loose) {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  }
  console.log('JR merged →', JR_OUT, 'removed', JR_DIR);
}

function moveScenicCurated() {
  if (!fs.existsSync(CURATED_SCENIC)) return;
  fs.mkdirSync(SCENIC_DEST, { recursive: true });
  for (const name of fs.readdirSync(CURATED_SCENIC)) {
    if (!name.endsWith('.md')) continue;
    const from = path.join(CURATED_SCENIC, name);
    const to = path.join(SCENIC_DEST, name);
    if (fs.existsSync(to)) {
      const alt = path.join(SCENIC_DEST, `curated-${name}`);
      fs.renameSync(from, alt);
      console.warn('scenic name clash, renamed to', path.basename(alt));
    } else {
      fs.renameSync(from, to);
    }
  }
  fs.rmSync(CURATED_SCENIC, { recursive: true, force: true });
  console.log('Moved curated scenic →', SCENIC_DEST);
}

function deleteCuratedMeta() {
  if (fs.existsSync(CURATED_OVERVIEW)) fs.unlinkSync(CURATED_OVERVIEW);
  if (fs.existsSync(CURATED_CATEGORIES)) {
    for (const name of fs.readdirSync(CURATED_CATEGORIES)) {
      if (name.endsWith('.md')) fs.unlinkSync(path.join(CURATED_CATEGORIES, name));
    }
    try {
      fs.rmdirSync(CURATED_CATEGORIES);
    } catch {
      /* not empty */
    }
  }
  try {
    const ovDir = path.join(ZEPH, 'curated/overview');
    if (fs.existsSync(ovDir) && fs.readdirSync(ovDir).length === 0) fs.rmdirSync(ovDir);
  } catch {
    /* */
  }
  console.log('Removed travel-catalog + categories/*.md');
}

mergeTokyo();
mergeJr();
moveScenicCurated();
deleteCuratedMeta();

// 若 jr-passes 目錄已空則刪除
try {
  const jp = path.join(ZEPH, 'curated/jr-passes');
  if (fs.existsSync(jp) && fs.readdirSync(jp).length === 0) fs.rmdirSync(jp);
} catch {
  /* */
}

console.log('Done.');
