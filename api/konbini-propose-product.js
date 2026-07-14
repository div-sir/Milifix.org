// @ts-check
// 公開「新增商品」端點：接收前端 Google 登入後投稿的新商品，驗證身分與
// 內容、擋濫用，再以 Payload API key 寫入一筆 status=approved 的商品
// （商品直接上架以延續新話題的討論熱度；附帶的第一則評論仍進 pending
// 後台審核）。公眾不
// 直接接觸 Payload；Payload 對外維持唯讀。
//
// 連鎖店維持站主在後台既有維護（既有、已核准的連鎖店清單），使用者只能
// 從既有連鎖店挑選，不能連帶新增連鎖店——避免商品／連鎖店兩層都要審核
// 造成資料混亂。
import { checkOrigin, checkSharedRateLimit, getClientIp } from './_pass-security.js';
import { validateProposal } from './_konbini-propose-validate.js';
import { sanitizeReviewImage } from './_konbini-image.js';
import {
  CMS_URL,
  SUBMIT_API_KEY,
  fetchWithTimeout,
  apiKeyHeaders,
  uploadMedia,
  deleteMedia,
  deleteDocument,
} from './_konbini-cms-client.js';
import { CLIENT_ID, verifyGoogleIdToken } from './_konbini-google-auth.js';

/** @type {Map<string, number[]>} 每個暖實例共用的記憶體 rate-limit 表 */
const RATE_LIMIT_STORE = new Map();

/** 把商品名稱轉成網址用 slug；中日文名稱多半轉不出可讀片段，一律再加隨機
 *  尾碼確保唯一，不額外查詢資料庫比對碰撞。
 *  @param {string} name
 */
function slugify(name) {
  const base = name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const suffix = Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
  return `${base || 'item'}-${suffix}`;
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

  const rl = await checkSharedRateLimit(RATE_LIMIT_STORE, 'konbini-propose-product', getClientIp(req));
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

  // 登入是防灌水的第一道關卡：未通過 Google 驗證一律拒絕。
  const identity = await verifyGoogleIdToken(idToken).catch(() => null);
  if (!identity || !identity.emailVerified) {
    res.status(401).json({ error: 'Invalid sign-in' });
    return;
  }

  const check = validateProposal(body);
  if (!check.ok) {
    res.status(400).json({ error: check.error });
    return;
  }
  const v = check.value;

  let coverImage;
  if (body.cover) {
    const img = await sanitizeReviewImage(body.cover);
    if (!img) {
      res.status(400).json({ error: 'Invalid or oversized cover photo' });
      return;
    }
    coverImage = img;
  }

  let coverId;
  let createdProductId;
  try {
    // 1) 以 slug 查連鎖店 id（公開唯讀；只認已核准的連鎖店）
    const lookup = await fetchWithTimeout(
      `${CMS_URL}/api/konbini-chains?where[slug][equals]=${encodeURIComponent(v.chainSlug)}&limit=1&depth=0`,
    );
    if (!lookup.ok) throw new Error(`chain lookup ${lookup.status}`);
    const found = await lookup.json();
    const chain = found?.docs?.[0];
    if (!chain?.id) {
      res.status(400).json({ error: 'Unknown chain' });
      return;
    }

    // 2) 確認商品關聯有效後才上傳封面，減少失敗留下的孤兒媒體。
    if (coverImage) {
      coverId = await uploadMedia(coverImage, v.name);
      if (!coverId) throw new Error('cover media upload failed');
    }

    // 3) 建立商品。country 由連鎖店本身決定，使用者不另外選。
    //    商品 status 直接 approved 是刻意的產品決策：讓新話題可立即開始；
    //    評論內容仍須走下方 pending 審核。
    const doc = {
      name: v.name,
      slug: slugify(v.name),
      chain: chain.id,
      country: chain.country,
      category: v.category,
      price: v.price,
      status: 'approved',
      ...(coverId ? { cover: coverId } : {}),
    };

    const create = await fetchWithTimeout(`${CMS_URL}/api/konbini-products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
      body: JSON.stringify(doc),
    });
    if (!create.ok) throw new Error(`create ${create.status}`);
    const created = await create.json();
    createdProductId = created?.doc?.id;
    if (!createdProductId) throw new Error('create returned no product id');

    // 4) 內建第一則評論一律 pending。商品會先上架以承接話題，但未核准的
    //    分數與文字不會進公開聚合，避免把未審內容當成站方背書。
    //    照片沿用同一張（若有上傳）：同時是商品封面，也是這則評論的照片。
    //    這步失敗時會執行下方補償刪除，避免只留下半套資料。
    if (createdProductId) {
      const reviewDoc = {
        product: createdProductId,
        rating: v.rating,
        body: v.body,
        authorName: identity.name || '匿名',
        authorId: identity.sub,
        status: 'pending',
        submittedAt: new Date().toISOString(),
        ...(coverId ? { photos: [{ image: coverId }] } : {}),
      };
      const reviewCreate = await fetchWithTimeout(`${CMS_URL}/api/konbini-reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...apiKeyHeaders() },
        body: JSON.stringify(reviewDoc),
      });
      if (!reviewCreate.ok) {
        throw new Error(`bundled review create ${reviewCreate.status}`);
      }
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    // 以補償操作維持一致性：第一則評論建立失敗時撤銷剛建立的商品；任何
    // 未被保留的封面也一併刪除，不留下 orphan media／半完成資料。
    const productDeleted = createdProductId
      ? await deleteDocument('konbini-products', createdProductId).catch(() => false)
      : true;
    if (coverId && productDeleted) await deleteMedia(coverId).catch(() => false);
    // 僅伺服器端記錄，不外洩內部細節
    console.error('[konbini-propose-product]', err);
    res.status(500).json({ error: 'Failed to submit product' });
  }
}
