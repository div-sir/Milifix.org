// @ts-check
// 純函式驗證模組，供 api/konbini-submit.js 匯入。底線前綴讓 Vercel builder
// 略過、不視為獨立路由。全部函式無副作用，可用 node 直接單元測試。

const MAX_TITLE = 80;
const MAX_BODY = 1000;
const MAX_STORE = 60;
const MAX_AUTHOR = 40;
const MAX_PRICE = 100000;
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const COUNTRIES = new Set(['taiwan', 'japan']);
const CURRENCIES = new Set(['TWD', 'JPY']);

/** @param {unknown} v */
function asTrimmedString(v) {
  return typeof v === 'string' ? v.trim() : '';
}

/**
 * @typedef {Object} KonbiniSubmission
 * @property {string} productSlug
 * @property {number} rating
 * @property {string} [title]
 * @property {string} [body]
 * @property {string} [store]
 * @property {string} [authorName]
 * @property {number} [price]
 * @property {string} [currency]
 * @property {string} [country]
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

  const title = asTrimmedString(body.title);
  if (title.length > MAX_TITLE) {
    return { ok: false, error: `title too long (max ${MAX_TITLE})` };
  }

  const reviewBody = asTrimmedString(body.body);
  if (reviewBody.length > MAX_BODY) {
    return { ok: false, error: `body too long (max ${MAX_BODY})` };
  }

  const store = asTrimmedString(body.store);
  if (store.length > MAX_STORE) {
    return { ok: false, error: `store too long (max ${MAX_STORE})` };
  }

  const authorName = asTrimmedString(body.authorName);
  if (authorName.length > MAX_AUTHOR) {
    return { ok: false, error: `authorName too long (max ${MAX_AUTHOR})` };
  }

  let price;
  if (body.price !== undefined && body.price !== null && body.price !== '') {
    price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > MAX_PRICE) {
      return { ok: false, error: `price must be 0–${MAX_PRICE}` };
    }
  }

  let currency;
  if (body.currency !== undefined && body.currency !== null && body.currency !== '') {
    currency = String(body.currency);
    if (!CURRENCIES.has(currency)) {
      return { ok: false, error: 'currency must be TWD or JPY' };
    }
  }

  let country;
  if (body.country !== undefined && body.country !== null && body.country !== '') {
    country = String(body.country);
    if (!COUNTRIES.has(country)) {
      return { ok: false, error: 'country must be taiwan or japan' };
    }
  }

  return {
    ok: true,
    value: {
      productSlug,
      rating,
      title: title || undefined,
      body: reviewBody || undefined,
      store: store || undefined,
      authorName: authorName || undefined,
      price,
      currency,
      country,
    },
  };
}

export {
  validateSubmission,
  SLUG_RE,
  MAX_TITLE,
  MAX_BODY,
  MAX_STORE,
  MAX_AUTHOR,
  MAX_PRICE,
};
