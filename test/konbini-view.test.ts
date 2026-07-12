import { describe, it, expect } from 'vitest';
import { chainName, chainSlug, priceLabel, starString } from '../src/lib/konbini-view';
import type { KonbiniStrings } from '../src/i18n/konbini';

const t: Pick<KonbiniStrings, 'currencySymbol'> = {
  currencySymbol: { TWD: 'NT$', JPY: '¥' },
};

describe('chainName / chainSlug', () => {
  it('回傳關聯物件的名稱與 slug', () => {
    const chain = { id: 'c1', name: '7-ELEVEN', slug: 'seven-eleven-tw', country: 'taiwan' as const, storeType: 'convenience' as const };
    expect(chainName(chain)).toBe('7-ELEVEN');
    expect(chainSlug(chain)).toBe('seven-eleven-tw');
  });

  it('關聯是裸 id 字串時回空字串', () => {
    expect(chainName('chain-id-only')).toBe('');
    expect(chainSlug('chain-id-only')).toBe('');
  });

  it('無關聯（undefined）時回空字串', () => {
    expect(chainName(undefined)).toBe('');
    expect(chainSlug(undefined)).toBe('');
  });
});

describe('priceLabel', () => {
  it('組合幣別符號與金額', () => {
    expect(priceLabel(40, 'TWD', t as KonbiniStrings)).toBe('NT$40');
    expect(priceLabel(238, 'JPY', t as KonbiniStrings)).toBe('¥238');
  });

  it('未帶幣別時預設 TWD', () => {
    expect(priceLabel(40, undefined, t as KonbiniStrings)).toBe('NT$40');
  });

  it('無價格時回空字串', () => {
    expect(priceLabel(undefined, 'TWD', t as KonbiniStrings)).toBe('');
  });
});

describe('starString', () => {
  it('整數分數對應整數顆星', () => {
    expect(starString(5)).toBe('★★★★★');
    expect(starString(3)).toBe('★★★☆☆');
    expect(starString(0)).toBe('☆☆☆☆☆');
  });

  it('用 floor 而非四捨五入，4.5 分只顯示 4 顆實心星（不誇大成滿分）', () => {
    expect(starString(4.5)).toBe('★★★★☆');
    expect(starString(4.9)).toBe('★★★★☆');
  });

  it('4.99 仍不足 5 顆，不進位', () => {
    expect(starString(4.99)).toBe('★★★★☆');
  });

  it('超出 0–5 範圍時夾住（clamp）', () => {
    expect(starString(-1)).toBe('☆☆☆☆☆');
    expect(starString(7)).toBe('★★★★★');
  });
});
