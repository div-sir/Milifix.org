import { describe, expect, it } from 'vitest';
import { resolveBlogBucket } from './blog-bucket-rules';

describe('resolveBlogBucket', () => {
  it('returns misc for non-zephlog posts', () => {
    expect(resolveBlogBucket('notes/abc')).toBe('其他 · 未分類');
  });

  it('classifies curated posts as misc', () => {
    expect(resolveBlogBucket('zephlog/curated/something')).toBe('其他 · 未分類');
  });

  it('classifies scenic train notes', () => {
    expect(resolveBlogBucket('zephlog/筆記/日本觀光列車/etSETOra-エトセトラ')).toBe('鐵道·票券 · 觀光列車');
  });

  it('classifies trip leaves', () => {
    expect(resolveBlogBucket('zephlog/筆記/2025-曼谷旅行手冊')).toBe('遊記·足跡 · 行程');
  });

  it('classifies aviation handbook style notes', () => {
    expect(resolveBlogBucket('zephlog/筆記/f35-飛行手冊')).toBe('航空·哩程 · 計畫與手冊');
  });

  it('falls back to uncategorized for unknown note leaf', () => {
    expect(resolveBlogBucket('zephlog/筆記/some-new-note')).toBe('其他 · 筆記未歸類');
  });
});
