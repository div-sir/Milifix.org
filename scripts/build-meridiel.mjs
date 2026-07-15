// Bundle the Meridiel React surface into one ordered browser script.
//
// React, ReactDOM, GSAP, and globe.gl remain vendored UMD runtimes for now.
// Application components are ES modules during the build: Vite resolves their
// imports, compiles JSX, and emits one classic IIFE. This removes the fragile
// six-script window.X component chain without mixing the persistence/data
// migration into the same change.
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, '../public/meridiel/app');
const OUT_DIR = path.join(APP_DIR, 'compiled');
const LEGACY_OUTPUTS = ['components.js', 'globe.js', 'panels.js', 'modals.js', 'login.js', 'app.js'];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await Promise.all(LEGACY_OUTPUTS.map((name) => rm(path.join(OUT_DIR, name), { force: true })));

  await build({
    configFile: false,
    publicDir: false,
    logLevel: 'warn',
    esbuild: {
      jsx: 'transform',
      jsxFactory: 'React.createElement',
      jsxFragment: 'React.Fragment',
    },
    build: {
      lib: {
        entry: path.join(APP_DIR, 'app.jsx'),
        formats: ['iife'],
        name: 'MeridielApp',
        fileName: () => 'app.bundle.js',
      },
      outDir: OUT_DIR,
      emptyOutDir: false,
      minify: 'esbuild',
      sourcemap: false,
      target: 'es2020',
      rollupOptions: { output: { extend: false } },
    },
  });

  console.log('[build-meridiel] app.jsx + 5 component modules -> compiled/app.bundle.js');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
