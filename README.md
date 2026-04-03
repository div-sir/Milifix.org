# Milifix.org

獨立創作者空間策展站台：多語系（en / zh / ja）、各空間作品集與實驗室頁面。以 [Astro](https://astro.build) 建置，靜態輸出至 `dist/`。

**原始碼：** [github.com/div-sir/Milifix.org](https://github.com/div-sir/Milifix.org)

---

## 技術概要（搬站可對照用）

### 核心堆疊

| 類別 | 技術 | 備註 |
|------|------|------|
| 框架 | Astro 6 | 多數為靜態頁；必要處才掛 client script / React 島嶼 |
| 語言 | TypeScript | `tsconfig.json`  extend `astro/tsconfigs/strict` |
| 樣式 | Tailwind CSS 4 | 透過 `@tailwindcss/vite` 掛進 Vite（見 `astro.config.mjs`） |
| 島嶼 | `@astrojs/react` | 少量 React 元件；`babel: () => ({ plugins: [] })` 用來避開 Vite / React 外掛快取與動態 hook 不同步的間歇性錯誤（見 config 內註解） |
| Markdown | `rehype-slug` | 為標題自動產生 id，供目錄與錨點連結 |

### 內容層（Content Collections）

- 定義於 `src/content.config.ts`。
- **作品** `works`：`src/content/works/**/*.md`，含 `space`、`media`（圖／影片／embed）、`cardVariant` / `pageVariant` 等。
- **部落格** `blog`：`src/content/blog/**/*.md`，欄位含 `draft`、`hideToc`、`hideInBlogIndex`。

### 多語系與路由邏輯

- **文案與路徑工具**：`src/i18n/`（例如 `routes.ts` 的 `langPrefix`、`parseLocalizedPath`、`equivalentUrl`）。
- **慣例**：英文不帶前綴；中文 `/zh/…`、日文 `/ja/…`；與「邏輯路徑」對應在 `parseLocalizedPath`。
- **語系切換 UX**：`src/scripts/lang-transition.ts` + `src/styles/lang-transition.css`  
  換語言導頁前寫入 `sessionStorage`，下一頁用短暫全螢幕遮罩銜接，減少白屏感；`site-nav-client.ts` 會呼叫 `navigateWithLangTransition`。

### 部落格：分類與舊網址（可維護規則，非頁面內堆 if）

搬站或新增文章時，請改 **規則模組**，不要直接在 `.astro` 裡疊條件。

| 模組 | 路徑 | 用途 |
|------|------|------|
| 首頁分桶（bucket） | `src/data/blog-bucket-rules.ts` | `resolveBlogBucket(postId)`：依 `zephlog/筆記/…` id 決定「鐵道·票券」「遊記·足跡」等顯示分類 |
| Legacy 轉址 | `src/data/blog-routing-rules.ts` | `resolveLegacyRedirect({ slug, blogPathRedirects, blogPostUrlFromId })`：合併舊路徑、觀光列車錨點、東京必比登別名等 |
| 路徑對照表 | `src/data/zephlogBlogPathRedirects.json` | slug → 新 id 或絕對路徑，由規則層讀取 |

- **頁面入口**：`src/pages/blog/index.astro`（分類列表）、`src/pages/blog/[...slug].astro`（文章 + 轉址）。
- **單元測試**：`src/data/blog-bucket-rules.test.ts`、`src/data/blog-routing-rules.test.ts`；`npm test`（Vitest）。
- **CI**：`.github/workflows/ci.yml` 對 PR / `main` push 執行 `npm ci` + `npm test`。

### 動畫與視覺特效庫（分工建議）

搬第二個站時可依「要滾動連動／要拆字／要 React 內插值」選庫，本專案目前是 **並用、各司其職**：

| 庫 | 主要使用位置 | 典型用途 |
|----|----------------|----------|
| **GSAP** + **ScrollTrigger** | `src/scripts/space-home-client.ts`、`work-slug-client.ts`、`PageTransition.astro` | 批次進場、與滾動區塊綁定的動畫、頁面轉場類需求 |
| **anime.js**（v4） | `init-anime-splittext.ts`、`init-anime-onscroll-reveals.ts`、`space-home-client.ts` | `splitText` + `stagger` 做字元／詞組進場；`onScroll` 做捲動同步動畫（例如 hero 線條） |
| **Motion**（`motion/react`） | `src/components/react-bits/ShinyText.tsx` | React 元件內以 `motion`、`useMotionValue`、`useAnimationFrame` 做連續 shimmer／偏移類效果 |
| **@chenglou/pretext** | `src/scripts/init-pretext-layout.ts` | 依「行數／高度」做排版測量，寫入 CSS 變數（`--pretext-*`），讓預設行距與區塊高度更穩 |

### 全站氛圍與互動小物

| 項目 | 說明 |
|------|------|
| **AmbientBackdrop** | `AmbientBackdrop.astro` + `ambient-backdrop.ts`：背景漸層／游標跟隨氛圍 |
| **自訂游標** | `portfolio-cursor.ts`：Blog / 空間頁等 client 入口會初始化 |
| **作品頁 client** | `work-slug-client.ts`（ immersive 圖層等）、`space-home-client.ts`（首頁卡片、磁力標籤等） |

### 部落格文章頁額外行為

- **側邊浮動目錄**：`init-blog-post-toc.ts`（標題階層、收合；`hideToc` 可關閉）。
- **多語顯示（Google Translate）**：`blog/index.astro` 與 `[...slug].astro` 內 client script 依 `hl` query、`localStorage` 掛載 Translate widget；與 `lang-transition` 搭配；需留意 cookie／`skiptranslate` 相關 CSS。
- **Blog slug URL**：`blogPostUrlFromId` 會對路徑 segment 做 `encodeURIComponent`，以支援中文 id。

---

## 目錄結構速覽（搬站時可從這裡拆套件）

```
src/
  components/       # Astro 版面、PortfolioChrome、SiteNav、React bits
  content/            # works、blog Markdown
  data/               # blog 規則模組、zephlog 轉址 JSON
  i18n/               # 多語文案、路由 helpers
  pages/              # Astro 路由（含 zh/、ja/、blog）
  scripts/            # client 動效、目錄、游標、語言轉場
  styles/             # 全域與區塊 CSS（含 lang-transition）
```

---

## 需求

- Node.js **≥ 22.12**（見 `package.json` 的 `engines`）

---

## 指令

| 指令 | 說明 |
|------|------|
| `npm install` | 安裝依賴 |
| `npm run dev` | 本機開發（預設 `localhost:4321`） |
| `npm run build` | 產出正式站至 `./dist/` |
| `npm run preview` | 本機預覽建置結果 |
| `npm run check` | Astro 型別／診斷檢查 |
| `npm test` | Vitest：blog 規則模組單元測試 |

---

## 部署

專案為**靜態站**，可部署至 [Vercel](https://vercel.com) 等平台：

- **Build command：** `npm run build`
- **Output directory：** `dist`
- **Node.js：** 22.x

---

## 授權

若未另行標示，以專案內各檔案為準。
