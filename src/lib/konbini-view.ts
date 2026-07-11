import type { KonbiniChain, KonbiniCurrency, KonbiniProduct } from './cms';
import type { KonbiniStrings } from '../i18n/konbini';

/** 連鎖店名稱（關聯可能是物件或裸 id；後者回空字串）。 */
export function chainName(chain: KonbiniProduct['chain']): string {
  if (!chain || typeof chain === 'string') return '';
  return (chain as KonbiniChain).name;
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

/** 以五顆星表示平均分（四捨五入到半顆以整顆呈現）。 */
export function starString(avg: number): string {
  const full = Math.round(avg);
  return '★★★★★☆☆☆☆☆'.slice(5 - full, 10 - full);
}
