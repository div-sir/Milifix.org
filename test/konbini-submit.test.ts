import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../api/_konbini-submit-validate.js';

describe('validateSubmission', () => {
  const base = { productSlug: 'seven-tw-hotdog', rating: 5 };

  it('accepts a minimal valid submission (rating only) and normalises', () => {
    const r = validateSubmission(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.productSlug).toBe('seven-tw-hotdog');
      expect(r.value.rating).toBe(5);
      // 空的心得正規化為 undefined
      expect(r.value.body).toBeUndefined();
    }
  });

  it('rejects a missing or malformed productSlug', () => {
    expect(validateSubmission({ rating: 3 }).ok).toBe(false);
    expect(validateSubmission({ productSlug: 'Bad Slug!', rating: 3 }).ok).toBe(false);
    expect(validateSubmission({ productSlug: '-leading', rating: 3 }).ok).toBe(false);
  });

  it('requires an integer rating within 1–5', () => {
    expect(validateSubmission({ ...base, rating: 0 }).ok).toBe(false);
    expect(validateSubmission({ ...base, rating: 6 }).ok).toBe(false);
    expect(validateSubmission({ ...base, rating: 3.5 }).ok).toBe(false);
    expect(validateSubmission({ ...base, rating: 'x' }).ok).toBe(false);
  });

  it('enforces the length cap on the comment body', () => {
    expect(validateSubmission({ ...base, body: 'a'.repeat(1001) }).ok).toBe(false);
    expect(validateSubmission({ ...base, body: 'a'.repeat(1000) }).ok).toBe(true);
  });

  it('keeps a provided comment after trimming', () => {
    const r = validateSubmission({ ...base, body: '  好吃，會再買  ' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.body).toBe('好吃，會再買');
    }
  });

  it('ignores fields outside the reduced schema (title/price/store/country/authorName)', () => {
    const r = validateSubmission({
      ...base,
      title: 'ignored',
      price: 999,
      store: 'ignored',
      country: 'taiwan',
      authorName: 'ignored',
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value).toEqual({ productSlug: 'seven-tw-hotdog', rating: 5, body: undefined });
    }
  });

  it('rejects a non-object body', () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission('nope').ok).toBe(false);
  });
});
