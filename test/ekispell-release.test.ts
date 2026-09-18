import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, dirname } from 'node:path';

const root = resolve('public/ekispell');
const read = (path: string) => readFileSync(resolve(root, path), 'utf8');

describe('EkiSpell deployment release', () => {
  it('keeps the hosted UI equal to its maintained source', () => {
    for (const name of ['app.js','index.html','style.css']) expect(read(name)).toBe(readFileSync(resolve('integrations/ekispell', name), 'utf8'));
  });

  it('pins the release, route, licenses, and canonical URL', () => {
    const release = JSON.parse(read('release.json'));
    expect(release.revision).toMatch(/^[a-f0-9]{40}$/);
    expect(release.route).toBe('/ekispell/');
    expect(read('index.html')).toContain('https://milifix.com/ekispell/');
    expect(read('index.html')).toContain('<noscript>');
    expect(read('LICENSE')).toContain('Permission is hereby granted');
    expect(read('data/stationapi/LICENSE')).toContain('TinyKitten');
  });

  it('ships every browser module and resolves all local imports', () => {
    expect(existsSync(resolve(root, 'dist/index.js'))).toBe(true);
    const files = ['app.js', 'real-data.js', 'map.js', 'routes.js', 'route-panel.js', 'route-options.js', 'metro-journey.js', 'journey-panel.js', 'journey-review.js', ...readdirSync(resolve(root, 'dist')).filter(f => f.endsWith('.js')).map(f => `dist/${f}`)];
    for (const file of files) {
      for (const match of read(file).matchAll(/from\s+['"]([^'"]+)['"]/g)) {
        expect(match[1].startsWith('.')).toBe(true);
        const target = resolve(root, dirname(file), match[1]);
        expect(target.startsWith(root + '/')).toBe(true);
        expect(existsSync(target), `${file} -> ${match[1]}`).toBe(true);
      }
    }
    expect(read('real-data.js')).toContain("'./data/stationapi/'");
  });

  it('ships all station shards with exact manifest hashes', () => {
    const manifest = JSON.parse(read('data/stationapi/manifest.json'));
    expect(manifest.prefectures).toHaveLength(47);
    for (const [name, entry] of Object.entries(manifest.files)) {
      const info = entry as { bytes: number; sha256: string };
      const bytes = readFileSync(resolve(root, 'data/stationapi', name));
      expect(bytes.length, name).toBe(info.bytes);
      expect(createHash('sha256').update(bytes).digest('hex'), name).toBe(info.sha256);
    }
  });
});
