// @ts-check
// 公開「新增商品」端點：接收前端 Google 登入後投稿的新商品，驗證身分與
// 內容、擋濫用，再以 service 角色的 Payload API key 寫入。公眾不直接接觸
// Payload；Payload 對外維持唯讀。
//
// CMS 端安全強化（harden-payload-security）後，service 建立的商品一律被
// 強制為 status=pending——「商品直接上架」的舊產品決策已由 CMS 端的
// RBAC 取代：商品與附帶的第一則評論都要經站主核准才會公開。附圖也改走
// private submission-media（service 無權寫公開 media），只掛在評論上；
// 核准時站主可在後台把它設為商品封面。
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
  uploadSubmissionMedia,
  deleteSubmissionMedia,
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

  let photoId;
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

    // 2) 確認連鎖店關聯有效後才上傳附圖，減少失敗留下的孤兒媒體。
    //    圖片進 private submission-media，只掛在下面的評論；商品封面
    //    （公開 media）由站主核准時自行設定。alt 必填以通過核准檢查。
    if (coverImage) {
      photoId = await uploadSubmissionMedia(coverImage, `${v.name} 投稿照片`);
      if (!photoId) throw new Error('submission media upload failed');
    }

    // 3) 建立商品。country 由連鎖店本身決定，使用者不另外選。
    //    status 不再送出：CMS 對 service 建立的商品強制 pending，
    //    由站主核准後才公開。
    const doc = {
      name: v.name,
      slug: slugify(v.name),
      chain: chain.id,
      country: chain.country,
      category: v.category,
      price: v.price,
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

    // 4) 內建第一則評論。status／submittedAt 由 CMS 強制 pending，未核准
    //    的分數與文字不會進公開聚合。這步失敗時會執行下方補償刪除，
    //    避免只留下半套資料。
    if (createdProductId) {
      const reviewDoc = {
        product: createdProductId,
        rating: v.rating,
        body: v.body,
        authorName: identity.name || '匿名',
        authorId: identity.sub,
        ...(photoId ? { photos: [{ image: photoId }] } : {}),
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
    // Best-effort 補償：新的 RBAC 下 service 無 delete 權限，這些請求可能
    // 被 403 拒絕。此時殘留的商品維持 pending（不公開）、圖片維持
    // private，由站主後台清理，不會外流或出現在公開站上。
    const productDeleted = createdProductId
      ? await deleteDocument('konbini-products', createdProductId).catch(() => false)
      : true;
    if (photoId && productDeleted) await deleteSubmissionMedia(photoId).catch(() => false);
    // 僅伺服器端記錄，不外洩內部細節
    console.error('[konbini-propose-product]', err);
    res.status(500).json({ error: 'Failed to submit product' });
  }
}
