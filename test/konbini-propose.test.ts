import { describe, it, expect } from 'vitest';
import { validateProposal } from '../api/_konbini-propose-validate.js';

describe('validateProposal', () => {
  const base = { name: '大亨堡', chainSlug: 'seven-eleven-tw', category: 'hotfood', rating: 5 };

  it('accepts a minimal valid proposal and normalises', () => {
    const r = validateProposal(base);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.name).toBe('大亨堡');
      expect(r.value.chainSlug).toBe('seven-eleven-tw');
      expect(r.value.category).toBe('hotfood');
      expect(r.value.rating).toBe(5);
      expect(r.value.price).toBeUndefined();
      expect(r.value.body).toBeUndefined();
    }
  });

  it('rejects a missing or too-long name', () => {
    expect(validateProposal({ ...base, name: '' }).ok).toBe(false);
    expect(validateProposal({ ...base, name: 'a'.repeat(81) }).ok).toBe(false);
    expect(validateProposal({ ...base, name: 'a'.repeat(80) }).ok).toBe(true);
  });

  it('rejects a missing or malformed chainSlug', () => {
    expect(validateProposal({ ...base, chainSlug: undefined }).ok).toBe(false);
    expect(validateProposal({ ...base, chainSlug: 'Bad Slug!' }).ok).toBe(false);
    expect(validateProposal({ ...base, chainSlug: '-leading' }).ok).toBe(false);
  });

  it('rejects an invalid category', () => {
    expect(validateProposal({ ...base, category: 'nope' }).ok).toBe(false);
    expect(validateProposal({ ...base, category: 'dessert' }).ok).toBe(true);
  });

  it('validates price bounds', () => {
    expect(validateProposal({ ...base, price: -1 }).ok).toBe(false);
    expect(validateProposal({ ...base, price: 100001 }).ok).toBe(false);
    expect(validateProposal({ ...base, price: 40 }).ok).toBe(true);
  });

  it('requires an integer rating within 1–5 (bundled first review)', () => {
    expect(validateProposal({ ...base, rating: undefined }).ok).toBe(false);
    expect(validateProposal({ ...base, rating: 0 }).ok).toBe(false);
    expect(validateProposal({ ...base, rating: 6 }).ok).toBe(false);
    expect(validateProposal({ ...base, rating: 3.5 }).ok).toBe(false);
  });

  it('enforces the length cap on the bundled comment and keeps it after trimming', () => {
    expect(validateProposal({ ...base, body: 'a'.repeat(1001) }).ok).toBe(false);
    const r = validateProposal({ ...base, body: '  超好吃  ' });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.body).toBe('超好吃');
  });

  it('rejects a non-object body', () => {
    expect(validateProposal(null).ok).toBe(false);
    expect(validateProposal('nope').ok).toBe(false);
  });
});
