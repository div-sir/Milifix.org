import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

describe('Meridiel security headers', () => {
  it('keeps the route CSP aligned with its actual runtime dependencies', async () => {
    const config = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
    const route = config.headers.find((entry: { source: string }) => entry.source === '/meridiel/(.*)');
    const csp = route?.headers.find((header: { key: string }) => header.key === 'Content-Security-Policy')?.value || '';

    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' https://accounts.google.com");
    expect(csp).toContain("script-src-attr 'none'");
    expect(csp).toContain("connect-src 'self' https://accounts.google.com https://www.googleapis.com");
    expect(csp).toContain("font-src 'self'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain('upgrade-insecure-requests');
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).not.toContain('fonts.googleapis.com');
    expect(csp).not.toContain('fonts.gstatic.com');
    expect(csp).not.toContain('raw.githubusercontent.com');
  });
});
