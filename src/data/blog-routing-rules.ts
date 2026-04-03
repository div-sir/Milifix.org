const JR_COMPILATION = 'zephlog/筆記/jr-pass-與參考票價-統整';
const TOKYO_BIB_COMPILATION = 'zephlog/筆記/東京必比登餐廳110家統整-米其林筆記';
const SCENIC_PAGE = 'zephlog/筆記/日本觀光列車總覽-路線業者官網與分車種錨點';

/** 舊子路徑檔名 -> 合併頁 h2 錨點 id */
const SCENIC_LEAF_TO_ANCHOR: Record<string, string> = {
  Aoniyoshi: 'aoniyoshi-train',
  'etSETOra-エトセトラ': 'train-etsetora',
  'Hinotori-火鳥': 'train-hinotori-firebird',
  'La-Malle-de-Bois': 'train-la-malle-de-bois',
  'Sea-Spica': 'train-sea-spica',
  'Shimakaze志摩之風': 'train-shimakaze',
  'WEST-EXPRESS-銀河': 'train-west-express-ginga',
  由布院之森: 'yufuin-no-mori',
  あめつち: 'train-ametsuchi',
  はなあかり: 'train-hanaakari',
  まほろば: 'train-mahoroba',
  丹後黑松號: 'train-tango-kuromatsu',
  伊予灘物語: 'train-iyonada-monogatari',
};

const legacySlugRedirects: Record<string, string> = {
  'tokyo-wide-pass': JR_COMPILATION,
  'nex-roundtrip-ticket': JR_COMPILATION,
  'yufuin-no-mori': `${SCENIC_PAGE}#yufuin-no-mori`,
  'aoniyoshi-train': `${SCENIC_PAGE}#aoniyoshi-train`,
  'train-hinotori-firebird': `${SCENIC_PAGE}#train-hinotori-firebird`,
  'train-sea-spica': `${SCENIC_PAGE}#train-sea-spica`,
  'train-la-malle-de-bois': `${SCENIC_PAGE}#train-la-malle-de-bois`,
  'train-shimakaze': `${SCENIC_PAGE}#train-shimakaze`,
  'train-west-express-ginga': `${SCENIC_PAGE}#train-west-express-ginga`,
  'train-etsetora': `${SCENIC_PAGE}#train-etsetora`,
  'train-ametsuchi': `${SCENIC_PAGE}#train-ametsuchi`,
  'train-hanaakari': `${SCENIC_PAGE}#train-hanaakari`,
  'train-mahoroba': `${SCENIC_PAGE}#train-mahoroba`,
  'train-tango-kuromatsu': `${SCENIC_PAGE}#train-tango-kuromatsu`,
  'train-kyotrain-garaku': `${SCENIC_PAGE}#train-kyotrain-garaku`,
  'train-iyonada-monogatari': `${SCENIC_PAGE}#train-iyonada-monogatari`,
};

const redirectToBlogSet = new Set([
  'travel-catalog',
  'travel-log',
  'timeline-log',
  'records-raw',
  'cabin-data',
  'aircraft-data',
  'airline-data',
  'zephlog/curated/overview/travel-catalog',
  'welcome',
  'zephlog/curated/meta/welcome',
  'zephlog/艙等-統整',
]);

interface ResolveLegacyRedirectOptions {
  slug: string;
  blogPathRedirects: Record<string, string>;
  blogPostUrlFromId: (id: string) => string;
}

export function resolveLegacyRedirect({
  slug,
  blogPathRedirects,
  blogPostUrlFromId,
}: ResolveLegacyRedirectOptions): string | null {
  const toBlogOrIdPath = (target: string) => (target.startsWith('/') ? target : blogPostUrlFromId(target));

  if (slug === 'zephlog/旅行紀錄') return blogPostUrlFromId('zephlog/筆記');

  const redirectByPrefix: Array<{ prefix: string; to: string }> = [
    { prefix: 'zephlog/旅行紀錄/', to: slug.replace(/^zephlog\/旅行紀錄/, 'zephlog/筆記') },
    { prefix: 'curated/', to: `zephlog/${slug}` },
    { prefix: 'zephlog/curated/jr-passes/', to: JR_COMPILATION },
  ];
  for (const rule of redirectByPrefix) {
    if (slug.startsWith(rule.prefix)) return blogPostUrlFromId(rule.to);
  }

  if (
    slug.startsWith('zephlog/飛機/') ||
    slug.startsWith('zephlog/航空公司/') ||
    slug.startsWith('zephlog/艙等/') ||
    slug.startsWith('zephlog/活動年表/') ||
    slug.startsWith('zephlog/Record/') ||
    slug.startsWith('zephlog/record/') ||
    slug.startsWith('zephlog/curated/categories/')
  ) {
    return '/blog';
  }

  if (slug.startsWith('zephlog/curated/scenic-trains/')) {
    const fn = slug.replace(/^.*\//, '');
    return blogPostUrlFromId(`${SCENIC_PAGE}#${fn}`);
  }

  if (slug.startsWith('zephlog/筆記/日本觀光列車/')) {
    const leaf = slug.replace(/^zephlog\/筆記\/日本觀光列車\//, '');
    const anchor = SCENIC_LEAF_TO_ANCHOR[leaf] || leaf;
    return blogPostUrlFromId(`${SCENIC_PAGE}#${anchor}`);
  }

  if (
    slug === 'zephlog/旅行紀錄/jr-pass-1d64cd6fef0c80aea2a0d8c9c3f70875' ||
    slug.startsWith('zephlog/旅行紀錄/JR PASS & 參考票價/')
  ) {
    return blogPostUrlFromId(JR_COMPILATION);
  }

  if (
    slug.includes('/東京必比登清單/') ||
    slug === 'iruca-tokyo' ||
    slug === 'sugita' ||
    slug === 'zephlog/curated/tokyo-food/iruca-tokyo' ||
    slug === 'zephlog/curated/tokyo-food/sugita'
  ) {
    return blogPostUrlFromId(TOKYO_BIB_COMPILATION);
  }

  if (redirectToBlogSet.has(slug)) return '/blog';

  const zephPathRedirect = blogPathRedirects[slug];
  if (zephPathRedirect) return toBlogOrIdPath(zephPathRedirect);

  const redirectTo = legacySlugRedirects[slug];
  if (redirectTo) return blogPostUrlFromId(redirectTo);

  return null;
}
