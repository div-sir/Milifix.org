import {
  getKonbiniProducts,
  getKonbiniProduct,
  getApprovedKonbiniReviews,
  reviewProductId,
  type KonbiniProduct,
} from './cms';
import { isAllowEmpty } from './cms-env';
import { KONBINI_SAMPLES } from '../data/konbini-samples';

export { averageRating } from './cms';

/**
 * konbini 商品 + 已核准評價的組裝層。
 *
 * 評價是獨立 collection，這裡一次抓回全部已核准評價、依 product id 分組後
 * 塞回各商品的 `reviews`。CMS 回空且開了逃生旗標（preview / 本地）時，回退
 * 到示範資料，讓版面可被檢視；正式 build 若 CMS 不可達會在 cms.ts fail-fast。
 */

function groupReviews(products: KonbiniProduct[], reviews: Awaited<ReturnType<typeof getApprovedKonbiniReviews>>): KonbiniProduct[] {
  const byProduct = new Map<string, typeof reviews>();
  for (const r of reviews) {
    const pid = reviewProductId(r);
    if (!pid) continue;
    const list = byProduct.get(pid) ?? [];
    list.push(r);
    byProduct.set(pid, list);
  }
  return products.map((p) => ({ ...p, reviews: byProduct.get(p.id) ?? p.reviews ?? [] }));
}

/** 首頁：全部商品（已聚合評價）。空且允許空資料時回退示範資料。 */
export async function loadKonbiniProducts(): Promise<KonbiniProduct[]> {
  const [products, reviews] = await Promise.all([
    getKonbiniProducts(),
    getApprovedKonbiniReviews(),
  ]);
  if (products.length === 0 && isAllowEmpty()) return KONBINI_SAMPLES;
  return groupReviews(products, reviews);
}

/** 詳情頁：單一商品（已聚合評價）。 */
export async function loadKonbiniProduct(slug: string): Promise<KonbiniProduct | null> {
  const product = await getKonbiniProduct(slug);
  if (!product) {
    if (isAllowEmpty()) return KONBINI_SAMPLES.find((p) => p.slug === slug) ?? null;
    return null;
  }
  const reviews = await getApprovedKonbiniReviews();
  return groupReviews([product], reviews)[0];
}

/** 產生靜態路徑用：所有商品 slug（含示範資料）。 */
export async function allKonbiniSlugs(): Promise<{ slug: string }[]> {
  const products = await getKonbiniProducts();
  const source = products.length === 0 && isAllowEmpty() ? KONBINI_SAMPLES : products;
  return source.map((p) => ({ slug: p.slug }));
}
