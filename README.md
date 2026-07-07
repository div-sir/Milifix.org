# Milifix.org

獨立創作者空間策展站台：多語系（en / zh / ja）、作品集、部落格、App 頁面與台灣信用卡旅遊權益（`/travel`）。以 [Astro](https://astro.build) 建置，靜態輸出至 `dist/`，內容由 [Payload CMS](https://payloadcms.com) 管理。

**前端原始碼：** [github.com/div-sir/Milifix.org](https://github.com/div-sir/Milifix.org)  
**CMS 原始碼：** [github.com/div-sir/milifix-cms](https://github.com/div-sir/milifix-cms)  
**線上後台：** [milifix-cms.onrender.com/admin](https://milifix-cms.onrender.com/admin)

---

## 架構概覽

```
Payload CMS（Render）
  ├── Works collection         作品集
  ├── Posts collection         部落格文章
  ├── Pages collection         頁面文案
  ├── Media collection         媒體庫（UploadThing）
  ├── Users collection         後台帳號管理
  ├── ✈ 旅遊權益
  │   ├── CreditCards          信用卡與權益（benefits 陣列）
  │   ├── Airlines             航空公司（IATA、聯盟）
  │   ├── Lounges              機場貴賓室（航廈、位置）
  │   └── Programs             貴賓室／飯店／聯盟網路（可被卡片關聯）
          ↓ REST API
Astro build（Vercel）
  ├── /                     首頁（Creator spaces）
  ├── /solilium             攝影作品集
  ├── /voidlane             實驗動態作品集
  ├── /lumiveil             Lumiveil iOS App 介紹頁
  ├── /meridiel             Meridiel 飛行足跡互動地球儀（public/ 靜態 App）
  ├── /blog                 部落格列表
  ├── /blog/[slug]          部落格文章頁
  └── /travel               台灣信用卡旅遊權益（卡片／航空／貴賓室／網路／比較表）
```

**內容更新流程：**
後台儲存 → Payload webhook → Vercel rebuild（約 1–2 分鐘）→ 網站更新

---

## 技術堆疊

| 類別 | 技術 | 備註 |
|---|---|---|
| 框架 | Astro 6 | 靜態輸出；React island 少量使用 |
| 語言 | TypeScript | strict 模式 |
| 樣式 | Tailwind CSS 4 + 自訂 CSS | 透過 `@tailwindcss/vite` |
| CMS | Payload CMS 3.x | 部署於 Render，REST API 供 build 時取資料 |
| 資料庫 | Neon PostgreSQL | Payload 使用 |
| 媒體儲存 | UploadThing | 圖片上傳與 CDN |
| 部署 | Vercel（前端）+ Render（CMS） | |
| 動畫 | anime.js v4、GSAP、Motion | 各司其職，見下方說明 |

---

## 內容資料層

### Payload CMS（`src/lib/cms.ts`）

所有頁面的資料都從 Payload REST API 取得：

```ts
import { getWorks, getPosts, getPage } from '../lib/cms'

const works = await getWorks('solilium')   // 依 space 篩選
const posts = await getPosts()              // 只回傳非草稿
const page  = await getPage('home')        // 頁面文案
```

**環境變數：**

| 變數 | 說明 |
|---|---|
| `CMS_URL` | Payload API 網址（本地 `http://localhost:3000`，正式 `https://milifix-cms.onrender.com`） |

### 多語系與路由

- **文案：** `src/i18n/ui.ts`（en / zh / ja 三語系）
- **路徑工具：** `src/i18n/routes.ts`（`langPrefix`、`equivalentUrl` 等）
- **慣例：** 英文不帶前綴；中文 `/zh/…`、日文 `/ja/…`
- **語系切換 UX：** `lang-transition.ts` 全螢幕遮罩銜接，減少白屏感

### 部落格分類

文章 bucket 分類由 Payload `Posts` collection 的 `bucket` 欄位管理（後台選擇）。

---

## 頁面說明

| 路由 | 說明 |
|---|---|
| `/` | 首頁，列出所有 Creator spaces（SOLILIUM、VOID LANE、BLOG、LUMIVEIL） |
| `/solilium` | 攝影作品集首頁 |
| `/solilium/[slug]` | 作品內頁，含 Lexical 富文字渲染 |
| `/voidlane` | 實驗動態作品集首頁 |
| `/voidlane/[slug]` | 作品內頁 |
| `/blog` | 部落格列表，依 bucket 分三大類 |
| `/blog/[slug]` | 文章頁，含側邊浮動目錄 |
| `/lumiveil` | Lumiveil iOS App 介紹頁 |
| `/meridiel` | Meridiel 飛行足跡互動地球儀（`public/meridiel/` 靜態 App）|
| `/linktree` | 連結樹 |
| `/invoice-pass` | Apple Wallet 發票卡片產生器 |
| `/travel` | 台灣信用卡旅遊權益首頁（卡片／航空／貴賓室精選） |
| `/travel/cards` · `/travel/cards/[slug]` | 信用卡列表與內頁（依權益分組、可點擊關聯標籤） |
| `/travel/airlines` · `/travel/airlines/[slug]` | 航空公司列表與內頁（尾翼 logo、所屬聯盟、關聯卡片） |
| `/travel/lounges` · `/travel/lounges/[slug]` | 貴賓室列表與內頁（航廈位置、可進入的卡片） |
| `/travel/programs` · `/travel/programs/[slug]` | 貴賓室／飯店／航空聯盟網路內頁（彙整各分點與關聯卡片） |
| `/travel/matrix` | 信用卡 × 航空／貴賓室權益比較表 |

> `/travel` 系列為 en / zh 雙語（不含 ja）。

---

## 元件與腳本

### 動畫分工

| 庫 | 主要位置 | 用途 |
|---|---|---|
| **GSAP** | `space-home-client.ts`、`work-slug-client.ts`、`PageTransition.astro` | 批次進場、ScrollTrigger、頁面轉場 |
| **anime.js v4** | `init-anime-splittext.ts`、`init-anime-onscroll-reveals.ts` | 字元／詞組 stagger 進場、捲動同步 |
| **Motion** | `ShinyText.tsx`、`SpotlightCard.tsx` | React 元件內連續動效 |

### 全站氛圍

| 項目 | 說明 |
|---|---|
| **AmbientBackdrop** | 背景漸層 + 游標跟隨氛圍 |
| **自訂游標** | `portfolio-cursor.ts`，桌面版啟用 |
| **LexicalContent** | `src/components/LexicalContent.astro`，渲染 Payload Lexical JSON |

---

## 旅遊權益（`/travel`）

結合台灣信用卡權益的策展頁面，著重航空哩程與機場貴賓室。所有資料皆為 Payload 結構化內容，可互相 tag 與關聯。

**資料模型（CMS `✈ 旅遊權益` 群組）：**

| Collection | 重點欄位 | 關聯 |
|---|---|---|
| `CreditCards` | bank、annualFee、cardNetwork、`benefits[]`（benefitType、條件、幾元/哩） | benefit 可關聯 airline／lounge／program |
| `Airlines` | IATA code、alliance | 反向被卡片權益關聯 |
| `Lounges` | airportCode、航廈、位置 | 反向被卡片權益關聯 |
| `Programs` | programType（lounge-network／hotel-program／airline-alliance） | 貴賓室／飯店／聯盟網路，被卡片以 hasMany 關聯 |

**前端組成：**

- 資料層：[`src/lib/cms.ts`](src/lib/cms.ts) 的 `getCreditCards` / `getAirlines` / `getLounges` / `getPrograms` / `getCardsByAirline` / `getCardsByLounge`（CMS 無法連線時回傳空陣列，不中斷 build）。
- 頁面元件：[`src/components/pages/`](src/components/pages/) 下的 `TravelIndexPage`、`CardListPage`、`CardSlugPage`、`AirlineSlugPage`、`LoungeSlugPage`、`ProgramSlugPage`、`TravelMatrixPage` 等。
- 卡片元件：[`src/components/travel/`](src/components/travel/)（`CreditCardCard`、`AirlineCard`、`LoungeCard`、`TravelSubnav`）。
- 樣式：[`src/styles/travel.css`](src/styles/travel.css)，配色沿用全站暖金主色（`--accent`），貴賓室／航空聯盟標籤為隨深淺色主題切換的語意色。
- 航空 logo：優先用 CMS 上傳圖；未上傳則回退 Aviasales 免費 API（`pics.avs.io/{w}/{h}/{IATA}.png`）。

---

## Apple Wallet 發票卡片（`/invoice-pass`）

`/invoice-pass` 頁面提供前端表單，讓使用者產生並下載 `.pkpass` 檔案，由 `api/generate-pass.js`（Vercel serverless function）使用 [passkit-generator](https://github.com/alexandercerutti/passkit-generator) 簽署產出。

**靜態資源：** `pass-assets/`（icon、logo、背景圖，見其內 README；此目錄已納入 git 版控）

**環境變數（簽署憑證，僅伺服器端）：**

| 變數 | 說明 |
|---|---|
| `PASS_CERT_BASE64` | Pass 簽署憑證（base64） |
| `PASS_KEY_BASE64` | 簽署私鑰（base64） |
| `APPLE_WWDR_BASE64` | Apple WWDR 中繼憑證（base64） |
| `APPLE_TEAM_ID` | Apple Team ID（選填，預設見 `api/generate-pass.js`） |

---

## 目錄結構

```
src/
├── components/         Astro 版面元件（SiteNav、PortfolioChrome、LexicalContent…）
│   ├── pages/          頁面級複合元件（SpaceIndexPage、WorkSlugPage、CardSlugPage…）
│   ├── travel/         /travel 卡片元件（CreditCardCard、AirlineCard、LoungeCard…）
│   └── react-bits/     React island（ShinyText、SpotlightCard）
├── data/               空間定義、作品型別輔助函式
├── i18n/               多語文案、路由 helpers
├── lib/
│   └── cms.ts          Payload REST API 資料層
├── pages/              Astro 路由（含 zh/、ja/、blog/、lumiveil、invoice-pass、travel/）
├── scripts/            client 動效、目錄、游標、語言轉場
└── styles/             全域與區塊 CSS

api/
└── generate-pass.js    Apple Wallet pkpass 產生（Vercel serverless function）

pass-assets/            Wallet pass 靜態圖片資源（已納入 git 版控）
```

---

## 本地開發

### 需求

- Node.js **≥ 22.12**
- Payload CMS 在本地或 Render 上運行

### 環境變數

複製並填入：

```bash
cp .env.example .env
```

```env
CMS_URL=http://localhost:3000
```

### 指令

| 指令 | 說明 |
|---|---|
| `npm install` | 安裝依賴 |
| `npm run dev` | 本機開發（`localhost:4321`） |
| `npm run build` | 產出靜態站至 `./dist/` |
| `npm run preview` | 預覽建置結果 |
| `npm run check` | Astro 型別診斷 |
| `npm test` | Vitest 單元測試 |

---

## 部署

### 前端（Vercel）

| 設定 | 值 |
|---|---|
| Build command | `npm run build` |
| Output directory | `dist` |
| Node.js | 22.x |
| 環境變數 | `CMS_URL=https://milifix-cms.onrender.com` |

### CMS（Render）

見 [milifix-cms README](https://github.com/div-sir/milifix-cms)。

---

## 授權

若未另行標示，以專案內各檔案為準。
