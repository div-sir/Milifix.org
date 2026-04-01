import fs from 'node:fs/promises';
import path from 'node:path';

const CABIN_DIR = '/Users/solilium/my-portfolio/src/content/blog/zephlog/艙等';

const AIRLINE_PREFIX_MAP = [
  { prefix: 'ana-', folder: 'ANA' },
  { prefix: 'china-airline-', folder: 'China Airline' },
  { prefix: 'cathay-airline-', folder: 'Cathay Airline' },
  { prefix: 'eva-air-', folder: 'EVA Air' },
  { prefix: 'singapore-airline-', folder: 'Singapore Airline' },
  { prefix: 'starlux-', folder: 'STARLUX' },
];

function pickFolder(fileName) {
  for (const { prefix, folder } of AIRLINE_PREFIX_MAP) {
    if (fileName.startsWith(prefix)) return folder;
  }
  return 'Others';
}

async function main() {
  const entries = await fs.readdir(CABIN_DIR, { withFileTypes: true });
  let moved = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
    const folder = pickFolder(entry.name);
    const toDir = path.join(CABIN_DIR, folder);
    const fromPath = path.join(CABIN_DIR, entry.name);
    const toPath = path.join(toDir, entry.name);

    await fs.mkdir(toDir, { recursive: true });
    try {
      await fs.access(toPath);
      skipped += 1;
      continue;
    } catch {
      // destination does not exist
    }
    await fs.rename(fromPath, toPath);
    moved += 1;
  }

  console.log(JSON.stringify({ moved, skipped, baseDir: CABIN_DIR }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
