// @ts-check
// 公開評分端點：接收前端 Google 登入後的評分，驗證身分與內容、擋濫用，
// 再以 service 角色的 Payload API key 寫入一筆評價。公眾不直接接觸
// Payload；Payload 對外維持唯讀。
//
// CMS 端的 RBAC（harden-payload-security）決定了這裡的形狀：
//  - service 帳號只能 create，不能讀 pending、不能以 authorId 查詢、
//    也不能 update／delete，所以舊的「同帳號重複投稿改成更新既有評價」
//    流程已不可行；重複投稿會成為新的 pending 評價，由站主審核時合併
//    或退回（rate limit 仍是灌票的第一道剎車）。
//  - status／submittedAt／審核欄位由 CMS 端 hook 強制（service 建立
//    一律 pending），代理端不再送出這些欄位。
//  - authorId 一律取自伺服器端驗證過的 Google token（identity.sub），
//    不接受瀏覽器自報的值；照片由本端點上傳並取得 media id，瀏覽器
//    無法指定任意 media id 掛進評價（防 IDOR）。
import {
  checkOrigin,
  checkSharedRateLimit,
  getClientIp,
} from './_pass-security.js';
import { validateSubmission } from './_konbini-submit-validate.js';
import { sanitizeReviewImage, MAX_PHOTOS } from './_konbini-image.js';
import {
  CMS_URL,
  SUBMIT_API_KEY,
  fetchWithTimeout,
  apiKeyHeaders,
  uploadSubmissionMedia,
  deleteSubmissionMedia,
} from './_konbini-cms-client.js';
import { CLIENT_ID, verifyGoogleIdToken } from './_konbini-google-auth.js';

/** @type {Map<string, number[]>} 每個暖實例共用的記憶體 rate-limit 表 */
const RATE_LIMIT_STORE = new Map();

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

  const rl = await checkSharedRateLimit(RATE_LIMIT_STORE, 'konbini-submit', getClientIp(req));
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
  if (!identity || !identity.emailVerified) {
    res.status(401).json({ error: 'Invalid sign-in' });
    return;
  }

  const check = validateSubmission(body);
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }
  const v = check.value;

  // 照片：解碼＋驗型別/大小。上限 MAX_PHOTOS 張（低於 CMS 的 5 張上限；
  // sanitize 後單張遠低於 CMS 的 10 MB 上限）。
  const rawPhotos = Array.isArray(body.photos) ? body.photos : [];
  if (rawPhotos.length > MAX_PHOTOS) {
    res.status(400).json({ error: `Too many photos (max ${MAX_PHOTOS})` });
    return;
  }
  const decodedPhotos = [];
  for (const raw of rawPhotos) {
    const img = await sanitizeReviewImage(raw);
    if (!img) {
      res.status(400).json({ error: 'Invalid or oversized photo' });
      return;
    }
    decodedPhotos.push(img);
  }

  const uploadedMediaIds = [];
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

    // 2) 先上傳照片到 private submission-media（任何一張失敗即整筆放棄，
    //    不建立缺圖評價）。alt 帶商品名＋序號，滿足核准公開時的 alt 必填。
    for (const [index, img] of decodedPhotos.entries()) {
      const id = await uploadSubmissionMedia(img, `${product.name} 投稿照片 ${index + 1}`);
      if (!id) throw new Error('media upload failed');
      uploadedMediaIds.push(id);
    }

    // 3) 建立評價。status／submittedAt／審核欄位由 CMS 強制，不在此送出。
    const doc = {
      product: product.id,
      rating: v.rating,
      body: v.body,
      authorName: identity.name || '匿名',
      authorId: identity.sub,
      ...(uploadedMediaIds.length > 0 ? { photos: uploadedMediaIds.map((id) => ({ image: id })) } : {}),
    };

    const write = await fetchWithTimeout(`${CMS_URL}/api/konbini-reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
      body: JSON.stringify(doc),
    });
    if (!write.ok) throw new Error(`create ${write.status}`);

    res.status(200).json({ ok: true });
  } catch (err) {
    await Promise.allSettled(uploadedMediaIds.map((id) => deleteSubmissionMedia(id)));
    // 僅伺服器端記錄，不外洩內部細節
    console.error('[konbini-submit]', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
}
