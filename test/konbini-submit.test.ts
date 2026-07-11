import { describe, it, expect } from 'vitest';
import { validateSubmission } from '../api/_konbini-submit-validate.js';

describe('validateSubmission', () => {
  const base = { productSlug: 'seven-tw-hotdog', rating: 5 };

  it('accepts a minimal valid submission and normalises', () => {
    const r = validateSubmission(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.productSlug).toBe('seven-tw-hotdog');
      expect(r.value.rating).toBe(5);
      // 空選填欄位正規化為 undefined
      expect(r.value.title).toBeUndefined();
      expect(r.value.price).toBeUndefined();
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

  it('enforces length caps on free-text fields', () => {
    expect(validateSubmission({ ...base, title: 'a'.repeat(81) }).ok).toBe(false);
    expect(validateSubmission({ ...base, body: 'a'.repeat(1001) }).ok).toBe(false);
    expect(validateSubmission({ ...base, store: 'a'.repeat(61) }).ok).toBe(false);
    expect(validateSubmission({ ...base, authorName: 'a'.repeat(41) }).ok).toBe(false);
  });

  it('validates price bounds and currency/country enums', () => {
    expect(validateSubmission({ ...base, price: -1 }).ok).toBe(false);
    expect(validateSubmission({ ...base, price: 100001 }).ok).toBe(false);
    expect(validateSubmission({ ...base, price: 40 }).ok).toBe(true);
    expect(validateSubmission({ ...base, currency: 'USD' }).ok).toBe(false);
    expect(validateSubmission({ ...base, currency: 'JPY' }).ok).toBe(true);
    expect(validateSubmission({ ...base, country: 'korea' }).ok).toBe(false);
    expect(validateSubmission({ ...base, country: 'taiwan' }).ok).toBe(true);
  });

  it('keeps provided optional values after trimming', () => {
    const r = validateSubmission({ ...base, title: '  好吃  ', store: ' 台北車站店 ', price: '40' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.title).toBe('好吃');
      expect(r.value.store).toBe('台北車站店');
      expect(r.value.price).toBe(40);
    }
  });

  it('rejects a non-object body', () => {
    expect(validateSubmission(null).ok).toBe(false);
    expect(validateSubmission('nope').ok).toBe(false);
  });
});
