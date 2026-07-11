import type { KonbiniChain, KonbiniCurrency, KonbiniProduct } from './cms';
import type { KonbiniStrings } from '../i18n/konbini';

/** 連鎖店名稱（關聯可能是物件或裸 id；後者回空字串）。 */
export function chainName(chain: KonbiniProduct['chain']): string {
  if (!chain || typeof chain === 'string') return '';
  return (chain as KonbiniChain).name;
}

/** 連鎖店 slug（關聯可能是物件或裸 id；後者回空字串）。 */
export function chainSlug(chain: KonbiniProduct['chain']): string {
  if (!chain || typeof chain === 'string') return '';
  return (chain as KonbiniChain).slug;
}

/** 價格標籤，如 NT$40 / ¥238；無價回空字串。 */
export function priceLabel(
  price: number | undefined,
  currency: KonbiniCurrency | undefined,
  t: KonbiniStrings,
): string {
  if (price == null) return '';
  const sym = t.currencySymbol[currency ?? 'TWD'];
  return `${sym}${price}`;
}

/**
 * 以五顆星表示平均分——僅作為數字分數旁的裝飾（呼叫端應把數字分數當
 * 主要呈現，這裡的星星整組標 aria-hidden）。改用無條件捨去（Math.floor）
 * 而非四捨五入：四捨五入會讓 4.5 分顯示成滿滿 5 顆星，造成觀感灌水；
 * 捨去後 4.5 只會顯示 4 顆實心星，跟旁邊寫的「4.5」不會互相矛盾。
 */
export function starString(avg: number): string {
  const full = Math.max(0, Math.min(5, Math.floor(avg)));
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full);
}
