import { describe, expect, it } from 'vitest';
import { classifyBucket } from '../src/data/blog-categories';

describe('blog bucket categories', () => {
  it('recognizes the CMS uncategorized bucket without a build warning', () => {
    expect(classifyBucket('其他 · 未分類')).toEqual({ cat: 'misc', matched: true });
  });

  it('keeps genuinely unknown buckets visible as unmatched', () => {
    expect(classifyBucket('future-category')).toEqual({ cat: 'misc', matched: false });
  });
});
