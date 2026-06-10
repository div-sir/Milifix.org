# pass-assets

這個目錄存放 Apple Wallet Pass 所需的靜態圖片資源，由 `/api/generate-pass.js` 讀取。

**必要檔案清單：**

| 檔案 | 尺寸 | 用途 |
|------|------|------|
| `icon.png` | 29×29 | Pass icon（1x）|
| `icon@2x.png` | 58×58 | Pass icon（2x）|
| `logo.png` | 160×50 | 錢包卡片左上角 logo（1x）|
| `logo@2x.png` | 320×100 | 錢包卡片左上角 logo（2x）|
| `bg-aurora.png` | 375×123 | 背景選項：極光（1x）|
| `bg-aurora@2x.png` | 750×246 | 背景選項：極光（2x）|
| `bg-midnight.png` | 375×123 | 背景選項：深夜（1x）|
| `bg-midnight@2x.png` | 750×246 | 背景選項：深夜（2x）|
| `bg-sakura.png` | 375×123 | 背景選項：櫻花（1x）|
| `bg-sakura@2x.png` | 750×246 | 背景選項：櫻花（2x）|
| `bg-ocean.png` | 375×123 | 背景選項：海洋（1x）|
| `bg-ocean@2x.png` | 750×246 | 背景選項：海洋（2x）|

**注意：** 此目錄不應提交到 git（已加入 .gitignore）。
部署到 Vercel 時，透過 Build Output 或直接隨 repo 一起上傳。
