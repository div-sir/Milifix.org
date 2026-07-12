// @ts-check
// 公開「回報錯誤」端點：接收前台懸浮按鈕彈窗送出的問題回報（文字說明＋
// 選填截圖），寫進 CMS 的 konbini-reports（站主自己的問題收件匣，不對
// 外公開）。不要求 Google 登入——回報問題的門檻應該越低越好，rate limit
// 是防濫用的第一道關卡（跟其他 konbini 端點一樣，公眾不直接接觸
// Payload；Payload 對外維持唯讀）。
import { checkOrigin, checkRateLimit, getClientIp } from './_pass-security.js';
import { validateReport } from './_konbini-report-validate.js';
import { decodeReviewImage } from './_konbini-image.js';
import { CMS_URL, SUBMIT_API_KEY, fetchWithTimeout, apiKeyHeaders, uploadMedia } from './_konbini-cms-client.js';

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

  const rl = checkRateLimit(RATE_LIMIT_STORE, getClientIp(req));
  if (rl.limited) {
    res.setHeader('Retry-After', String(rl.retryAfter));
    res.status(429).json({ error: 'Too many requests. Please try again later.' });
    return;
  }

  if (!SUBMIT_API_KEY) {
    res.status(500).json({ error: 'Reporting not configured' });
    return;
  }

  const body = req.body ?? {};
  const check = validateReport(body);
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }
  const v = check.value;

  let photoId;
  if (body.photo) {
    const img = decodeReviewImage(body.photo);
    if (!img) {
      res.status(400).json({ error: 'Invalid or oversized photo' });
      return;
    }
    const id = await uploadMedia(img, v.pageTitle || 'konbini report');
    if (!id) {
      res.status(502).json({ error: 'Photo upload failed' });
      return;
    }
    photoId = id;
  }

  try {
    const doc = {
      pageUrl: v.pageUrl,
      message: v.message,
      pageTitle: v.pageTitle,
      productName: v.productName,
      status: 'new',
      submittedAt: new Date().toISOString(),
      ...(photoId ? { photo: photoId } : {}),
      ...(v.productId ? { product: v.productId } : {}),
    };

    const create = await fetchWithTimeout(`${CMS_URL}/api/konbini-reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
      body: JSON.stringify(doc),
    });
    if (!create.ok) throw new Error(`create ${create.status}`);

    res.status(200).json({ ok: true });
  } catch (err) {
    // 僅伺服器端記錄，不外洩內部細節
    console.error('[konbini-report]', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
}
