// @ts-check
// 純函式驗證模組，供 api/konbini-report.js 匯入。底線前綴讓 Vercel builder
// 略過、不視為獨立路由。全部函式無副作用，可用 node 直接單元測試。
//
// 「回報錯誤」不要求 Google 登入（門檻越低越好），所以沒有 authorId 之類
// 的欄位；message 與 photo 都選填，但兩者至少要有一個，不然沒東西可回報。

const MAX_MESSAGE = 2000;
const MAX_PAGE_URL = 500;
const MAX_PAGE_TITLE = 200;
const MAX_PRODUCT_NAME = 200;
const PRODUCT_ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;

/** @param {unknown} v */
function asTrimmedString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * @typedef {Object} KonbiniReport
 * @property {string} pageUrl
 * @property {string} [message]
 * @property {string} [pageTitle]
 * @property {string} [productName]
 * @property {string} [productId]
 */
/**
 * @typedef {{ ok: true, value: KonbiniReport } | { ok: false, error: string }} ReportValidateResult
 */

/**
 * @param {any} body
 * @returns {ReportValidateResult}
 */
function validateReport(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Malformed body' };
  }

  const pageUrl = asTrimmedString(body.pageUrl).slice(0, MAX_PAGE_URL);
  if (!pageUrl) {
    return { ok: false, error: 'Invalid or missing pageUrl' };
  }

  const message = asTrimmedString(body.message);
  if (message.length > MAX_MESSAGE) {
    return { ok: false, error: `message too long (max ${MAX_MESSAGE})` };
  }

  const hasPhoto = typeof body.photo === 'string' && body.photo.length > 0;
  if (!message && !hasPhoto) {
    return { ok: false, error: 'Provide a message or a photo' };
  }

  const pageTitle = asTrimmedString(body.pageTitle).slice(0, MAX_PAGE_TITLE);
  const productName = asTrimmedString(body.productName).slice(0, MAX_PRODUCT_NAME);

  let productId;
  if (body.productId !== undefined && body.productId !== null && body.productId !== '') {
    const raw = String(body.productId).trim();
    if (PRODUCT_ID_RE.test(raw)) productId = raw;
  }

  return {
    ok: true,
    value: {
      pageUrl,
      message: message || undefined,
      pageTitle: pageTitle || undefined,
      productName: productName || undefined,
      productId,
    },
  };
}

export { validateReport, MAX_MESSAGE, MAX_PAGE_URL, MAX_PAGE_TITLE, MAX_PRODUCT_NAME };
