// @ts-check
// 共用的 Payload CMS 存取層，供 konbini 相關 serverless 路由匯入。
// 底線前綴讓 Vercel builder 略過、不視為獨立路由。

const CMS_URL = process.env.CMS_URL ?? 'http://localhost:3000';
const SUBMIT_API_KEY = process.env.KONBINI_SUBMIT_API_KEY;

const FETCH_TIMEOUT_MS = 10_000;

/** @param {string} url @param {RequestInit} [init] */
async function fetchWithTimeout(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** @returns {Record<string, string>} */
function apiKeyHeaders() {
  return { Authorization: `users API-Key ${SUBMIT_API_KEY}` };
}

/**
 * 上傳一張已解碼的投稿照片到 Payload 的 private `submission-media`
 * collection（multipart），回傳 media id 或 null。
 *
 * 投稿照片一律進 `submission-media`：service 帳號在 CMS 端只有這個
 * collection 的 create 權限（公開 `media` 是 editor 專用），且檔案在
 * 評論核准前由 private ACL 保護。alt 必填——CMS 在核准公開時強制每張
 * 圖片要有替代文字，沒有 alt 的圖會卡住審核。
 * @param {{ buffer: Buffer, contentType: string, ext: string }} img
 * @param {string} alt
 */
async function uploadSubmissionMedia(img, alt) {
  const form = new FormData();
  const blob = new Blob([img.buffer], { type: img.contentType });
  form.append('file', blob, `konbini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${img.ext}`);
  form.append('alt', String(alt || 'konbini photo').slice(0, 120));
  const res = await fetchWithTimeout(`${CMS_URL}/api/submission-media`, {
    method: 'POST',
    headers: apiKeyHeaders(),
    body: form,
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.doc?.id ?? null;
}

/**
 * 失敗補償用的 best-effort 刪除。新的 CMS RBAC 下 submission-media 的
 * delete 是 admin-only，service key 會拿到 403——此時檔案仍是 private、
 * 不會外流，由站主在後台或 ACL 對帳工具清理，所以 403 不視為錯誤，
 * 只回報 false 讓呼叫端記 log。
 * @param {string|number|undefined|null} id
 */
async function deleteSubmissionMedia(id) {
  if (id === undefined || id === null || id === '') return true;
  const res = await fetchWithTimeout(
    `${CMS_URL}/api/submission-media/${encodeURIComponent(String(id))}`,
    { method: 'DELETE', headers: apiKeyHeaders() },
  );
  return res.ok || res.status === 404;
}

/**
 * 同上：best-effort。konbini 各 collection 的 delete 都是 admin-only，
 * service key 的補償刪除會被拒；殘留的文件維持 pending（不公開），
 * 由站主後台清理。
 * @param {string} collection @param {string|number|undefined|null} id
 */
async function deleteDocument(collection, id) {
  if (id === undefined || id === null || id === '') return true;
  const safeCollection = collection.replace(/[^a-z0-9-]/gi, '');
  const res = await fetchWithTimeout(
    `${CMS_URL}/api/${safeCollection}/${encodeURIComponent(String(id))}`,
    { method: 'DELETE', headers: apiKeyHeaders() },
  );
  return res.ok || res.status === 404;
}

export {
  CMS_URL,
  SUBMIT_API_KEY,
  fetchWithTimeout,
  apiKeyHeaders,
  uploadSubmissionMedia,
  deleteSubmissionMedia,
  deleteDocument,
};
