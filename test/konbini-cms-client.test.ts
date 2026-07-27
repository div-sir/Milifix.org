import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  CMS_URL,
  uploadSubmissionMedia,
  deleteSubmissionMedia,
} from '../api/_konbini-cms-client.js';

// CMS 端 RBAC 強化後，投稿圖片必須進 private 的 submission-media
// collection（service 帳號無權寫公開 media）。這裡鎖定上傳目標與
// best-effort 刪除語意，避免未來改動不小心退回公開 media。

const img = { buffer: Buffer.from([0xff, 0xd8, 0xff, 0x00]), contentType: 'image/webp', ext: 'webp' };

describe('uploadSubmissionMedia', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('POSTs the file to the private submission-media collection with alt text', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ doc: { id: 'sm-1' } }), { status: 201 }),
    );

    const id = await uploadSubmissionMedia(img, '大亨堡 投稿照片 1');

    expect(id).toBe('sm-1');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${CMS_URL}/api/submission-media`);
    expect(init.method).toBe('POST');
    expect(init.headers.Authorization).toMatch(/^users API-Key /);
    expect(init.body).toBeInstanceOf(FormData);
    expect(init.body.get('alt')).toBe('大亨堡 投稿照片 1');
    expect(init.body.get('file')).toBeInstanceOf(Blob);
  });

  it('falls back to a generic alt so approval-time alt validation cannot be starved', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ doc: { id: 'sm-2' } }), { status: 201 }),
    );

    await uploadSubmissionMedia(img, '');
    const [, init] = fetchMock.mock.calls[0];
    expect(init.body.get('alt')).toBe('konbini photo');
  });

  it('returns null when the CMS rejects the upload', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 403 }));
    expect(await uploadSubmissionMedia(img, 'alt')).toBeNull();
  });
});

describe('deleteSubmissionMedia', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock);
    fetchMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('targets the submission-media collection and treats 404 as success', async () => {
    fetchMock.mockResolvedValue(new Response('', { status: 404 }));
    expect(await deleteSubmissionMedia('sm-1')).toBe(true);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(`${CMS_URL}/api/submission-media/sm-1`);
    expect(init.method).toBe('DELETE');
  });

  it('reports failure (not throw) when RBAC refuses the delete', async () => {
    // service 角色沒有 delete 權限：403 是預期情況，檔案維持 private，
    // 由站主後台清理。呼叫端只記 log，不影響對使用者的回應。
    fetchMock.mockResolvedValue(new Response('', { status: 403 }));
    expect(await deleteSubmissionMedia('sm-1')).toBe(false);
  });

  it('skips the request entirely for empty ids', async () => {
    expect(await deleteSubmissionMedia(undefined)).toBe(true);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
