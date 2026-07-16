import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const root = new URL('../public/meridiel/', import.meta.url);

describe('Meridiel loading strategy', () => {
  it('serves flags from a pinned same-origin sprite', async () => {
    const [components, sprite] = await Promise.all([
      readFile(new URL('app/components.jsx', root), 'utf8'),
      readFile(new URL('data/circle-flags.svg', root), 'utf8'),
    ]);
    const ids = [...sprite.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);

    expect(components).toContain('data/circle-flags.svg');
    expect(components).not.toContain('cdn.jsdelivr.net/gh/HatScripts');
    expect(sprite).toContain('id="flag-tw"');
    expect(sprite).toContain('id="flag-us"');
    expect(sprite.match(/id="flag-[a-z]{2}"/g)?.length).toBeGreaterThan(240);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('serves pinned land geometry from Meridiel instead of GitHub Raw', async () => {
    const [globe, geoText] = await Promise.all([
      readFile(new URL('app/globe.jsx', root), 'utf8'),
      readFile(new URL('data/ne_110m_admin_0_countries.geojson', root), 'utf8'),
    ]);
    const geo = JSON.parse(geoText);

    expect(globe).toContain('data/ne_110m_admin_0_countries.geojson');
    expect(globe).not.toContain('raw.githubusercontent.com/vasturiano');
    expect(globe).not.toContain('LAND_CACHE_KEY');
    expect(geo.type).toBe('FeatureCollection');
    expect(geo.features.length).toBeGreaterThan(150);
  });

  it('loads Google Identity Services only when authentication is requested', async () => {
    const [html, store] = await Promise.all([
      readFile(new URL('index.html', root), 'utf8'),
      readFile(new URL('app/store.js', root), 'utf8'),
    ]);

    expect(html).not.toMatch(/<script[^>]+src=["'][^"']*accounts\.google\.com\/gsi\/client/i);
    expect(store).toContain('function loadGis()');
    expect(store).toContain('https://accounts.google.com/gsi/client');
    expect(store).toContain('await loadGis()');
  });

  it('loads global reference data only from the add-flight workflow', async () => {
    const [data, modals] = await Promise.all([
      readFile(new URL('app/data.js', root), 'utf8'),
      readFile(new URL('app/modals.jsx', root), 'utf8'),
    ]);

    expect(data).toContain('function loadReferenceData()');
    expect(data).not.toMatch(/^\s*loadFullAirportDatabase\(\);\s*$/m);
    expect(data).not.toMatch(/^\s*loadFullAirlineDatabase\(\);\s*$/m);
    expect(modals).toContain('ATLAS.loadReferenceData()');
  });

  it('keeps the PNG renderer out of the initial document', async () => {
    const html = await readFile(new URL('index.html', root), 'utf8');
    expect(html).not.toMatch(/<script[^>]+src=["'][^"']*html2canvas/i);
    expect(html).toContain('class="boot-shell"');
  });

  it('keeps the 3D runtime off the welcome screen', async () => {
    const html = await readFile(new URL('index.html', root), 'utf8');
    const loader = await readFile(new URL('app/globe-runtime.js', root), 'utf8');
    expect(html).not.toMatch(/<script[^>]+src=["'][^"']*(globe\.gl|gsap)/i);
    expect(loader).toContain('vendor/globe.gl.min.js');
    expect(loader).toContain('vendor/gsap.min.js');
    expect(loader).toContain('Promise.all');
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
    expect(html).not.toMatch(/app\/(data|model|store)\.js/);
  });

  it('keeps UI components off the window global', async () => {
    const names = ['components', 'globe', 'panels', 'modals', 'login', 'app'];
    const sources = await Promise.all(names.map((name) => readFile(new URL(`app/${name}.jsx`, root), 'utf8')));
    expect(sources.join('\n')).not.toMatch(/window\.(Icon|Flag|GlobeView|FlightLog|ShareModal|LoginGate)/);
  });

  it('keeps app data, persistence, and auth off the window global', async () => {
    const names = ['data', 'model', 'store', 'globe', 'panels', 'modals', 'login', 'app'];
    const sources = await Promise.all(names.map((name) => {
      const extension = ['data', 'model', 'store'].includes(name) ? 'js' : 'jsx';
      return readFile(new URL(`app/${name}.${extension}`, root), 'utf8');
    }));
    expect(sources.join('\n')).not.toMatch(/window\.(ATLAS|MeridielData|MeridielAuth|MeridielStore)/);
  });

  it('reuses the vendored React runtime instead of bundling a second copy', async () => {
    const bundle = await readFile(new URL('app/compiled/app.bundle.js', root), 'utf8');
    expect(bundle).not.toContain('react-jsx-runtime');
    expect(bundle).not.toContain('node_modules/react');
    expect(bundle).toContain('React.createElement');
  });
});
