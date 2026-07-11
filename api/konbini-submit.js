// @ts-check
// 公開投稿端點：接收前端 Google 登入後的評價，驗證身分與內容、擋濫用，
// 再以 Payload API key 寫入一筆 status=pending 的評價（待站主後台審核）。
// 公眾不直接接觸 Payload；Payload 對外維持唯讀。
import {
  checkOrigin,
  checkRateLimit,
  getClientIp,
} from './_pass-security.js';
import { validateSubmission } from './_konbini-submit-validate.js';
import { decodeReviewImage, MAX_PHOTOS } from './_konbini-image.js';

/** @type {Map<string, number[]>} 每個暖實例共用的記憶體 rate-limit 表 */
const RATE_LIMIT_STORE = new Map();

const CMS_URL = process.env.CMS_URL ?? 'http://localhost:3000';
const CLIENT_ID =
  process.env.GOOGLE_OAUTH_CLIENT_ID ?? process.env.PUBLIC_GOOGLE_OAUTH_CLIENT_ID;
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

/**
 * 以 Google tokeninfo 端點驗證 ID token。回傳已驗證的身分或 null。
 * @param {string} idToken
 */
async function verifyGoogleIdToken(idToken) {
  const res = await fetchWithTimeout(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
  );
  if (!res.ok) return null;
  const p = await res.json();
  const issOk = p.iss === 'accounts.google.com' || p.iss === 'https://accounts.google.com';
  const audOk = CLIENT_ID && p.aud === CLIENT_ID;
  const notExpired = Number(p.exp) * 1000 > Date.now();
  if (!issOk || !audOk || !notExpired || !p.sub) return null;
  return {
    sub: String(p.sub),
    name: typeof p.name === 'string' ? p.name : '',
    emailVerified: p.email_verified === true || p.email_verified === 'true',
  };
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
  form.append('alt', String(alt || 'konbini review photo').slice(0, 120));
  const res = await fetchWithTimeout(`${CMS_URL}/api/media`, {
    method: 'POST',
    headers: { Authorization: `users API-Key ${SUBMIT_API_KEY}` },
    body: form,
  });
  if (!res.ok) return null;
  const json = await res.json().catch(() => null);
  return json?.doc?.id ?? null;
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
      const id = await uploadMedia(img, v.title || product.name);
      if (!id) throw new Error('media upload failed');
      photoIds.push(id);
    }

    // 3) 建立待審評價。status / authorId 由伺服器強制，不採信 client。
    const doc = {
      product: product.id,
      rating: v.rating,
      title: v.title,
      body: v.body,
      price: v.price,
      currency: v.currency,
      store: v.store,
      country: v.country,
      authorName: v.authorName || identity.name || '匿名',
      authorId: identity.sub,
      status: 'pending',
      submittedAt: new Date().toISOString(),
      photos: photoIds.map((id) => ({ image: id })),
    };

    const create = await fetchWithTimeout(`${CMS_URL}/api/konbini-reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${SUBMIT_API_KEY}`,
      },
      body: JSON.stringify(doc),
    });
    if (!create.ok) throw new Error(`create ${create.status}`);

    res.status(200).json({ ok: true });
  } catch (err) {
    // 僅伺服器端記錄，不外洩內部細節
    console.error('[konbini-submit]', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
}
