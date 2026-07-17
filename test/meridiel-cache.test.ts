import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Meridiel asset caching', () => {
  it('keeps heavy versioned assets immutable for repeat visits', async () => {
    const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
    const expected = [
      '/meridiel/fonts/(.*)',
      '/meridiel/data/(.*)',
      '/meridiel/vendor/(.*)',
      '/meridiel/app/compiled/(.*)',
    ];

    for (const source of expected) {
      const route = config.headers.find((entry: { source: string }) => entry.source === source);
      const cache = route?.headers.find((header: { key: string }) => header.key === 'Cache-Control')?.value;
      expect(cache, source).toBe('public, max-age=31536000, immutable');
    }
  });
});
