// @ts-check
// 公開評分端點：接收前端 Google 登入後的評分，驗證身分與內容、擋濫用，
// 再以 Payload API key 寫入一筆 status=pending 的評價（待站主後台審核）。
// 公眾不直接接觸 Payload；Payload 對外維持唯讀。
//
// 防灌票：同一個 Google 帳號對同一商品重複送出時，改成「更新」既有那筆
// 評價（並重置為 pending 待重新審核），而不是無限累加新的一筆。
import {
  checkOrigin,
  checkRateLimit,
  getClientIp,
} from './_pass-security.js';
import { validateSubmission } from './_konbini-submit-validate.js';
import { decodeReviewImage, MAX_PHOTOS } from './_konbini-image.js';
import { CMS_URL, SUBMIT_API_KEY, fetchWithTimeout, apiKeyHeaders, uploadMedia } from './_konbini-cms-client.js';
import { CLIENT_ID, verifyGoogleIdToken } from './_konbini-google-auth.js';

/** @type {Map<string, number[]>} 每個暖實例共用的記憶體 rate-limit 表 */
const RATE_LIMIT_STORE = new Map();

/**
 * 找出「這位使用者對這個商品」既有的評價（不論審核狀態）。
 * 用 API key 身分讀取，才能看到 pending/rejected（公開唯讀只看得到 approved）。
 * @param {string} productId
 * @param {string} authorId
 */
async function findExistingReview(productId, authorId) {
  // 多個頂層 where[field][operator] 條件間，Payload 預設以 AND 合併。
  const params = new URLSearchParams({
    'where[product][equals]': productId,
    'where[authorId][equals]': authorId,
    limit: '1',
    depth: '0',
  });
  const res = await fetchWithTimeout(`${CMS_URL}/api/konbini-reviews?${params}`, {
    headers: apiKeyHeaders(),
  });
  if (!res.ok) throw new Error(`existing review lookup ${res.status}`);
  const json = await res.json();
  return json?.docs?.[0] ?? null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const origin = checkOrigin(req.headers ?? {});
  if (!origin.allowed) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const rl = checkRateLimit(RATE_LIMIT_STORE, getClientIp(req));
  if (rl.limited) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  if (!CLIENT_ID || !SUBMIT_API_KEY) {
    res.status(500).json({ error: 'Submissions not configured' });
    return;
  }

  const body = req.body ?? {};
  const idToken = typeof body.idToken === 'string' ? body.idToken : '';
  if (!idToken) {
    res.status(401).json({ error: 'Sign-in required' });
    return;
  }

  // 登入是防灌票的第一道關卡：未通過 Google 驗證一律拒絕，不接受匿名評分。
  const identity = await verifyGoogleIdToken(idToken).catch(() => null);
  if (!identity) {
    res.status(401).json({ error: 'Invalid sign-in' });
    return;
  }

  const check = validateSubmission(body);
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }
  const v = check.value;

  // 照片：解碼＋驗型別/大小。上限 MAX_PHOTOS 張。
  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  if (rawPhotos.length > MAX_PHOTOS) {
    res.status(400).json({ error: `Too many photos (max ${MAX_PHOTOS})` });
    return;
  }
  const decodedPhotos = [];
  for (const raw of rawPhotos) {
    const img = decodeReviewImage(raw);
    if (!img) {
      res.status(400).json({ error: 'Invalid or oversized photo' });
      return;
    }
    decodedPhotos.push(img);
  }

  try {
    // 1) 以 slug 查商品 id（公開唯讀）
    const lookup = await fetchWithTimeout(
      `${CMS_URL}/api/konbini-products?where[slug][equals]=${encodeURIComponent(v.productSlug)}&limit=1&depth=0`,
    );
    if (!lookup.ok) throw new Error(`product lookup ${lookup.status}`);
    const found = await lookup.json();
    const product = found?.docs?.[0];
    if (!product?.id) {
      res.status(400).json({ error: 'Unknown product' });
      return;
    }

    // 2) 先上傳照片到 media（任何一張失敗即整筆放棄，不建立缺圖評價）
    const photoIds = [];
    for (const img of decodedPhotos) {
      const id = await uploadMedia(img, product.name);
      if (!id) throw new Error('media upload failed');
      photoIds.push(id);
    }

    // 3) 防灌票：同一人對同一商品已有評價就更新它，不再新增一筆。
    //    有新照片才覆蓋 photos 欄位；沒有新照片就保留原本的照片。
    const existing = await findExistingReview(product.id, identity.sub);

    const doc = {
      product: product.id,
      rating: v.rating,
      body: v.body,
      authorName: identity.name || '匿名',
      authorId: identity.sub,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      ...(photoIds.length > 0 ? { photos: photoIds.map((id) => ({ image: id })) } : {}),
    };

    const write = await fetchWithTimeout(
      existing?.id
        ? `${CMS_URL}/api/konbini-reviews/${existing.id}`
        : `${CMS_URL}/api/konbini-reviews`,
      {
        method: existing?.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
        body: JSON.stringify(doc),
      },
    );
    if (!write.ok) throw new Error(`${existing?.id ? 'update' : 'create'} ${write.status}`);

    res.status(200).json({ ok: true, updated: Boolean(existing?.id) });
  } catch (err) {
    // 僅伺服器端記錄，不外洩內部細節
    console.error('[konbini-submit]', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
}
