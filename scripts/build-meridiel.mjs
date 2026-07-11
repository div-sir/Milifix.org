// 把 public/meridiel/app/*.jsx 預編譯成 public/meridiel/app/compiled/*.js。
//
// Meridiel 子應用是舊式「classic script（非 ES module）＋ 全域變數」架構
// （React/ReactDOM/gsap/globe.gl 由 vendor UMD 掛在 window 上；各檔案再
// 互相把元件掛到 window.X 供下一份 script 使用，見 index.html 的載入順序）。
// 這裡只做 JSX → React.createElement 的語法轉換（@babel/preset-react
// classic runtime，不注入 import），刻意不動全域架構，讓正式站不再需要
// 瀏覽器內即時跑 @babel/standalone。
//
// 載入順序必須與 index.html 一致：components → globe → panels → modals
// → login → app（後面的檔案會用到前面掛在 window 上的東西）。
//
// public/meridiel/vendor/ 底下的第三方 production 檔（react / react-dom /
// gsap / html2canvas / globe.gl）不是這支腳本產生的，是一次性用
// `npm pack <pkg>@<version>` 下載 tarball、解開後把對應的 production
// dist 檔複製進來（沙箱網路只通 npm registry、不通 unpkg，因此無法直接
// curl CDN）。版本更新時重新 npm pack 對應版本、覆蓋 vendor/ 下的檔案即可。
import { transformAsync } from '@babel/core';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP_DIR = path.join(__dirname, '../public/meridiel/app');
const OUT_DIR = path.join(APP_DIR, 'compiled');

// 與 index.html 的 <script> 順序一致
const ENTRIES = ['components', 'globe', 'panels', 'modals', 'login', 'app'];

async function buildOne(name) {
  const srcPath = path.join(APP_DIR, `${name}.jsx`);
  const outPath = path.join(OUT_DIR, `${name}.js`);
  const source = await readFile(srcPath, 'utf8');
  const result = await transformAsync(source, {
    filename: srcPath,
    presets: [['@babel/preset-react', { runtime: 'classic' }]],
    // 保留原始变量/函式名稱，方便 console 除錯；不做壓縮（vendor 已是 min 版，
    // 這幾份業務邏輯檔案體積本身不大，可讀性優先）
    compact: false,
    minified: false,
    sourceMaps: false,
  });
  if (!result?.code) throw new Error(`[build-meridiel] ${name}.jsx 編譯失敗：babel 沒有輸出`);
  const banner = `/* 由 scripts/build-meridiel.mjs 從 ${name}.jsx 編譯產生，請勿手動編輯 */\n`;
  // 原本用 babel-standalone 在瀏覽器內以 type="text/babel" 執行時，每份
  // script 各自跑在獨立的函式作用域（babel-standalone 內部用類似
  // new Function 的方式執行，而非直接注入 <script> 標籤），因此
  // components.jsx 與 globe.jsx 都各自宣告 `const { useRef, useEffect } =
  // React` 也不衝突。改成一般 <script src> 後，多份 script 會共用同一份
  // 全域 lexical scope，同名 const/let 會直接 SyntaxError。用 IIFE 包住
  // 每份編譯輸出還原原本的作用域隔離；跨檔案溝通本來就是靠明確的
  // window.X 賦值，IIFE 不影響這部分。
  const wrapped = `(function () {\n${result.code}\n})();\n`;
  await writeFile(outPath, banner + wrapped);
  console.log(`[build-meridiel] ${name}.jsx -> compiled/${name}.js (${result.code.length} bytes)`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const name of ENTRIES) {
    await buildOne(name);
  }
  console.log(`[build-meridiel] done: ${ENTRIES.length} files`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
