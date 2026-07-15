import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = new URL('../public/meridiel/', import.meta.url);

describe('Meridiel loading strategy', () => {
  it('keeps the PNG renderer out of the initial document', async () => {
    const html = await readFile(new URL('index.html', root), 'utf8');
    expect(html).not.toMatch(/<script[^>]+src=["'][^"']*html2canvas/i);
    expect(html).toContain('class="boot-shell"');
  });

  it('loads the PNG renderer only from the share workflow', async () => {
    const source = await readFile(new URL('app/modals.jsx', root), 'utf8');
    expect(source).toContain('function loadHtml2Canvas()');
    expect(source).toContain('vendor/html2canvas.min.js');
    expect(source).toContain('await loadHtml2Canvas()');
  });
});
