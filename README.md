# Milifix.org

獨立創作者空間策展站台：多語系（en / zh / ja）、各空間作品集與實驗室頁面。以 [Astro](https://astro.build) 建置，靜態輸出至 `dist/`。

**原始碼：** [github.com/div-sir/Milifix.org](https://github.com/div-sir/Milifix.org)

## 技術概要

- Astro 6、TypeScript
- React 島嶼（[React Bits](https://github.com/DavidHDev/react-bits) 風格元件：SpotlightCard、ShinyText）
- Tailwind CSS 4（Vite 外掛）
- 內容：`src/content/works`、`src/content/blog`（Content Collections）

## 需求

- Node.js **≥ 22.12**（見 `package.json` 的 `engines`）

## 指令

| 指令 | 說明 |
|------|------|
| `npm install` | 安裝依賴 |
| `npm run dev` | 本機開發（預設 `localhost:4321`） |
| `npm run build` | 產出正式站至 `./dist/` |
| `npm run preview` | 本機預覽建置結果 |
| `npm run check` | Astro 型別／診斷檢查 |

## 部署

專案為**靜態站**，可部署至 [Vercel](https://vercel.com) 等平台：

- **Build command：** `npm run build`
- **Output directory：** `dist`
- **Node.js：** 22.x

## 授權

若未另行標示，以專案內各檔案為準。
