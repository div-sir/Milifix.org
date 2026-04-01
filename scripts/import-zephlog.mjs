import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE_ROOT = '/Users/solilium/Downloads/Private & Shared/ZephLog';
const TARGET_ROOT = '/Users/solilium/my-portfolio/src/content/blog/zephlog';
const DATE = '2026-03-31';

const NON_CONTENT_FILENAMES = new Set(['_all.csv', '.csv']);

function isMarkdownFile(file) {
  return file.toLowerCase().endsWith('.md');
}

function toSlug(input) {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function splitNameAndId(filename) {
  const noExt = filename.replace(/\.md$/i, '');
  const match = noExt.match(/^(.*)\s([a-f0-9]{32})$/i);
  if (!match) return { name: noExt.trim(), id: '' };
  return { name: match[1].trim(), id: match[2].toLowerCase() };
}

async function walk(dir, list = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(fullPath, list);
      continue;
    }
    if (!isMarkdownFile(entry.name)) continue;
    if ([...NON_CONTENT_FILENAMES].some((suffix) => entry.name.endsWith(suffix))) continue;
    list.push(fullPath);
  }
  return list;
}

function extractTitle(raw, fallbackTitle) {
  const lines = raw.split(/\r?\n/);
  const heading = lines.find((line) => line.trim().startsWith('# '));
  if (heading) return heading.replace(/^#\s+/, '').trim();
  return fallbackTitle;
}

function extractDescription(raw, fallbackTitle) {
  const lines = raw.split(/\r?\n/).map((line) => line.trim());
  const picked = lines.find((line) => line && !line.startsWith('#'));
  const base = picked || `ZephLog 匯入資料：${fallbackTitle}`;
  return base.length > 80 ? `${base.slice(0, 80)}…` : base;
}

function buildFrontmatter({ title, description }) {
  const quote = (value) => JSON.stringify(value ?? '');
  return [
    '---',
    `title: ${quote(title)}`,
    `description: ${quote(description)}`,
    `date: '${DATE}'`,
    'draft: false',
    '---',
    '',
  ].join('\n');
}

async function main() {
  await fs.mkdir(TARGET_ROOT, { recursive: true });
  const files = await walk(SOURCE_ROOT);
  let created = 0;
  let skipped = 0;

  for (const sourceFile of files) {
    const rel = path.relative(SOURCE_ROOT, sourceFile);
    const relDir = path.dirname(rel);
    const originalFilename = path.basename(sourceFile);
    const { name, id } = splitNameAndId(originalFilename);

    const safeBase = toSlug(name) || `item-${id || 'unknown'}`;
    const safeName = id ? `${safeBase}-${id}.md` : `${safeBase}.md`;
    const targetDir = path.join(TARGET_ROOT, relDir);
    const targetFile = path.join(targetDir, safeName);

    try {
      await fs.access(targetFile);
      skipped += 1;
      continue;
    } catch {
      // file doesn't exist, continue
    }

    const raw = await fs.readFile(sourceFile, 'utf8');
    const title = extractTitle(raw, name);
    const description = extractDescription(raw, title);
    const frontmatter = buildFrontmatter({ title, description });
    const content = `${frontmatter}${raw.trim()}\n`;

    await fs.mkdir(targetDir, { recursive: true });
    await fs.writeFile(targetFile, content, 'utf8');
    created += 1;
  }

  console.log(JSON.stringify({ totalSourceMd: files.length, created, skipped, targetRoot: TARGET_ROOT }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
