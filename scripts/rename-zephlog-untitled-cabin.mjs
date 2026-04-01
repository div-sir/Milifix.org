import fs from 'node:fs/promises';
import path from 'node:path';

const CABIN_DIR = '/Users/solilium/my-portfolio/src/content/blog/zephlog/艙等';

function toSlug(input) {
  return (input || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase();
}

function pick(regex, text) {
  const m = text.match(regex);
  return m?.[1]?.trim() || '';
}

function compact(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function parseFields(content) {
  const airline = pick(/^航空公司:\s*([^\n(]+)/m, content);
  const aircraft = pick(/^飛機:\s*([^\n(]+)/m, content).split(',')[0]?.trim() || '';
  const cabin = pick(/^艙等:\s*([^\n]+)/m, content);
  return { airline: compact(airline), aircraft: compact(aircraft), cabin: compact(cabin) };
}

function readableTitle({ airline, aircraft, cabin }, id) {
  const parts = [airline, aircraft, cabin].filter(Boolean);
  if (parts.length === 0) return `Cabin Profile ${id.slice(0, 8)}`;
  return parts.join('｜');
}

function slugBase({ airline, aircraft, cabin }, id) {
  const source = `${airline} ${aircraft} ${cabin}`.trim();
  const s = toSlug(source);
  return s || `cabin-profile-${id.slice(0, 8)}`;
}

async function main() {
  const entries = await fs.readdir(CABIN_DIR, { withFileTypes: true });
  let renamed = 0;
  let skipped = 0;

  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const match = entry.name.match(/^untitled-([a-f0-9]{32})\.md$/i);
    if (!match) continue;

    const id = match[1].toLowerCase();
    const filePath = path.join(CABIN_DIR, entry.name);
    const raw = await fs.readFile(filePath, 'utf8');
    const fields = parseFields(raw);
    const newTitle = readableTitle(fields, id);
    const base = slugBase(fields, id);
    const newName = `${base}-${id}.md`;
    const newPath = path.join(CABIN_DIR, newName);

    let next = raw
      .replace(/^title:\s*"Untitled"\s*$/m, `title: "${newTitle}"`)
      .replace(/^#\s*Untitled\s*$/m, `# ${newTitle}`);

    if (next === raw && entry.name === newName) {
      skipped += 1;
      continue;
    }

    await fs.writeFile(filePath, next, 'utf8');
    if (entry.name !== newName) {
      await fs.rename(filePath, newPath);
    }
    renamed += 1;
  }

  console.log(JSON.stringify({ renamed, skipped, dir: CABIN_DIR }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
