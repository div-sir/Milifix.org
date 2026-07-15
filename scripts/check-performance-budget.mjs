import { readFile, readdir, stat } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const root = new URL('../dist/', import.meta.url).pathname;
const limits = { '.js': 1_250_000, '.css': 350_000 };
const totalLimit = 4_000_000;
const meridielInitialJsLimit = 300_000;
const assets = [];

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (limits[extname(entry.name)]) assets.push({ path, size: (await stat(path)).size });
  }
}

await walk(root);
const failures = assets.filter((asset) => asset.size > limits[extname(asset.path)]);
const total = assets.reduce((sum, asset) => sum + asset.size, 0);
if (total > totalLimit) failures.push({ path: root, size: total });

const meridielDir = join(root, 'meridiel');
const meridielHtml = await readFile(join(meridielDir, 'index.html'), 'utf8');
const initialScriptSources = [...meridielHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map((match) => match[1])
  .filter((src) => !/^https?:\/\//i.test(src));
const meridielInitialJs = (await Promise.all(initialScriptSources.map(async (src) => {
  const path = join(meridielDir, src.split('?')[0]);
  return (await stat(path)).size;
}))).reduce((sum, size) => sum + size, 0);
if (meridielInitialJs > meridielInitialJsLimit) {
  failures.push({ path: join(meridielDir, 'index.html'), size: meridielInitialJs });
}

if (failures.length) {
  for (const item of failures) console.error(`Performance budget exceeded: ${relative(root, item.path) || 'all assets'} (${item.size} bytes)`);
  process.exit(1);
}
console.log(`Performance budget OK: ${assets.length} JS/CSS assets, ${total} bytes total.`);
console.log(`Meridiel initial JS: ${meridielInitialJs} / ${meridielInitialJsLimit} bytes.`);
