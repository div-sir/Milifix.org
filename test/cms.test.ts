import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// cms.ts 的 fail-fast / memoization 分支依賴 import.meta.env，同一測試檔
// 難以在不同測試間動態切換，因此把讀取抽出的 src/lib/cms-env 整支 mock，
// 用一個可變物件讓每個測試獨立控制 isProd / isFailFast（見 src/lib/cms-env.ts
// 的說明）。
const envState = { isProd: false, isFailFast: false };

vi.mock('../src/lib/cms-env', () => ({
  getCmsUrl: () => 'http://cms.test',
  isProd: () => envState.isProd,
  isFailFast: () => envState.isFailFast,
  isAllowEmpty: () => !envState.isFailFast,
}));

// 用小型假資料取代真實 post-translations.json，測試不依賴實際內容。
vi.mock('../src/data/post-translations.json', () => ({
  default: {
    'has-en': { en: { title: 'EN Title', description: 'EN desc', content: { en: true } } },
    'partial-ja': { ja: { title: '' } }, // 空字串視為未翻譯，應 fallback
  },
}));

/** 每次都用全新模組實例，避免 requestCache 等模組狀態跨測試污染。 */
async function loadCms() {
  vi.resetModules();
  return import('../src/lib/cms');
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

beforeEach(() => {
  envState.isProd = false;
  envState.isFailFast = false;
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('isRetryableStatus', () => {
  it('treats 408/429/5xx as retryable, other 4xx as not', async () => {
    const { isRetryableStatus } = await loadCms();
    expect(isRetryableStatus(408)).toBe(true);
    expect(isRetryableStatus(429)).toBe(true);
    expect(isRetryableStatus(500)).toBe(true);
    expect(isRetryableStatus(503)).toBe(true);
    expect(isRetryableStatus(404)).toBe(false);
    expect(isRetryableStatus(401)).toBe(false);
  });
});

describe('fetchCollection retry / fail-fast behavior', () => {
  it('retries on 5xx and succeeds once the server recovers', async () => {
    envState.isFailFast = true; // 開 fail-fast 才會有 MAX_ATTEMPTS 次嘗試
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({}, 500))
      .mockResolvedValueOnce(jsonResponse({ docs: [{ id: '1', slug: 'a' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const cms = await loadCms();
    const promise = cms.getPosts();
    // 兩次重試延遲（1500ms、3000ms）需靠 fake timer 推進，不實際等待
    await vi.advanceTimersByTimeAsync(10_000);
    const result = await promise;

    expect(result).toEqual([{ id: '1', slug: 'a' }]);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry a 404 — fails immediately even with attempts remaining', async () => {
    envState.isFailFast = true;
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({}, 404));
    vi.stubGlobal('fetch', fetchMock);

    const cms = await loadCms();
    await expect(cms.getPosts()).rejects.toThrow(/posts/);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('fail-fast mode throws (with the collection name) instead of swallowing the error', async () => {
    envState.isFailFast = true;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('boom')));

    const cms = await loadCms();
    const promise = cms.getPosts();
    // 先掛一個空 catch 避免 advanceTimersByTimeAsync 期間 reject 被視為
    // unhandled rejection（下方 expect().rejects 才是真正的斷言）。
    promise.catch(() => {});
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(promise).rejects.toThrow(/posts/);
  });

  it('optional collections (konbini) degrade to [] even in fail-fast, so a not-yet-live CMS section cannot break prod build', async () => {
    envState.isFailFast = true;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('collection not found')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const cms = await loadCms();

    // 選用 collection 不 throw
    const products = cms.getKonbiniProducts();
    products.catch(() => {});
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(products).resolves.toEqual([]);

    // 對照組：必要 collection 在 fail-fast 下仍會 throw
    const posts = cms.getPosts();
    posts.catch(() => {});
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(posts).rejects.toThrow(/posts/);
  });

  it('optional single-doc fetch (getKonbiniProduct) returns null in fail-fast instead of throwing', async () => {
    envState.isFailFast = true;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('collection not found')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const cms = await loadCms();
    const doc = cms.getKonbiniProduct('whatever');
    doc.catch(() => {});
    await vi.advanceTimersByTimeAsync(20_000);
    await expect(doc).resolves.toBeNull();
  });

  it('lenient mode (dev / CMS_ALLOW_EMPTY) returns [] and warns instead of throwing', async () => {
    envState.isFailFast = false;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const cms = await loadCms();
    const result = await cms.getPosts();

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalled();
  });

  it('lenient mode returns null (not []) for a single-doc fetch', async () => {
    envState.isFailFast = false;
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const cms = await loadCms();
    const result = await cms.getPost('missing-slug');

    expect(result).toBeNull();
  });

  it('warns when totalDocs exceeds the number of docs returned (truncation)', async () => {
    envState.isFailFast = false;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(jsonResponse({ docs: [{ id: '1', slug: 'a' }], totalDocs: 5 })),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const cms = await loadCms();
    await cms.getPosts();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('posts'));
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('truncated'));
  });
});

describe('fetchJson memoization (PROD only)', () => {
  it('dedupes concurrent requests for the same URL into a single HTTP call', async () => {
    envState.isProd = true;
    envState.isFailFast = false;
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ docs: [{ id: '1', slug: 'a' }] }));
    vi.stubGlobal('fetch', fetchMock);

    const cms = await loadCms();
    const [a, b] = await Promise.all([cms.getWorks(), cms.getWorks()]);

    expect(a).toEqual(b);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('does not memoize outside PROD — each call re-fetches', async () => {
    envState.isProd = false;
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ docs: [] }));
    vi.stubGlobal('fetch', fetchMock);

    const cms = await loadCms();
    await Promise.all([cms.getWorks(), cms.getWorks()]);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('localizedPost', () => {
  it('returns the original zh fields untouched for lang=zh', async () => {
    const cms = await loadCms();
    const post = { id: '1', slug: 'has-en', title: '中文標題', description: '中文摘要', date: '2026-01-01', draft: false, content: { zh: true } };
    expect(cms.localizedPost(post, 'zh')).toEqual({
      title: '中文標題',
      description: '中文摘要',
      content: { zh: true },
    });
  });

  it('uses the translation for lang=en when present', async () => {
    const cms = await loadCms();
    const post = { id: '1', slug: 'has-en', title: '中文標題', description: '中文摘要', date: '2026-01-01', draft: false, content: { zh: true } };
    expect(cms.localizedPost(post, 'en')).toEqual({
      title: 'EN Title',
      description: 'EN desc',
      content: { en: true },
    });
  });

  it('falls back to the zh title when the translation field is blank', async () => {
    const cms = await loadCms();
    const post = { id: '1', slug: 'partial-ja', title: '中文標題', description: '中文摘要', date: '2026-01-01', draft: false, content: { zh: true } };
    expect(cms.localizedPost(post, 'ja').title).toBe('中文標題');
  });

  it('falls back to zh entirely when there is no translation entry at all', async () => {
    const cms = await loadCms();
    const post = { id: '1', slug: 'no-translation', title: '中文標題', description: '中文摘要', date: '2026-01-01', draft: false, content: { zh: true } };
    expect(cms.localizedPost(post, 'en')).toEqual({
      title: '中文標題',
      description: '中文摘要',
      content: { zh: true },
    });
  });
});
