// Blog 首頁分類：把「CMS bucket 名稱 → 顯示分類」的對映集中於此。
// 過去這段以硬編碼中文前綴散在 blog/index.astro，CMS 端改個 bucket 名稱，
// 文章就會無聲掉進「其他」。集中成資料表後，改名只需動這裡；
// classifyBucket 另回傳 matched，讓頁面能在 build 時對「未知 bucket」發出警示。

export type BlogCatId = 'journey' | 'projects' | 'misc';

/** 分類顯示順序 */
export const BLOG_CAT_ORDER: BlogCatId[] = ['journey', 'projects', 'misc'];

/** 各分類區塊的 DOM id（錨點／dock 用） */
export const BLOG_CAT_DOM_ID: Record<BlogCatId, string> = {
  journey: 'blog-cat-journey',
  projects: 'blog-cat-projects',
  misc: 'blog-cat-misc',
};

/** 未匹配任何前綴時歸入的 fallback 分類 */
export const BLOG_FALLBACK_CAT: BlogCatId = 'misc';

/**
 * CMS bucket 名稱前綴 → 分類。改 CMS bucket 命名時只需維護這張表。
 * 依序比對，第一個 startsWith 命中者勝出。
 */
const BUCKET_PREFIX_TO_CAT: { prefix: string; cat: BlogCatId }[] = [
  { prefix: '鐵道·票券', cat: 'journey' },
  { prefix: '遊記·足跡', cat: 'journey' },
  { prefix: '食旅·指南', cat: 'journey' },
  { prefix: '住宿', cat: 'journey' },
  { prefix: '航空·哩程', cat: 'journey' },
  { prefix: '專題·技術', cat: 'projects' },
];

/**
 * 依 bucket 名稱歸類。matched=false 表示落入 fallback（bucket 未在對映表中），
 * 呼叫端可據此在 build 時警示，避免文章被無聲歸錯類。
 */
export function classifyBucket(bucket: string): { cat: BlogCatId; matched: boolean } {
  const hit = BUCKET_PREFIX_TO_CAT.find((m) => bucket.startsWith(m.prefix));
  return hit ? { cat: hit.cat, matched: true } : { cat: BLOG_FALLBACK_CAT, matched: false };
}
