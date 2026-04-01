/**
 * 將 zephlog/筆記/日本觀光列車/*.md 合併為上一層的 日本觀光列車.md，並刪除子目錄檔案。
 * 錨點 id 與 [...slug].astro 內 SCENIC_LEAF_TO_ANCHOR 需一致。
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SUB = path.join(__dirname, '../src/content/blog/zephlog/筆記/日本觀光列車');
const OUT = path.join(__dirname, '../src/content/blog/zephlog/筆記/日本觀光列車.md');

/** 同列車多檔時，統一用此錨點（與舊 train-* slug 對齊） */
const FILE_TO_ANCHOR = {
  'aoniyoshi-train.md': 'aoniyoshi-train',
  'Aoniyoshi.md': 'aoniyoshi-train',
  'train-ametsuchi.md': 'train-ametsuchi',
  'あめつち.md': 'train-ametsuchi',
  'train-etsetora.md': 'train-etsetora',
  'etSETOra-エトセトラ.md': 'train-etsetora',
  'train-hanaakari.md': 'train-hanaakari',
  'はなあかり.md': 'train-hanaakari',
  'train-hinotori-firebird.md': 'train-hinotori-firebird',
  'Hinotori-火鳥.md': 'train-hinotori-firebird',
  'train-iyonada-monogatari.md': 'train-iyonada-monogatari',
  '伊予灘物語.md': 'train-iyonada-monogatari',
  'train-kyotrain-garaku.md': 'train-kyotrain-garaku',
  'train-la-malle-de-bois.md': 'train-la-malle-de-bois',
  'La-Malle-de-Bois.md': 'train-la-malle-de-bois',
  'train-mahoroba.md': 'train-mahoroba',
  'まほろば.md': 'train-mahoroba',
  'train-sea-spica.md': 'train-sea-spica',
  'Sea-Spica.md': 'train-sea-spica',
  'train-shimakaze.md': 'train-shimakaze',
  'Shimakaze志摩之風.md': 'train-shimakaze',
  'train-tango-kuromatsu.md': 'train-tango-kuromatsu',
  '丹後黑松號.md': 'train-tango-kuromatsu',
  'train-west-express-ginga.md': 'train-west-express-ginga',
  'WEST-EXPRESS-銀河.md': 'train-west-express-ginga',
  'yufuin-no-mori.md': 'yufuin-no-mori',
  '由布院之森.md': 'yufuin-no-mori',
  '雪月花.md': '雪月花',
  '青之交響曲.md': '青之交響曲',
  '指宿之玉手箱.md': '指宿之玉手箱',
  '四國真中千年物語.md': '四國真中千年物語',
  '志国土佐-時代黎明物語.md': '志国土佐-時代黎明物語',
  '海里號.md': '海里號',
  '瑞風-Mizukaze.md': '瑞風-Mizukaze',
  '越乃-ShuKura號.md': '越乃-ShuKura號',
};

function parseFile(raw) {
  if (!raw.startsWith('---')) return { body: raw.trimEnd(), title: '' };
  const end = raw.indexOf('\n---', 3);
  if (end === -1) return { body: raw.trimEnd(), title: '' };
  const fm = raw.slice(3, end);
  const body = raw.slice(end + 4).trim();
  const m = fm.match(/^title:\s*(.+)$/m);
  let title = m ? m[1].trim() : '';
  if (
    (title.startsWith('"') && title.endsWith('"')) ||
    (title.startsWith("'") && title.endsWith("'"))
  ) {
    title = title.slice(1, -1).replace(/\\"/g, '"');
  }
  return { title, body };
}

function cleanBody(body, title) {
  let b = body.replace(/\r\n/g, '\n').trim();
  b = b.replace(/^來源分類：[^\n]+\n*/m, '');
  const h1 = new RegExp(`^#\\s*${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\n+`, 'm');
  b = b.replace(h1, '');
  return b.trim() || '_（無內文）_';
}

function main() {
  const files = fs.readdirSync(SUB).filter((f) => f.endsWith('.md'));
  const byAnchor = new Map();

  for (const f of files) {
    const anchor = FILE_TO_ANCHOR[f];
    if (!anchor) {
      console.warn('missing FILE_TO_ANCHOR for', f);
      continue;
    }
    const raw = fs.readFileSync(path.join(SUB, f), 'utf8');
    const { title, body } = parseFile(raw);
    const displayTitle = title || path.basename(f, '.md');
    const cleaned = cleanBody(body, displayTitle);
    const prev = byAnchor.get(anchor);
    const chunk = { displayTitle, cleaned, file: f };
    if (!prev) byAnchor.set(anchor, [chunk]);
    else prev.push(chunk);
  }

  const order = [
    'aoniyoshi-train',
    'train-ametsuchi',
    'train-etsetora',
    'train-hanaakari',
    'train-hinotori-firebird',
    'train-iyonada-monogatari',
    'train-kyotrain-garaku',
    'train-la-malle-de-bois',
    'train-mahoroba',
    'train-sea-spica',
    'train-shimakaze',
    'train-tango-kuromatsu',
    'train-west-express-ginga',
    'yufuin-no-mori',
    '雪月花',
    '青之交響曲',
    '指宿之玉手箱',
    '四國真中千年物語',
    '志国土佐-時代黎明物語',
    '海里號',
    '瑞風-Mizukaze',
    '越乃-ShuKura號',
  ];

  const sections = [];
  for (const anchor of order) {
    const chunks = byAnchor.get(anchor);
    if (!chunks) continue;
    const displayTitle = chunks[0].displayTitle;
    const mergedBody = chunks.map((c) => c.cleaned).join('\n\n---\n\n');
    sections.push(
      `<h2 id="${anchor}">${displayTitle}</h2>\n\n${mergedBody}`,
    );
    byAnchor.delete(anchor);
  }
  if (byAnchor.size) {
    console.warn('unmerged anchors:', [...byAnchor.keys()]);
  }

  const frontmatter = `---
title: 日本觀光列車
description: 觀光列車一覽與各路線筆記（合併自子目錄）。
date: '2026-03-31'
draft: false
---
`;

  const intro = `以下為各路線／主題筆記，可使用目錄或網址錨點（\`#錨點 id\`）直接跳轉。\n\n`;

  fs.writeFileSync(OUT, frontmatter + intro + sections.join('\n\n'), 'utf8');
  console.log('Wrote', OUT);

  for (const f of files) {
    fs.unlinkSync(path.join(SUB, f));
  }
  try {
    fs.rmdirSync(SUB);
  } catch (e) {
    console.warn('rmdir', SUB, e.message);
  }
  console.log('Removed', files.length, 'files under', SUB);
}

main();
