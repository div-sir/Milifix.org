/**
 * 艙等：合併為 zephlog/艙等-統整.md，刪除 zephlog/艙等/
 * Record：合併為 zephlog/筆記/record-統整.md，刪除 zephlog/Record/
 * 活動年表：整資料夾刪除
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ZEPH = path.join(__dirname, '../src/content/blog/zephlog');
const CABIN_DIR = path.join(ZEPH, '艙等');
const CABIN_OUT = path.join(ZEPH, '艙等-統整.md');
const RECORD_DIR = path.join(ZEPH, 'Record');
const RECORD_OUT = path.join(ZEPH, '筆記', 'record-統整.md');
const TIMELINE_DIR = path.join(ZEPH, '活動年表');

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

function mergeCabin() {
  const files = walkMd(CABIN_DIR);
  if (!files.length) {
    console.warn('mergeCabin: skip, no files');
    return;
  }
  const byAirline = new Map();
  for (const f of files) {
    const rel = path.relative(CABIN_DIR, f);
    const airline = rel.split(path.sep)[0] || '其他';
    if (!byAirline.has(airline)) byAirline.set(airline, []);
    byAirline.get(airline).push({ f, ...parseMd(f) });
  }
  const airlines = [...byAirline.keys()].sort((a, b) => a.localeCompare(b, 'zh-Hant'));

  const lines = [
    '---',
    `title: ${yamlEscape('艙等資料（統整）')}`,
    `description: ${yamlEscape(`共 ${files.length} 筆，由原「艙等」依航空公司分組合併。`)}`,
    "date: '2026-03-31'",
    'draft: false',
    '---',
    '',
    '> 原多檔艙等筆記合併；二級標題為航空公司，三級為單一艙等／機型條目。',
    '',
  ];

  for (const air of airlines) {
    lines.push(`## ${air}`, '');
    const items = byAirline.get(air);
    items.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'));
    for (const e of items) {
      const rel = path.relative(CABIN_DIR, e.f).replace(/\\/g, '/');
      lines.push(`### ${e.title}`, '');
      lines.push(`*來源檔：\`${rel}\`*`, '');
      if (e.body.trim()) lines.push(e.body.trim(), '');
      lines.push('---', '');
    }
  }

  fs.writeFileSync(CABIN_OUT, lines.join('\n'), 'utf8');
  fs.rmSync(CABIN_DIR, { recursive: true, force: true });
  console.log('Cabin merged →', CABIN_OUT);
}

function mergeRecord() {
  const files = walkMd(RECORD_DIR);
  if (!files.length) {
    console.warn('mergeRecord: skip');
    return;
  }
  const entries = files.map((f) => ({ f, ...parseMd(f) }));
  entries.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'));

  const lines = [
    '---',
    `title: ${yamlEscape('Record（統整）')}`,
    `description: ${yamlEscape(`共 ${entries.length} 筆，由原 zephlog/Record 合併，歸入筆記。`)}`,
    "date: '2026-03-31'",
    'draft: false',
    '---',
    '',
    '> 飛行／行程紀錄類原始條目合併。',
    '',
  ];

  for (const e of entries) {
    const rel = path.basename(e.f);
    lines.push(`## ${e.title}`, '');
    lines.push(`*來源檔：\`${rel}\`*`, '');
    if (e.body.trim()) lines.push(e.body.trim(), '');
    lines.push('---', '');
  }

  fs.mkdirSync(path.dirname(RECORD_OUT), { recursive: true });
  fs.writeFileSync(RECORD_OUT, lines.join('\n'), 'utf8');
  fs.rmSync(RECORD_DIR, { recursive: true, force: true });
  console.log('Record merged →', RECORD_OUT);
}

function rmTimeline() {
  if (!fs.existsSync(TIMELINE_DIR)) return;
  fs.rmSync(TIMELINE_DIR, { recursive: true, force: true });
  console.log('Removed', TIMELINE_DIR);
}

mergeCabin();
mergeRecord();
rmTimeline();
console.log('Done.');
