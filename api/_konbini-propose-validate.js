// @ts-check
// 純函式驗證模組，供 api/konbini-propose-product.js 匯入。底線前綴讓 Vercel
// builder 略過、不視為獨立路由。全部函式無副作用，可用 node 直接單元測試。
//
// 新增商品：名稱 + 所屬連鎖店（既有，slug 挑選）+ 分類 + 價格（選填）。
// 國家由伺服器查出的連鎖店本身決定，不需使用者另外選。
//
// 評分是必填——投稿新商品同時內建「第一則評論」，使用者不用先送出商品、
// 等審核、再回頭找到商品頁才能寫評論（那樣要跑兩趟，體驗很差）。

const MAX_NAME = 80;
const MAX_PRICE = 100000;
const MAX_BODY = 1000;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATEGORIES = new Set([
  'onigiri',
  'bento',
  'hotfood',
  'dessert',
  'bread',
  'drink',
  'snack',
  'frozen',
  'other',
]);

/** @param {unknown} v */
function asTrimmedString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * @typedef {Object} KonbiniProposal
 * @property {string} name
 * @property {string} chainSlug
 * @property {string} category
 * @property {number} [price]
 * @property {number} rating
 * @property {string} [body]
 */
/**
 * @typedef {{ ok: true, value: KonbiniProposal } | { ok: false, error: string }} ProposeValidateResult
 */

/**
 * @param {any} body
 * @returns {ProposeValidateResult}
 */
function validateProposal(body) {
  if (!body || typeof body !== 'object') {
    return { ok: false, error: 'Malformed body' };
  }

  const name = asTrimmedString(body.name);
  if (!name || name.length > MAX_NAME) {
    return { ok: false, error: `name required (max ${MAX_NAME})` };
  }

  const chainSlug = asTrimmedString(body.chainSlug);
  if (!chainSlug || !SLUG_RE.test(chainSlug) || chainSlug.length > 120) {
    return { ok: false, error: 'Invalid or missing chainSlug' };
  }

  const category = asTrimmedString(body.category);
  if (!CATEGORIES.has(category)) {
    return { ok: false, error: 'invalid category' };
  }

  let price;
  if (body.price !== undefined && body.price !== null && body.price !== '') {
    price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
      return { ok: false, error: `price must be 0–${MAX_PRICE}` };
    }
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
    value: { name, chainSlug, category, price, rating, body: reviewBody || undefined },
  };
}

export { validateProposal, MAX_NAME, MAX_PRICE, MAX_BODY, CATEGORIES };
