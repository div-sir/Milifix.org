// Import a reviewed EkiSpell release. Production builds use the checked-in files.
import { execFileSync } from 'node:child_process';
import { cp, mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const revision = '2163cc48db5229af3fa684c8142cbd7944fdfcef';
const source = resolve(process.argv[2] || '../EkiSpell');
const git = (...args) => execFileSync('git', ['-C', source, ...args], { encoding: 'utf8' }).trim();
if (git('rev-parse', 'HEAD') !== revision || git('status', '--porcelain')) {
  throw new Error(`Use a clean EkiSpell checkout at ${revision}`);
}
const temporary = await mkdtemp(join(tmpdir(), 'milifix-ekispell-'));
const output = join(root, 'public/ekispell');
try {
  execFileSync(process.execPath, [join(root, 'node_modules/typescript/bin/tsc'), '--project', join(source, 'tsconfig.json'), '--outDir', join(temporary, 'dist')], { stdio: 'inherit' });
  await mkdir(join(temporary, 'site/dist'), { recursive: true });
  for (const file of await readdir(join(temporary, 'dist'))) {
    if (file.endsWith('.js')) await cp(join(temporary, 'dist', file), join(temporary, 'site/dist', file));
  }
  for (const file of ['index.html', 'app.js', 'real-data.js', 'style.css']) {
    let text = await readFile(join(source, 'demo', file), 'utf8');
    text = text.replaceAll("'../dist/", "'./dist/").replaceAll("'../data/", "'./data/");
    if (file === 'index.html') {
      text = text.replace('<main>', '<main><noscript>此工具需要 JavaScript 才能載入車站與產生預覽。請啟用 JavaScript 後重新整理。</noscript>');
      text = text.replace('</head>', '<meta name="description" content="EkiSpell 日本車站排字工具：IC 卡站點篩選、履歷印字推測與草稿預覽。"><link rel="canonical" href="https://milifix.com/ekispell/"></head>');
      text = text.replace('<header>', '<header><a href="/zh/">← MILIFIX</a>');
      text = text.replace('</footer>', '<a href="./LICENSE">EkiSpell MIT</a><a href="./data/stationapi/LICENSE">StationAPI MIT</a></footer>');
    }
    await writeFile(join(temporary, 'site', file), text);
  }
  await cp(join(source, 'data'), join(temporary, 'site/data'), { recursive: true });
  for (const file of ['LICENSE', 'THIRD_PARTY_NOTICES.md']) await cp(join(source, file), join(temporary, 'site', file));
  await writeFile(join(temporary, 'site/release.json'), JSON.stringify({ repository: 'https://github.com/div-sir/EkiSpell', revision, route: '/ekispell/' }, null, 2) + '\n');
  await rm(output, { recursive: true, force: true });
  await cp(join(temporary, 'site'), output, { recursive: true });
  console.log(`EkiSpell ${revision} imported at /ekispell/`);
} finally {
  await rm(temporary, { recursive: true, force: true });
}
