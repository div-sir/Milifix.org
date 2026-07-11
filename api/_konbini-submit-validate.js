// @ts-check
// 純函式驗證模組，供 api/konbini-submit.js 匯入。底線前綴讓 Vercel builder
// 略過、不視為獨立路由。全部函式無副作用，可用 node 直接單元測試。
//
// 商品由頁面情境決定（productSlug 是該商品頁內建的值，不是使用者從清單挑
// 選），評分是唯一必要欄位，心得選填。刻意不收標題／價格／國家／購買地點／
// 顯示名稱——這是以「商品排行」為核心的評分系統，非開放式圖文投稿。

const MAX_BODY = 1000;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @param {unknown} v */
function asTrimmedString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * @typedef {Object} KonbiniSubmission
 * @property {string} productSlug
 * @property {number} rating
 * @property {string} [body]
 */
/**
 * @typedef {{ ok: true, value: KonbiniSubmission } | { ok: false, error: string }} ValidateResult
 */

/**
 * 驗證並正規化投稿內容。回傳 { ok:true, value } 或 { ok:false, error }。
 * 不負責身分（由呼叫端以 Google token 決定 authorId/authorName），
 * 也不負責 status（呼叫端一律強制 pending）。
 * @param {any} body
 * @returns {ValidateResult}
 */
function validateSubmission(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Malformed body' };
  }

  const productSlug = asTrimmedString(body.productSlug);
  if (!productSlug || !SLUG_RE.test(productSlug) || productSlug.length > 120) {
    return { ok: false, error: 'Invalid or missing productSlug' };
  }

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: 'rating must be an integer 1–5' };
  }

  const reviewBody = asTrimmedString(body.body);
  if (reviewBody.length > MAX_BODY) {
    return { ok: false, error: `body too long (max ${MAX_BODY})` };
  }

  return {
    ok: true,
    value: {
      productSlug,
      rating,
      body: reviewBody || undefined,
    },
  };
}

export { validateSubmission, SLUG_RE, MAX_BODY };
