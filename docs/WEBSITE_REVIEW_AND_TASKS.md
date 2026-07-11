# Milifix.org 全站審查報告與 Opus / Sonnet 分工

> **⚠️ 本文件已過時（2026-07-05 版）**：所列 P0/P1 多已修復。最新審查見 [`WEBSITE_AUDIT_2026-07-10.md`](./WEBSITE_AUDIT_2026-07-10.md)。本檔僅留作歷史紀錄。

審查日期：2026-07-05。範圍：repo 內全部 147 個檔案（pages、components、scripts、styles、i18n、data、api、CI、部署設定），並實跑 `astro check`（0 errors / 9 hints）與 `astro build` 驗證。

每條問題附「檔案:行號」與可判定的驗收條件。分級：

- **P0** — 正確性 / 安全 / 可靠性，會在正式環境造成實際損害
- **P1** — 專業度（SEO、效能、CI、安全 headers），影響網站對外品質
- **P2** — 可維護性 / a11y / 程式衛生

---

## 一、問題清單

### A. 可靠性與建置（P0）

**A1. CMS 停機時 build「成功」產出空站** — `src/lib/cms.ts:23-26, 40-43`
`fetchCollection` / `fetchDoc` 把所有失敗吞掉回傳 `[]` / `null`。實測：CMS 不可達時 `astro build` 仍 exit 0，只產出 19 個空殼頁（所有 works / posts / cards / lounges 頁面全部消失、首頁計數歸零）。正式流程是「Payload webhook → Vercel rebuild」，若 Render 停機時觸發 rebuild，**會直接部署空站覆蓋現有內容**。
修法：build 時（`import.meta.env.PROD`）改為 fail-fast throw；僅本地 dev 允許空資料。或以環境變數 `CMS_ALLOW_EMPTY=1` 顯式豁免。

**A2. `astro.config.mjs` 缺 `site`** — `astro.config.mjs:10`
沒有 `site`，`Astro.url.href` 在 build 時是 `localhost` 基底。直接後果：
- `CardSlugPage.astro:138` 的 `<link rel="canonical" href={Astro.url.href}>` 在正式站輸出錯誤網址
- `CardSlugPage.astro:114` JSON-LD 的 `url` 同樣錯誤
- 無法使用 `@astrojs/sitemap`
修法：`site: 'https://milifix.org'`，並全站改用 `new URL(Astro.url.pathname, Astro.site)`。

**A3. 無 404 頁** — `src/pages/` 下沒有 `404.astro`。使用者連到失效網址會看到 Vercel 原生錯誤頁，與全站視覺完全脫節。

**A4. CI 不跑 build、測試為零** — `.github/workflows/ci.yml:25-29`、`vitest.config.ts`
CI 只跑 `astro check` + `vitest`（`passWithNoTests: true`，實際上**一個測試都沒有**）。`astro build` 從未在 CI 驗證過，build 壞掉只會在 Vercel 部署時發現。

### B. 後端 API 安全（P0）

`api/generate-pass.js` 是用 **Apple 憑證簽名**的公開端點，目前防護不足：

**B1. 無 rate limiting、無 origin 檢查** — 整個 handler（`api/generate-pass.js:45`）
任何人可無限次 POST，用你的 Apple Pass 憑證量產簽名 pass（每次最長 30 秒 serverless 執行）。濫用面：Vercel 帳單、Apple 憑證信譽。
修法：加 rate limit（Vercel WAF 規則或 `@upstash/ratelimit`）＋檢查 `Origin`/`Referer` 屬於自家網域。

**B2. 使用者可控內容進入簽名 pass** — `api/generate-pass.js:99-102, 184-208`
`organizationName`（取自 `secFields[0].value`）、`logoText`、icon / background / thumbnail 圖片全部由使用者提供，最後由你的憑證簽名——可被用來製作掛你名義的釣魚 pass。
修法：`organizationName` 固定為 `Milifix`（不從使用者輸入衍生）；圖片驗 PNG magic bytes（`89 50 4E 47`）與最大解析度，不只驗 base64 格式（`:30-35`）。

**B3. 錯誤細節外洩** — `api/generate-pass.js:218` `detail: err?.message` 直接回傳給 client。改為只記 log、回泛用訊息。

**B4. serialNumber 用 `Date.now()`** — `api/generate-pass.js:112` 併發時會碰撞。改 `crypto.randomUUID()`。

**B5. 缺安全 headers** — `vercel.json` 無 `headers` 段。全站缺 `Strict-Transport-Security`、`X-Content-Type-Options`、`Referrer-Policy`、`Permissions-Policy`、（可行的話）CSP。

### C. 架構：13 份重複的 `<head>`（P1，牽動所有前端工作）

**C1. 沒有共用 Layout** — 13 個檔案各自寫完整 `<!DOCTYPE html>` 與 `<head>`（`src/components/pages/` 9 個 + `src/pages/blog/` 2 個 + `linktree.astro` + `InvoicePassPage`），同一段 theme 初始化 inline script 複製了 **12 份**（grep `localStorage.getItem('portfolio-theme')` 命中 12 檔）。favicon、theme-color、viewport 各頁有無不一。任何 head 層級的修改（加 OG tag、改 favicon）都要改 13 處。
修法：建立 `BaseLayout.astro`（slots：head-extra、body），統一 meta / favicon / theme script / fonts，13 頁全部遷移。

**C2. `src/layouts/Layout.astro` 是死程式** — 內容還是 Astro 範本的「Astro Basics」，無任何頁面引用。`src/components/Welcome.astro`、`src/assets/astro.svg`、`background.svg` 同為範本殘留。應刪除。

### D. SEO（P1）

**D1. 全站零 Open Graph / Twitter Card**。分享到任何社群平台都沒有預覽卡。需要：`og:title/description/image/url/type/locale` + `twitter:card`，及至少一張預設 og image（`public/` 目前只有 favicon）。

**D2. meta description 缺漏不齊**：`PlatformPage.astro`（首頁！）、`SpaceIndexPage.astro` 完全沒有 description；有的頁面用空字串 fallback（`AirlineSlugPage.astro:38`、`LoungeSlugPage.astro:39`、`CardSlugPage.astro:137` 的 `?? ''`——空 description 不如不輸出）。

**D3. canonical 只有 CardSlugPage 有、hreflang 只有 LumiveilPage 有**（`LumiveilPage.astro:176-178`）。en/zh/ja 三語站沒有 hreflang 互指，搜尋引擎會把三語版本當重複內容。

**D4. 無 sitemap.xml、無 robots.txt**。`public/` 只有 favicon 兩枚。

**D5. blog 頁 `<html lang>` 永遠是 zh-Hant** — `blog/index.astro:62-63`、`blog/[...slug].astro:22-23` 用 `Astro.url.searchParams.get('hl')` 判斷語言，但靜態輸出時 searchParams **恆為空**，這段是死碼且誤導（列表頁分類標籤也只有中文，見 F2）。

**D6. blog 文章頁缺結構化資料**：無發佈日期顯示、無 `article:published_time`、無 JSON-LD Article。`CardSlugPage` 的 JSON-LD（109-124）是好範例，應推廣到 blog / works / lounges。

### E. 效能（P1）

**E1. PlatformPage 字型重複載入兩套** — `PlatformPage.astro:98-100` 載 Google Fonts CDN，而 `theme.css:2-6` 已用 `@fontsource` self-host 同樣的 Space Grotesk / Space Mono。首頁多付一個 render-blocking 第三方請求，其他頁又完全不用 CDN——擇一（建議留 @fontsource，刪 CDN）。

**E2. 全站無圖片最佳化**：grep 無任何 `astro:assets` / `<Image>` 使用，12 處裸 `<img>`。`astro.config.mjs:24-26` 的 `image.domains` 設了等於沒設。作品封面 hero 圖 `WorkSlugPage.astro:125` 直接載 UploadThing 原圖（1600×900 eager）。無 srcset、無 AVIF/WebP。
註：外部 CMS 圖片要用 Astro Image 需 remotePatterns 含 UploadThing 網域。

**E3. blog 的 Google Translate widget** — `src/scripts/blog-translate.ts:88-91` 動態注入 `translate.google.com/translate_a/element.js`。該 widget Google 已停止維護、翻譯品質不可控、注入第三方 cookie（`googtrans`）、與自訂 DOM 動效（splittext）互相干擾的風險高。屬產品決策：維持、換成 build-time 翻譯、或 en/ja 明示「機器翻譯」即可。

**E4. cms.ts 無快取、無分頁**：`limit` 預設 100（`cms.ts:13`）超過即無聲截斷；每個 travel 詳情頁 build 時各自重打 `getCreditCards()`（`CardSlugPage.astro:32` × 每卡 × en/zh），對 Render free tier 是無謂負載。加 module-level memoization（build 是單一 process）即可。

### F. i18n（P2）

**F1. UI 字串散落在元件內**而非 `ui.ts`：`TravelIndexPage.astro:41-44, 148, 169-180`（`lang === 'zh' ? … : …` 三元式十餘處）、`PlatformPage.astro:39-81`（taglines）、`blog/[...slug].astro:24-26`。ja 落在 en fallback 的地方無從盤點。

**F2. blog 列表分類標籤寫死中文** — `blog/index.astro:20-24`（「旅行·生活·航空」等），en/ja 讀者也只看到中文。

**F3. bucket → 分類對映用中文字串前綴硬編碼** — `blog/index.astro:32-44`。CMS 端改個 bucket 名稱，文章就無聲掉進「其他」。應改為 CMS 提供分類 key 或至少集中成資料表。

**F4. `SiteNav.astro:98`：`mailto:your@email.com`** — 範本佔位 email 掛在正式站導覽的「Contact」上。**（一行修正，但需要站主提供正確 email，或先移除該連結。）**

### G. 內容資料層（P2）

**G1. `src/data/program-tiers.ts`（435 行）內容資料硬編碼在前端 repo**：飯店/聯盟會籍等級與禮遇，zh/en 雙份。內容更新要改 code + 重新部署，與「內容由 Payload 管理」的架構相violated。中期應搬進 CMS（Programs collection 加 tiers array field）。

**G2. 用關鍵字猜關聯** — `CardSlugPage.astro:49-77` `autoDetectPrograms` 以字串比對（「萬豪金卡」「Hilton」…）在前端猜 benefit 屬於哪個 program。註解自承是 CMS 關聯未填的 fallback。應在 CMS 補齊關聯後移除，否則誤判無從察覺。

**G3. LexicalContent 節點覆蓋不全** — `LexicalContent.astro:44-64` 只處理 paragraph/heading/list/quote/hr/text。**link、image/upload、table 節點會被靜默展平或丟棄**（default case 只渲染 children）——blog 文章裡的超連結會變成純文字、圖片直接消失。至少要支援 link 與 upload/image。

**G4. 航空 logo 熱連結第三方** — `TravelIndexPage.astro:88` fallback 到 `pics.avs.io`（Aviasales）。免費服務無 SLA，掛了全站航空區破圖。可接受，但建議 build-time 下載快取或在 CMS 補齊 logo。

### H. a11y 與程式衛生（P2）

**H1. 自訂游標以視窗寬度而非指標類型判斷** — `portfolio-cursor.ts:7` 用 `max-width: 768px`；`PlatformPage.astro:130` `body { cursor: none }` 是無條件的。>768px 的觸控裝置（iPad 橫向）會 cursor:none 又沒有滑鼠事件；JS 失敗時所有人都沒有游標。應改 `(pointer: fine)` gate，且 `cursor:none` 只在 JS 啟動後由 class 加上。

**H2. `astro check` 9 個 hints**：未使用 import（`ProgramSlugPage.astro:3` CmsAirline、`LoungeCard.astro:5` programSlugPath）、未使用變數（`SpaceIndexPage.astro:27`、`WorkSlugPage.astro:41`）、deprecated `document.execCommand('copy')`（`CompareModal.astro:490`，應改 `navigator.clipboard.writeText` + fallback）。

**H3. 路徑 helper 重複造輪** — `TravelIndexPage.astro:69` 自寫 `cardPath`，`routes.ts:71` 已有 `cardSlugPath`。

**H4. README 與現實不符** — `README.md:161` 說 `pass-assets/ 不進 git`，但該目錄實際被 git 追蹤（`pass-assets/logo.png` 等 5 檔在 repo 內）。二擇一修正。

**H5. `package.json` name 仍是 `my-portfolio`**、version 0.0.1；無 `lint` script（沒有 ESLint/Prettier 設定，全 repo 無 linter）。

**H6. 作品卡片圖 `alt=""`** — `SpaceIndexPage.astro:145`、`WorkSlugPage.astro:125`。overlay 有標題文字所以可接受，但 CMS 的 `cover.alt` 欄位存在卻從未使用，應接上。

---

## 二、分工：Opus 與 Sonnet

原則（依 03_JUDGMENT 的判準）：**需要權衡、架構設計、安全威脅模型的題目給 opus；規格已完全明確、可機械執行的題目給 sonnet**。順序上 O1（BaseLayout）是多數 S 任務的前置，先做。

每個任務的驗收條件都是可判定 pass/fail 的，驗收時逐條核對，不接受「應該沒問題」。

### Opus 任務（判斷與架構）

**O1.（P1，最優先）建立 BaseLayout 並遷移全部 13 頁** — 對應 C1、C2、D 全部
- 設計 `src/layouts/BaseLayout.astro`：props 收 `lang`、`title`、`description`、`canonicalPath`、`ogImage?`、`noindex?`；內建 favicon、viewport、theme-color、theme 初始化 script（單一來源）、hreflang（依 `availableLangsForPath` 自動輸出）、OG/Twitter meta、canonical。
- `astro.config.mjs` 加 `site: 'https://milifix.org'`；加 `@astrojs/sitemap`；`public/robots.txt` 指向 sitemap。
- 逐頁遷移 13 個含 `<head>` 的檔案；刪除舊 `Layout.astro`、`Welcome.astro`、範本 svg。
- 補齊 D2 缺的 description（首頁與 space 頁文案由 ui.ts 提供；空字串 fallback 改為不輸出）。
- 為何是 opus：slot 設計、各頁特例（InvoicePass 固定 dark、linktree noindex、blog 的三段 inline script）如何收斂是架構取捨；遷移錯一頁就是整頁壞。
- 驗收：`git grep "portfolio-theme" src | wc -l` 中 inline 複本只剩 BaseLayout 1 處；13 頁 build 後 view-source 均有 canonical/OG/description；`astro check` 0 error；`astro build` 頁數與遷移前一致。

**O2.（P0）generate-pass API 安全強化** — 對應 B1–B4
- 決策：rate limit 方案選型（Vercel WAF vs `@upstash/ratelimit` vs 簡單 in-memory + `x-vercel-forwarded-for`；需考量無 KV 帳號的前提）。
- 實作：Origin/Referer allowlist；`organizationName` 固定 `Milifix`；PNG magic bytes + 尺寸驗證；`crypto.randomUUID()` serial；錯誤回應去除 `detail`。
- 為何是 opus：威脅模型與方案選型是權衡題；過度嚴格會誤傷正常使用者（LINE 內建瀏覽器不帶 Referer 等）。
- 驗收：非法 Origin POST 回 403；連續 >N 次請求觸發 429；上傳 JPEG 偽裝 base64 被拒；成功路徑仍可下載合法 pkpass（手動實測一次）。

**O3.（P0）CMS 失敗時的建置策略 + 資料層強化** — 對應 A1、E4
- 決策：fail-fast 的邊界（哪些 collection 允許空？linktree 這種無 CMS 依賴頁怎麼辦？）、`CMS_ALLOW_EMPTY` escape hatch 的語意。
- 實作：cms.ts 在 PROD build 遇 fetch 失敗即 throw（附 collection 名與 status）；module-level memoization（同參數同 process 只打一次）；`totalDocs > limit` 時 warn 或自動翻頁。
- 為何是 opus：錯誤策略牽涉部署流程（webhook rebuild、Vercel 保留上一版的行為），判斷錯會把「保護」變成「更容易掛」。
- 驗收：本地模擬 CMS 不可達時 `astro build` 以非零 exit code 失敗且錯誤訊息指名 collection；CMS 正常時 build 產物與現況一致；同一 build 內對同 collection 的 HTTP 請求數 = 1（log 佐證）。

**O4.（P1）blog i18n 與 Google Translate 存廢決策** — 對應 E3、D5、F2、F3
- 先產出 2–3 個帶取捨的選項（維持 widget＋標註機翻／build-time 預翻譯存 CMS／en·ja 僅顯示原文＋提示），**連同成本估計交使用者決定**（此為 03_JUDGMENT §3 的「品味＋產品」題，不得自行拍板）。
- 決策後實作，並一併清除 D5 的 searchParams 死碼、修正 F2/F3（分類 label 進 ui.ts、bucket 對映改集中資料表）。
- 驗收：使用者確認選項後，blog 在三語言下 `<html lang>` 正確、分類標籤隨語言切換；`git grep "searchParams.get('hl')" src/pages` 為 0。

**O5.（P2，中期）program-tiers 與 auto-detect 遷入 CMS** — 對應 G1、G2
- 設計 Payload `Programs` collection 的 tiers schema（需動 milifix-cms repo）、資料搬遷 script、前端讀取改造、`autoDetectPrograms` 退場條件。
- 為何是 opus：跨 repo schema 設計 + 資料遷移，錯了會弄髒 CMS 資料。
- 驗收：任一 program 頁在 CMS 改 tier 文案後 rebuild 生效，前端 `program-tiers.ts` 刪除，`autoDetectPrograms` 刪除且卡片頁 program 標籤仍齊全（與現況逐頁比對）。

### Sonnet 任務（規格明確、機械執行）

**S1.（P0，一行）修 Contact email** — F4
- `SiteNav.astro:98`。先用 AskUserQuestion 向站主要正確 email；拿不到就把該 nav item 移除。
- 驗收：正式 build 的 HTML 內 `git grep "your@email.com"` 為 0。

**S2.（P0）新增 404 頁** — A3
- `src/pages/404.astro`：沿用 BaseLayout（O1 完成後）與全站視覺，提供回首頁／blog／travel 三個連結，en 文案即可（404 無 lang 前綴）。
- 驗收：`astro build` 後 `dist/404.html` 存在且含站內導覽連結。

**S3.（P0）CI 補 build + 基礎單元測試** — A4
- ci.yml 增加 `npm run build` step（設 `CMS_ALLOW_EMPTY=1`，配合 O3 的旗標；O3 未完成前可先跑現行為）。
- 補測試（vitest）：`routes.ts` 全部 helper（含 `parseLocalizedPath` 邊界：`/zh`、`/ja/`、`/`）；`LexicalContent` 的 renderText escape 與 format bitmask；`api/generate-pass.js` 的 `isValidCarrier` / `isValidHexColor` / `decodeImage`（需將驗證函式抽成可 import 的模組）。
- 驗收：CI 綠燈且 `vitest run` 至少 15 個 assertion；故意改壞 `isValidCarrier` 正則測試會紅。

**S4.（P1）vercel.json 安全 headers** — B5
- 加 `headers`：全路徑 `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`、`X-Content-Type-Options: nosniff`、`Referrer-Policy: strict-origin-when-cross-origin`、`Permissions-Policy: camera=(), microphone=(), geolocation=()`、`X-Frame-Options: DENY`。CSP 因 Google Translate / inline script 較複雜，**不在此任務範圍**（留給 O4 之後評估）。
- 驗收：`vercel dev` 或部署後 `curl -sI` 五個 header 全部出現；invoice-pass 頁的 API 呼叫與 Google Fonts（若 O1 已刪則無）不被擋。

**S5.（P1）刪 PlatformPage 的 Google Fonts CDN** — E1
- 刪 `PlatformPage.astro:98-100` 三行（theme.css 的 @fontsource 已覆蓋同字重）。
- 驗收：首頁 build 產物無 `fonts.googleapis.com` 字樣；字型渲染以 dev server 目視比對無變化。

**S6.（P1）圖片屬性一致化與 alt 接線** — E2 部分、H6
- 12 處 `<img>`：確認皆有 width/height/loading；列表卡圖 `loading="lazy" decoding="async"`；`cover.alt` 有值時輸出（`SpaceIndexPage.astro:145`、`WorkSlugPage.astro:125`、`workCoverUrl` 同步回傳 alt）。
- 全面轉 `astro:assets` 涉及 remotePatterns 與版面回歸，**不在此任務**，先把裸 img 做到位。
- 驗收：`git grep '<img' src` 每處都有 width、height、loading 三屬性；有 alt 資料的作品頁輸出非空 alt。

**S7.（P1）i18n 字串歸位** — F1
- 把 `TravelIndexPage.astro`、`PlatformPage.astro:39-81`、`blog/[...slug].astro:24-26` 的三元式字串全部搬進 `src/i18n/ui.ts` 對應命名空間，元件只留 `t.xxx` 引用。**不改任何文案內容**。
- 驗收：`git grep -n "lang === 'zh' ?" src/components src/pages | wc -l` 為 0（routes/space-locale 的結構性判斷除外）；三語言頁面 build 前後 HTML 文字 diff 為空。

**S8.（P2）程式衛生批次** — H2、H3、H4、H5、C2 殘餘
- 清 9 個 astro check hints；`execCommand` 改 `navigator.clipboard.writeText().catch(fallback)`；`TravelIndexPage.astro:69` 改用 `cardSlugPath`；README pass-assets 說法修正（依實際：目錄在 git 內）；package.json name 改 `milifix.org`；刪 `src/assets/astro.svg`、`background.svg`、`Welcome.astro`（若 O1 尚未刪）。
- 驗收：`astro check` 0 errors 0 warnings 0 hints；CompareModal 複製功能在 https 環境手測可用。

**S9.（P2）自訂游標改 pointer gate** — H1
- `portfolio-cursor.ts:7` 改 `matchMedia('(pointer: fine)')`；`cursor: none` 從 CSS 常駐改為 JS 啟動後加 `html.has-custom-cursor` class 控制（CSS 相應調整 13 頁共用的 BaseLayout 樣式，O1 後執行）。
- 驗收：模擬 touch（DevTools device mode）游標正常顯示原生行為；桌面滑鼠下自訂游標如舊；停用 JS 後原生游標可見。

### 依賴順序

```
O2（API 安全，獨立）──────────────┐
O3（build 策略，獨立）→ S3（CI）  ├→ 全部完成後跑一次 /code-review
O1（BaseLayout）→ S2, S5, S6, S9 │
O4（blog i18n，需使用者決策）→（含 D5/F2/F3 清理）
S1, S4, S7, S8（隨時可做，S8 建議在 O1 之後收尾）
O5（中期，跨 repo，最後）
```

### 明確排除（需站主另行決策，不指派）

- CSP header（受 Google Translate 決策影響，O4 之後再評估）
- 全站轉 `astro:assets`（UploadThing remotePatterns + 版面回歸量大，建議獨立 milestone）
- `pics.avs.io` logo fallback 的去留（G4，可接受風險）
