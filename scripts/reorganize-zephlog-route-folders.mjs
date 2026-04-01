import fs from 'node:fs/promises';
import path from 'node:path';

const TARGET_DIR =
  '/Users/solilium/my-portfolio/src/content/blog/zephlog/筆記/JR PASS & 參考票價/新幹線參考票價';

function sanitizeFolderName(name) {
  return name
    .trim()
    .replace(/[\/\\]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/\.+$/g, '');
}

function readTitle(markdown) {
  const match = markdown.match(/^title:\s*["']?(.+?)["']?\s*$/m);
  return match?.[1]?.trim() || null;
}

async function main() {
  const entries = await fs.readdir(TARGET_DIR, { withFileTypes: true });
  let moved = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const filePath = path.join(TARGET_DIR, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const title = readTitle(raw);

    if (!title) {
      skipped += 1;
      continue;
    }

    const folder = sanitizeFolderName(title);
    if (!folder) {
      skipped += 1;
      continue;
    }

    const targetDir = path.join(TARGET_DIR, folder);
    const targetPath = path.join(targetDir, entry.name);

    await fs.mkdir(targetDir, { recursive: true });
    await fs.rename(filePath, targetPath);
    moved += 1;
  }

  console.log(JSON.stringify({ moved, skipped, target: TARGET_DIR }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
