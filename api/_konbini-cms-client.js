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
 * 上傳一張已解碼的照片到 Payload media（multipart），回傳 media id 或 null。
 * @param {{ buffer: Buffer, contentType: string, ext: string }} img
 * @param {string} alt
 */
async function uploadMedia(img, alt) {
  const form = new FormData();
  const blob = new Blob([img.buffer], { type: img.contentType });
  form.append('file', blob, `konbini-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${img.ext}`);
  form.append('alt', String(alt || 'konbini photo').slice(0, 120));
  const res = await fetchWithTimeout(`${CMS_URL}/api/media`, {
    method: 'POST',
    headers: apiKeyHeaders(),
    body: form,
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.doc?.id ?? null;
}

/** @param {string|number|undefined|null} id */
async function deleteMedia(id) {
  if (id === undefined || id === null || id === '') return true;
  const res = await fetchWithTimeout(`${CMS_URL}/api/media/${encodeURIComponent(String(id))}`, {
    method: 'DELETE',
    headers: apiKeyHeaders(),
  });
  return res.ok || res.status === 404;
}

/** @param {string} collection @param {string|number|undefined|null} id */
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
  uploadMedia,
  deleteMedia,
  deleteDocument,
};
