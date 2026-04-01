import fs from 'node:fs/promises';
import path from 'node:path';

const BLOG_ROOT = '/Users/solilium/my-portfolio/src/content/blog';

const MOVE_PLAN = {
  'travel-catalog.md': 'curated/overview/travel-catalog.md',
  'travel-log.md': 'curated/categories/travel-log.md',
  'timeline-log.md': 'curated/categories/timeline-log.md',
  'records-raw.md': 'curated/categories/records-raw.md',
  'cabin-data.md': 'curated/categories/cabin-data.md',
  'aircraft-data.md': 'curated/categories/aircraft-data.md',
  'airline-data.md': 'curated/categories/airline-data.md',
  'tokyo-wide-pass.md': 'curated/jr-passes/tokyo-wide-pass.md',
  'nex-roundtrip-ticket.md': 'curated/jr-passes/nex-roundtrip-ticket.md',
  'yufuin-no-mori.md': 'curated/scenic-trains/yufuin-no-mori.md',
  'aoniyoshi-train.md': 'curated/scenic-trains/aoniyoshi-train.md',
  'train-hinotori-firebird.md': 'curated/scenic-trains/train-hinotori-firebird.md',
  'train-sea-spica.md': 'curated/scenic-trains/train-sea-spica.md',
  'train-la-malle-de-bois.md': 'curated/scenic-trains/train-la-malle-de-bois.md',
  'train-shimakaze.md': 'curated/scenic-trains/train-shimakaze.md',
  'train-west-express-ginga.md': 'curated/scenic-trains/train-west-express-ginga.md',
  'train-etsetora.md': 'curated/scenic-trains/train-etsetora.md',
  'train-ametsuchi.md': 'curated/scenic-trains/train-ametsuchi.md',
  'train-hanaakari.md': 'curated/scenic-trains/train-hanaakari.md',
  'train-mahoroba.md': 'curated/scenic-trains/train-mahoroba.md',
  'train-tango-kuromatsu.md': 'curated/scenic-trains/train-tango-kuromatsu.md',
  'train-kyotrain-garaku.md': 'curated/scenic-trains/train-kyotrain-garaku.md',
  'train-iyonada-monogatari.md': 'curated/scenic-trains/train-iyonada-monogatari.md',
  'iruca-tokyo.md': 'curated/tokyo-food/iruca-tokyo.md',
  'sugita.md': 'curated/tokyo-food/sugita.md',
  'welcome.md': 'curated/meta/welcome.md',
};

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  let moved = 0;
  let skipped = 0;

  for (const [from, to] of Object.entries(MOVE_PLAN)) {
    const fromAbs = path.join(BLOG_ROOT, from);
    const toAbs = path.join(BLOG_ROOT, to);

    if (!(await exists(fromAbs))) {
      skipped += 1;
      continue;
    }

    await fs.mkdir(path.dirname(toAbs), { recursive: true });
    await fs.rename(fromAbs, toAbs);
    moved += 1;
  }

  console.log(JSON.stringify({ moved, skipped, total: Object.keys(MOVE_PLAN).length }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
