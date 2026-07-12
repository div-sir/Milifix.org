import type { KonbiniCountry } from './cms';

/**
 * 分頁用的卡片資料（由 KonbiniIndexPage 從 CMS 商品 + 已聚合評價組出，
 * 純資料形狀，不依賴 Astro）。
 */
export interface KonbiniGroupCard {
  slug: string;
  name: string;
  country: KonbiniCountry;
  category: string;
  chain: string;
  chainSlug: string;
  avg: number;
  count: number;
  price: string;
}

/** 分頁用的連鎖店最小資訊（來自 CMS konbini-chains）。 */
export interface KonbiniGroupChainMeta {
  slug: string;
  name: string;
  country: KonbiniCountry;
}

export interface KonbiniGroupChain {
  slug: string;
  name: string;
  items: KonbiniGroupCard[];
}

export interface KonbiniCountryGroup {
  country: KonbiniCountry;
  chains: KonbiniGroupChain[];
}

/** 國家分區固定順序：台灣先、日本後。 */
const COUNTRY_ORDER: KonbiniCountry[] = ['taiwan', 'japan'];

/**
 * 依國家（台灣／日本，各自不同主題色）→ 連鎖店分組、組內商品依評分排序。
 *
 * 連鎖店清單以 CMS 的 konbini-chains 為主（含還沒有商品的店，讓它們也
 * 先露出並可導去新增商品），商品關聯到的連鎖店萬一不在該清單裡也一併
 * 補上（synthesize），避免漏掉。同一連鎖店底下的商品依「平均分數
 * 高到低 → 評論數多到少 → 名稱」排序，讓評價最好的商品排前面。整個
 * 國家底下若一家有商品的連鎖店都沒有，該國家分區直接濾掉不顯示。
 */
export function buildKonbiniCountryGroups(
  chains: KonbiniGroupChainMeta[],
  cards: KonbiniGroupCard[],
): KonbiniCountryGroup[] {
  const chainMeta = new Map<string, KonbiniGroupChainMeta>();
  for (const c of chains) chainMeta.set(c.slug, { slug: c.slug, name: c.name, country: c.country });
  for (const c of cards) {
    if (c.chainSlug && !chainMeta.has(c.chainSlug)) {
      chainMeta.set(c.chainSlug, { slug: c.chainSlug, name: c.chain, country: c.country });
    }
  }

  return COUNTRY_ORDER.map((country) => {
    const chainList = [...chainMeta.values()]
      .filter((c) => c.country === country)
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((c) => ({
        slug: c.slug,
        name: c.name,
        items: cards
          .filter((card) => card.chainSlug === c.slug)
          .sort((a, b) => b.avg - a.avg || b.count - a.count || a.name.localeCompare(b.name)),
      }));
    return { country, chains: chainList };
  }).filter((g) => g.chains.length > 0);
}
