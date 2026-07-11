import type { Lang } from './types';

/** URL 前綴：英文不帶前綴 */
export function langPrefix(lang: Lang): string {
  return lang === 'en' ? '' : `/${lang}`;
}

export function homePath(lang: Lang): string {
  return lang === 'en' ? '/' : `/${lang}/`;
}

export function spacePath(lang: Lang, spaceId: string): string {
  const p = langPrefix(lang);
  return p ? `${p}/${spaceId}` : `/${spaceId}`;
}

export function workPath(lang: Lang, spaceId: string, slug: string): string {
  const p = langPrefix(lang);
  return p ? `${p}/${spaceId}/${slug}` : `/${spaceId}/${slug}`;
}

export function creatorsHashPath(lang: Lang): string {
  const h = `${homePath(lang).replace(/\/$/, '')}#creators`;
  return h === '#creators' ? '/#creators' : h;
}

/** Parse `/zh/solilium/foo` → lang zh, logicalPath `/solilium/foo` */
export function parseLocalizedPath(pathname: string): { lang: Lang; logicalPath: string } {
  const raw = pathname.replace(/\/$/, '') || '/';
  if (raw === '/ja' || raw.startsWith('/ja/')) {
    const rest = raw === '/ja' ? '' : raw.slice(4);
    return { lang: 'ja', logicalPath: rest ? `/${rest}` : '/' };
  }
  if (raw === '/zh' || raw.startsWith('/zh/')) {
    const rest = raw === '/zh' ? '' : raw.slice(4);
    return { lang: 'zh', logicalPath: rest ? `/${rest}` : '/' };
  }
  return { lang: 'en', logicalPath: raw };
}

/** 在維持相同「邏輯路徑」下切換語言 */
export function equivalentUrl(targetLang: Lang, pathname: string): string {
  const { logicalPath } = parseLocalizedPath(pathname);
  if (logicalPath === '/') return homePath(targetLang);
  const p = langPrefix(targetLang);
  return p ? `${p}${logicalPath}` : logicalPath;
}

/**
 * 語言切換器只顯示該區塊實際存在的語系，避免直接導向 404：
 *  - /travel  僅 en + zh（無 ja 頁面）
 *  - 其餘      en + zh + ja（含 blog：現為 build-time 多語靜態路由）
 */
export function availableLangsForPath(pathname: string): Lang[] {
  const { logicalPath } = parseLocalizedPath(pathname);
  if (logicalPath === '/travel' || logicalPath.startsWith('/travel/')) return ['en', 'zh'];
  if (logicalPath === '/konbini' || logicalPath.startsWith('/konbini/')) return ['en', 'zh'];
  return ['en', 'zh', 'ja'];
}

// ── Blog routes ───────────────────────────────────────────

export function blogPath(lang: Lang): string {
  const p = langPrefix(lang);
  return p ? `${p}/blog` : '/blog';
}

export function blogSlugPath(lang: Lang, slug: string): string {
  return `${blogPath(lang)}/${slug}`;
}

// ── Travel routes ─────────────────────────────────────────

export function travelPath(lang: Lang): string {
  const p = langPrefix(lang);
  return p ? `${p}/travel` : '/travel';
}

export function cardListPath(lang: Lang): string {
  return `${travelPath(lang)}/cards`;
}

export function cardSlugPath(lang: Lang, slug: string): string {
  return `${travelPath(lang)}/cards/${slug}`;
}

export function loungeListPath(lang: Lang): string {
  return `${travelPath(lang)}/lounges`;
}

export function loungeSlugPath(lang: Lang, slug: string): string {
  return `${travelPath(lang)}/lounges/${slug}`;
}

export function airlineListPath(lang: Lang): string {
  return `${travelPath(lang)}/airlines`;
}

export function airlineSlugPath(lang: Lang, slug: string): string {
  return `${travelPath(lang)}/airlines/${slug}`;
}

export function matrixPath(lang: Lang): string {
  return `${travelPath(lang)}/matrix`;
}

export function programListPath(lang: Lang): string {
  return `${travelPath(lang)}/programs`;
}

export function programSlugPath(lang: Lang, slug: string): string {
  return `${travelPath(lang)}/programs/${slug}`;
}

// ── Konbini routes（超商評價，en + zh）────────────────────

export function konbiniPath(lang: Lang): string {
  const p = langPrefix(lang);
  return p ? `${p}/konbini` : '/konbini';
}

export function konbiniProductPath(lang: Lang, slug: string): string {
  return `${konbiniPath(lang)}/${slug}`;
}
