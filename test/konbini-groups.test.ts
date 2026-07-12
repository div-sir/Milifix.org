import { describe, it, expect } from 'vitest';
import { buildKonbiniCountryGroups, type KonbiniGroupCard, type KonbiniGroupChainMeta } from '../src/lib/konbini-groups';

function card(overrides: Partial<KonbiniGroupCard>): KonbiniGroupCard {
  return {
    slug: 'x',
    name: 'X',
    country: 'taiwan',
    category: 'hotfood',
    chain: 'Chain',
    chainSlug: 'chain',
    avg: 0,
    count: 0,
    price: '',
    ...overrides,
  };
}

function chainMeta(overrides: Partial<KonbiniGroupChainMeta>): KonbiniGroupChainMeta {
  return { slug: 'chain', name: 'Chain', country: 'taiwan', ...overrides };
}

describe('buildKonbiniCountryGroups', () => {
  it('沒有商品的連鎖店也會被列出（讓它先露出、可導去新增商品）', () => {
    const groups = buildKonbiniCountryGroups(
      [chainMeta({ slug: 'seven-tw', name: '7-ELEVEN', country: 'taiwan' })],
      [],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].chains).toHaveLength(1);
    expect(groups[0].chains[0].slug).toBe('seven-tw');
    expect(groups[0].chains[0].items).toHaveLength(0);
  });

  it('商品關聯到不在 CMS 連鎖店清單裡的店時會自動補上（synthesize）', () => {
    const groups = buildKonbiniCountryGroups(
      [],
      [card({ chainSlug: 'ghost-chain', chain: 'Ghost Mart', country: 'japan' })],
    );
    expect(groups).toHaveLength(1);
    expect(groups[0].country).toBe('japan');
    expect(groups[0].chains[0].slug).toBe('ghost-chain');
    expect(groups[0].chains[0].name).toBe('Ghost Mart');
    expect(groups[0].chains[0].items).toHaveLength(1);
  });

  it('國家順序固定為台灣先、日本後', () => {
    const groups = buildKonbiniCountryGroups(
      [
        chainMeta({ slug: 'lawson-jp', name: 'Lawson', country: 'japan' }),
        chainMeta({ slug: 'seven-tw', name: '7-ELEVEN', country: 'taiwan' }),
      ],
      [],
    );
    expect(groups.map((g) => g.country)).toEqual(['taiwan', 'japan']);
  });

  it('沒有任何連鎖店（含空店）的國家會被濾掉', () => {
    const groups = buildKonbiniCountryGroups(
      [chainMeta({ slug: 'seven-tw', name: '7-ELEVEN', country: 'taiwan' })],
      [],
    );
    expect(groups.every((g) => g.country !== 'japan')).toBe(true);
    expect(groups).toHaveLength(1);
  });

  it('同連鎖店底下商品依平均分數高到低排序', () => {
    const groups = buildKonbiniCountryGroups(
      [chainMeta({ slug: 'seven-tw', name: '7-ELEVEN', country: 'taiwan' })],
      [
        card({ slug: 'low', name: 'Low', chainSlug: 'seven-tw', avg: 3, count: 10 }),
        card({ slug: 'high', name: 'High', chainSlug: 'seven-tw', avg: 4.8, count: 2 }),
        card({ slug: 'mid', name: 'Mid', chainSlug: 'seven-tw', avg: 4, count: 5 }),
      ],
    );
    expect(groups[0].chains[0].items.map((c) => c.slug)).toEqual(['high', 'mid', 'low']);
  });

  it('平均分數相同時依評論數高到低排序', () => {
    const groups = buildKonbiniCountryGroups(
      [chainMeta({ slug: 'seven-tw', name: '7-ELEVEN', country: 'taiwan' })],
      [
        card({ slug: 'fewer', name: 'Fewer', chainSlug: 'seven-tw', avg: 4, count: 1 }),
        card({ slug: 'more', name: 'More', chainSlug: 'seven-tw', avg: 4, count: 9 }),
      ],
    );
    expect(groups[0].chains[0].items.map((c) => c.slug)).toEqual(['more', 'fewer']);
  });

  it('分數與評論數都相同時依名稱排序', () => {
    const groups = buildKonbiniCountryGroups(
      [chainMeta({ slug: 'seven-tw', name: '7-ELEVEN', country: 'taiwan' })],
      [
        card({ slug: 'b', name: 'Banana', chainSlug: 'seven-tw', avg: 4, count: 1 }),
        card({ slug: 'a', name: 'Apple', chainSlug: 'seven-tw', avg: 4, count: 1 }),
      ],
    );
    expect(groups[0].chains[0].items.map((c) => c.slug)).toEqual(['a', 'b']);
  });
});
