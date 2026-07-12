import { describe, it, expect } from 'vitest';
import { validateReport } from '../api/_konbini-report-validate.js';

describe('validateReport', () => {
  const base = { pageUrl: 'https://milifix.com/zh/konbini' };

  it('accepts a message-only report', () => {
    const r = validateReport({ ...base, message: '這張圖片壞掉了' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.pageUrl).toBe('https://milifix.com/zh/konbini');
      expect(r.value.message).toBe('這張圖片壞掉了');
      expect(r.value.productId).toBeUndefined();
    }
  });

  it('accepts a photo-only report (no message)', () => {
    const r = validateReport({ ...base, photo: 'data:image/jpeg;base64,xxx' });
    expect(r.ok).toBe(true);
  });

  it('rejects when neither message nor photo is provided', () => {
    expect(validateReport({ ...base }).ok).toBe(false);
    expect(validateReport({ ...base, message: '   ' }).ok).toBe(false);
  });

  it('requires a non-empty pageUrl', () => {
    expect(validateReport({ message: 'hi' }).ok).toBe(false);
    expect(validateReport({ pageUrl: '', message: 'hi' }).ok).toBe(false);
  });

  it('enforces the length cap on message', () => {
    expect(validateReport({ ...base, message: 'a'.repeat(2001) }).ok).toBe(false);
    expect(validateReport({ ...base, message: 'a'.repeat(2000) }).ok).toBe(true);
  });

  it('keeps a well-formed productId, drops a malformed one', () => {
    const good = validateReport({ ...base, message: 'hi', productId: 'sample-hotdog' });
    expect(good.ok).toBe(true);
    if (good.ok) expect(good.value.productId).toBe('sample-hotdog');

    const bad = validateReport({ ...base, message: 'hi', productId: '../../etc/passwd' });
    expect(bad.ok).toBe(true);
    if (bad.ok) expect(bad.value.productId).toBeUndefined();
  });

  it('trims and caps pageTitle/productName', () => {
    const r = validateReport({ ...base, message: 'hi', pageTitle: '  某頁面  ', productName: '  某商品  ' });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.pageTitle).toBe('某頁面');
      expect(r.value.productName).toBe('某商品');
    }
  });

  it('rejects a non-object body', () => {
    expect(validateReport(null).ok).toBe(false);
    expect(validateReport('nope').ok).toBe(false);
  });
});
