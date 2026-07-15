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

  it('ships the React surface as one component bundle', async () => {
    const html = await readFile(new URL('index.html', root), 'utf8');
    const compiledScripts = [...html.matchAll(/app\/compiled\/([^?"']+)/g)].map((match) => match[1]);
    expect(compiledScripts).toEqual(['app.bundle.js']);
  });

  it('keeps UI components off the window global', async () => {
    const names = ['components', 'globe', 'panels', 'modals', 'login', 'app'];
    const sources = await Promise.all(names.map((name) => readFile(new URL(`app/${name}.jsx`, root), 'utf8')));
    expect(sources.join('\n')).not.toMatch(/window\.(Icon|Flag|GlobeView|FlightLog|ShareModal|LoginGate)/);
  });

  it('reuses the vendored React runtime instead of bundling a second copy', async () => {
    const bundle = await readFile(new URL('app/compiled/app.bundle.js', root), 'utf8');
    expect(bundle).not.toContain('react-jsx-runtime');
    expect(bundle).not.toContain('node_modules/react');
    expect(bundle).toContain('React.createElement');
  });
});
