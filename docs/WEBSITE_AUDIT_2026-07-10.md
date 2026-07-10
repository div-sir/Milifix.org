# Milifix.org 全站審查 2026-07-10 — 10 項必修缺失

審查範圍：全部 pages / components / scripts / styles / i18n / data / api / public（含 Meridiel 子應用）/ CI / 部署設定。實跑驗證：`astro check`（0 errors / 10 hints）、`CMS_ALLOW_EMPTY=1 astro build`（24 頁成功）、`vitest run`（58 tests 通過）、`npm audit --omit=dev`（2 moderate）。

前次審查（`WEBSITE_REVIEW_AND_TASKS.md`，2026-07-05）所列 P0 多已修復：BaseLayout 已統一、404 頁已建、CI 已跑 build、cms.ts 已 fail-fast + memoize、generate-pass API 已有 rate limit / origin 檢查、安全 headers 已上、robots.txt / sitemap / hreflang 已齊。本次為新一輪審查，以下 10 項按嚴重度排序。

---

## 1.（P0 效能/安全）Meridiel 子應用在正式站跑 React development 版 + 瀏覽器內 Babel 編譯

`public/meridiel/index.html:25-27` 從 unpkg 載入 `react.development.js`、`react-dom.development.js` 與 `@babel/standalone`（~2.5MB），六個 `.jsx` 以 `type="text/babel"` 在**每次頁面載入時於主執行緒即時編譯**。`globe.gl` / `gsap` / `html2canvas` 三個 CDN script 無 SRI（`:15-17`）。另 `:5` 的 `user-scalable=no` 是 a11y 反模式。

**修法**：
- 以 `npm pack`（npm registry 可達）取得 react / react-dom **production** UMD、globe.gl、gsap、html2canvas 的 dist 檔，vendor 進 `public/meridiel/vendor/`，全部改為同源載入（消滅 unpkg 依賴；`accounts.google.com/gsi/client` 必須維持遠端）。
- 新增 `scripts/build-meridiel.mjs`：用 `@babel/core` + `@babel/preset-react` 把 `app/*.jsx` 預編譯成 `app/compiled/*.js`，`index.html` 改載編譯產物、移除 babel-standalone；在 `package.json` 以 `prebuild` 掛上，並讓 CI 驗證編譯產物與源檔同步。
- 移除 `user-scalable=no`。

**驗收**：meridiel 頁面 HTML 內無任何 `unpkg.com` 字樣；無 `text/babel`；本地 serve `dist` 後以 Playwright 開啟 `/meridiel/`，console 無未捕捉錯誤且 `#root` 有渲染內容（GSI 載入失敗屬可接受的網路限制）。

## 2.(P0 內容正確性）Lexical 渲染器把連結、圖片、表格靜默丟棄

`src/lib/lexical.ts:38-59` 只處理 paragraph / heading / list / quote / hr / text。blog 文章（Payload Lexical）中的 `link` / `autolink` 節點被展平成純文字、`upload`（圖片）與 `table` 節點整個消失，且無任何警告——內容缺漏無從察覺。

**修法**：支援 `link` / `autolink`（href 僅允許 `http:` / `https:` / `mailto:`，其餘輸出純文字；`rel="noopener noreferrer"`、外部連結 `target="_blank"`）；支援 `upload` / `image`（輸出 `<img>` 含 `alt`、`loading="lazy"`、`decoding="async"`，有尺寸資訊時輸出 width/height）；支援 `table` / `tablerow` / `tablecell`（basic）；遇未知節點型別 `console.warn` 一次（含型別名）。同步更新 `test/lexical.test.ts`。

**驗收**：新增測試涵蓋 link（含 `javascript:` 被拒）、upload、table、未知節點 warn；`vitest run` 全綠。

## 3.（P1 SEO）全站零 og:image——所有社群分享都沒有預覽圖

`BaseLayout.astro` 支援 `ogImage` prop，但**沒有任何頁面傳入**，`public/` 也無預設分享圖；`twitter:card` 因此全部退化為 `summary`。三語內容站分享到任何平台都是純文字卡。

**修法**：製作 1200×630 預設 og image（以站內視覺語言：深底、Milifix 字標；可用 sharp 或手寫 SVG 轉 PNG，產物進 `public/og-default.png`）；`BaseLayout` 在未傳 `ogImage` 時 fallback 到它；blog 文章 / works 有 `cover` 時傳 cover URL。

**驗收**：build 後任一頁 view-source 均有 `og:image`；有 cover 的內容頁 og:image 為 cover URL；`twitter:card` 在有圖頁面為 `summary_large_image`。

## 4.（P1 效能）旅行報告書頁單一 JS bundle 超過 1MB

`trip-report-client.ts:1-2` 頂層 `import maplibre-gl`，整個 maplibre（＋gsap）被打進 `TripReportPage...js`（實測 dist 內 1,036,705 bytes），頁面一載入就下載，即使地圖還在視口外。

**修法**：maplibre 改為動態載入——以 `IntersectionObserver` 在地圖容器接近視口（`rootMargin` 預抓）時 `await import('maplibre-gl')`；CSS 亦隨之動態注入或拆分。gsap/ScrollTrigger 可留（體積小）。

**驗收**：build 後 trip report 頁初始載入的頁面 script（不含動態 chunk）< 200KB；maplibre 成為獨立 lazy chunk；Playwright 開啟報告書頁捲動至地圖，地圖仍正常初始化。

## 5.（P1 效能/CLS）圖片交付未最佳化、部分 `<img>` 缺尺寸

18 處裸 `<img>`：`PhotoPlaceholder.astro:23` 與 `trip-photo-lightbox.ts:40` 的 `<img>` 無 width/height（CLS）；`WorkSlugPage.astro:111` hero 直載 UploadThing 原圖且無 preload；全站無 srcset / 現代格式（`astro.config.mjs` 的 `image.domains` 形同虛設）。

**修法**（本輪做可離線驗證的子集）：所有 `<img>` 補齊 width/height（lightbox 可用 aspect-ratio CSS 佔位）；`WorkSlugPage` hero 加 `<link rel="preload" as="image">`（透過 BaseLayout `head` slot）；`astro.config.mjs` 補 `image.remotePatterns`（utfs.io / *.ufs.sh / images.unsplash.com）為後續轉 `astro:assets` 鋪路，並在本文件記錄「全面轉 astro:assets 需以真實 CMS 資料驗證」為中期項目。

**驗收**：`git grep '<img' src` 每處皆有明確尺寸或 CSS aspect-ratio 佔位；works 頁 head 有 hero preload；build 綠。

## 6.（P1 安全）生產依賴含已知漏洞：passkit-generator → joi

`npm audit --omit=dev` 回報 2 moderate：`passkit-generator` 依賴有漏洞的 `joi` 版本。簽 Apple Pass 的 API 路徑正是用它。

**修法**：優先嘗試升級 `passkit-generator` 至不受影響版本；不可行則以 `package.json` `overrides` 強制 `joi` 到修復版，並跑 `test/pass-security.test.ts` 確認不破功。CI 加 `npm audit --omit=dev --audit-level=moderate` step 防回歸。

**驗收**：`npm audit --omit=dev` 0 vulnerabilities；`vitest run` 全綠；CI 含 audit step。

## 7.（P1 SEO）blog 文章無 Article 結構化資料、無發佈日期

JSON-LD 全站只有 `CardSlugPage` 有。`BlogPostPage.astro` 無 `og:type=article`、無 `article:published_time`、無 JSON-LD `Article`，頁面上甚至不顯示發佈日期（`CmsPost.date` 存在但未用於 meta）。

**修法**：`BaseLayout` 加 `ogType` 與 `articlePublishedTime` props（預設 `website` / 不輸出）；`BlogPostPage` 傳入並輸出 JSON-LD `BlogPosting`（headline / datePublished / inLanguage / image 有 cover 才給）；文章 header 顯示 `<time datetime>`（三語日期格式用現有 i18n 慣例）。

**驗收**：build 後 blog 文章頁含 `og:type=article`、`article:published_time`、有效 JSON-LD（`JSON.parse` 可過）；列表頁不受影響。

## 8.（P1 安全）CSP 缺 script-src / default-src，對 XSS 幾乎無防禦

`vercel.json:16` 的 CSP 只有 `frame-ancestors / base-uri / object-src / form-action`。任何注入的 `<script>`（例如未來 CMS 內容路徑出問題）都能直接執行、外連任意網域。

**修法**：擴充為完整 CSP，主站與 `/meridiel/*` 分兩條 route（item 1 完成後 meridiel 已同源化，僅需放行 `accounts.google.com`）。主站至少：`default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://tiles.openfreemap.org https://accounts.google.com; font-src 'self'; worker-src 'self' blob:; frame-src https://accounts.google.com`＋保留現有指令。invoice-pass 呼叫 `/api/generate-pass`（self）、maplibre 需 `blob:` worker 與 openfreemap tiles、GSI 需 frame/connect——都要涵蓋。
**驗證方式**：寫一個臨時 node 腳本 serve `dist` 並附上與 vercel.json 相同的 CSP header，Playwright 走首頁 / travel / 報告書（捲到地圖）/ invoice-pass / meridiel，console 不得出現 CSP violation。

**驗收**：上述五頁在帶 CSP 的本地 serve 下 console 零 `Content-Security-Policy` 違規；vercel.json 兩條 route 的 CSP 皆含 `script-src`。

## 9.（P2 衛生）無 linter、`astro check` 殘留 10 hints

repo 無 ESLint / Prettier、無 `lint` script；`astro check` 有 10 個 hints（含 `public/meridiel/app/store.js` 的可轉 async 警告與 src 內未使用符號）。

**修法**：清掉 10 個 hints（未使用 import/變數刪除；meridiel store.js 依提示轉寫或加註忽略）；加 ESLint 9（flat config）＋ `eslint-plugin-astro` ＋ typescript-eslint，規則從 recommended 起步、以現況可全綠為準；`package.json` 加 `lint` script、CI 加 lint step。

**驗收**：`astro check` 0 errors 0 warnings 0 hints；`npm run lint` 0 errors；CI 綠。

## 10.（P2 可靠性）核心資料層 cms.ts 零測試

`src/lib/cms.ts` 承載全站資料取得（fail-fast、退避重試、Promise memoization、截斷警告、localizedPost fallback），行為分支多但 `test/` 完全沒碰它——重試邏輯或 fail-fast 邊界改壞不會被 CI 抓到。

**修法**：新增 `test/cms.test.ts`，mock `fetch`（`vi.stubGlobal`）測：5xx 會重試至成功、404 不重試直接失敗、fail-fast 模式下失敗會 throw（含 collection 名）、寬鬆模式回 `[]`/`null` 並 warn、同 URL 併發只打一次 HTTP、`totalDocs > docs.length` 觸發截斷 warn、`localizedPost` 的 en/ja fallback。若 `import.meta.env.PROD` 難以在測試中切換，允許把 env 讀取抽成可注入的小函式（不改變 build 行為）。重試的 sleep 用 fake timers，測試不得實際等待。

**驗收**：`vitest run` 新增 ≥ 12 個 assertion 全綠且總時長不因 sleep 拉長；故意把 `isRetryableStatus` 改壞會紅。

---

## 中期項目（本輪不做，留檔追蹤）

- 全站轉 `astro:assets` `<Image>`（需真實 CMS 資料驗證 build，item 5 已鋪 remotePatterns）
- Meridiel 收編進 Astro/Vite 建置（本輪僅 vendor + 預編譯，長期應成為正式子專案）
- `src/data/program-tiers.ts`（435 行雙語內容）遷入 Payload CMS（跨 repo）
- `pics.avs.io` 航空 logo fallback 的去留
