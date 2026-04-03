import { describe, expect, it } from 'vitest';
import { resolveLegacyRedirect } from './blog-routing-rules';

function blogPostUrlFromId(id: string) {
  const hashIdx = id.indexOf('#');
  const pathPart = hashIdx === -1 ? id : id.slice(0, hashIdx);
  const hash = hashIdx === -1 ? '' : id.slice(hashIdx + 1);
  const base = `/blog/${pathPart
    .split('/')
    .map((s) => encodeURIComponent(s))
    .join('/')}`;
  return hash ? `${base}#${hash}` : base;
}

describe('resolveLegacyRedirect', () => {
  it('maps old travel root to notes root', () => {
    const out = resolveLegacyRedirect({
      slug: 'zephlog/旅行紀錄',
      blogPathRedirects: {},
      blogPostUrlFromId,
    });
    expect(out).toBe('/blog/zephlog/%E7%AD%86%E8%A8%98');
  });

  it('maps curated scenic train slug to anchor', () => {
    const out = resolveLegacyRedirect({
      slug: 'zephlog/curated/scenic-trains/train-etsetora',
      blogPathRedirects: {},
      blogPostUrlFromId,
    });
    expect(out).toBe(
      '/blog/zephlog/%E7%AD%86%E8%A8%98/%E6%97%A5%E6%9C%AC%E8%A7%80%E5%85%89%E5%88%97%E8%BB%8A%E7%B8%BD%E8%A6%BD-%E8%B7%AF%E7%B7%9A%E6%A5%AD%E8%80%85%E5%AE%98%E7%B6%B2%E8%88%87%E5%88%86%E8%BB%8A%E7%A8%AE%E9%8C%A8%E9%BB%9E#train-etsetora',
    );
  });

  it('maps Tokyo bib aliases to compilation', () => {
    const out = resolveLegacyRedirect({
      slug: 'iruca-tokyo',
      blogPathRedirects: {},
      blogPostUrlFromId,
    });
    expect(out).toBe(
      '/blog/zephlog/%E7%AD%86%E8%A8%98/%E6%9D%B1%E4%BA%AC%E5%BF%85%E6%AF%94%E7%99%BB%E9%A4%90%E5%BB%B3110%E5%AE%B6%E7%B5%B1%E6%95%B4-%E7%B1%B3%E5%85%B6%E6%9E%97%E7%AD%86%E8%A8%98',
    );
  });

  it('uses path redirect map and preserves absolute paths', () => {
    const out = resolveLegacyRedirect({
      slug: 'legacy/direct',
      blogPathRedirects: { 'legacy/direct': '/blog' },
      blogPostUrlFromId,
    });
    expect(out).toBe('/blog');
  });

  it('returns null when no rule matched', () => {
    const out = resolveLegacyRedirect({
      slug: 'no/match',
      blogPathRedirects: {},
      blogPostUrlFromId,
    });
    expect(out).toBeNull();
  });
});
