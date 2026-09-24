import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { detectLocale, LOCALES, MESSAGES, translate } from '../public/meridiel/app/i18n.js';

const messages = MESSAGES as Record<string, Record<string, string>>;
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Meridiel translations', () => {
  it('ships every key in every locale with the same placeholders', () => {
    const keys = Object.keys(messages.en).sort();
    for (const locale of LOCALES) {
      expect(Object.keys(messages[locale]).sort(), locale).toEqual(keys);
      for (const key of keys) {
        expect(messages[locale][key], `${locale} ${key}`).not.toBe('');
        expect(placeholders(messages[locale][key]), `${locale} ${key}`).toEqual(placeholders(messages.en[key]));
      }
    }
  });

  it('only uses <b> markup in strings without placeholders', () => {
    for (const locale of LOCALES) {
      for (const [key, text] of Object.entries(messages[locale])) {
        const tags = text.match(/<\/?([a-z]+)[^>]*>/gi) || [];
        expect(tags.every((tag) => /^<\/?b>$/.test(tag)), `${locale} ${key}`).toBe(true);
        if (tags.length) expect(placeholders(text), `${locale} ${key}`).toEqual([]);
      }
    }
  });

  it('references only keys that exist', async () => {
    const files = ['app.jsx', 'components.jsx', 'panels.jsx', 'modals.jsx', 'login.jsx'];
    const sources = await Promise.all(files.map((f) => readFile(new URL(`../public/meridiel/app/${f}`, import.meta.url), 'utf8')));
    const used = new Set(sources.flatMap((src) => [...src.matchAll(/\bt\("([\w.]+)"/g)].map((m) => m[1])));
    const missing = [...used].filter((key) => !(key in messages.en));
    expect(missing).toEqual([]);
  });

  it('fills placeholders and falls back to English', () => {
    expect(translate('zh-Hant', 'import.done', { count: 3 })).toBe('已匯入 3 筆航班 ✓');
    expect(translate('xx', 'import.done', { count: 3 })).toBe('Imported 3 flights ✓');
  });

  it('prefers a saved choice, then the browser language', () => {
    const storage = (value: string | null) => ({ getItem: () => value });
    expect(detectLocale(storage('ja'), ['zh-TW'])).toBe('ja');
    expect(detectLocale(storage(null), ['zh-TW', 'en'])).toBe('zh-Hant');
    expect(detectLocale(storage(null), ['fr-FR', 'ja-JP'])).toBe('ja');
    expect(detectLocale(storage(null), ['fr-FR'])).toBe('en');
  });
});
