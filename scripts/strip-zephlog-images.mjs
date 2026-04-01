import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = '/Users/solilium/my-portfolio/src/content/blog/zephlog';

async function walk(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(full);
    }
  }
  return files;
}

function stripMarkdownImages(content) {
  // Remove markdown image lines: ![alt](path)
  return content
    .replace(/^[ \t]*!\[[^\]]*]\([^)]+\)[ \t]*\r?\n?/gm, '')
    .replace(/\n{3,}/g, '\n\n');
}

async function main() {
  const files = await walk(ROOT);
  let changed = 0;
  let removedLines = 0;

  for (const file of files) {
    const before = await fs.readFile(file, 'utf8');
    const matches = before.match(/^[ \t]*!\[[^\]]*]\([^)]+\)[ \t]*$/gm);
    if (!matches || matches.length === 0) continue;

    const after = stripMarkdownImages(before);
    await fs.writeFile(file, after, 'utf8');
    changed += 1;
    removedLines += matches.length;
  }

  console.log(JSON.stringify({ filesScanned: files.length, filesChanged: changed, imageLinesRemoved: removedLines }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
