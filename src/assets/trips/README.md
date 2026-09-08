# 旅行報告書照片

照片放這裡，**不要放 `public/`**。

`public/` 的檔案會原封不動輸出，Astro 不會處理；放在這裡才會經過 `astro:assets`
產生 WebP 與多尺寸 `srcset`，並自動從原圖讀出寬高（避免版面跳動 / CLS）。

## 放法

依 trip slug 分資料夾：

```
src/assets/trips/
└── japan-jr-pass-2026/          ← 對應 TripReport.slug
    ├── day1-enoshima.jpg
    ├── day1-hase-daibutsu.jpg
    └── day4-itsukushima.jpg
```

然後在 `src/data/trips/<slug>.ts` 裡把路徑填進 `src`——**相對於本資料夾**，
不要寫 `/src/assets/...` 或 `./`：

```ts
photos: [
  {
    id: 'day1-photo-1',
    caption: '江之島神社與蠟燭燈塔',
    src: 'japan-jr-pass-2026/day1-enoshima.jpg',
    alt: '江之島神社參道盡頭的蠟燭型展望燈塔',
  },
]
```

`src` 一填，佔位框（📷）就會自動換成真實照片並接上燈箱，不用改任何程式碼。

## 兩種放置位置

`PhotoSlot.photos` 可以掛在兩個層級，出現的地方不同：

| 位置 | 出現在哪 |
|---|---|
| `TripDay.photos` | 該日的影像帶（詳細行程區） |
| `TripStop.photos` | 該景點條目，**以及**沈浸式版型的 HUD 照片框 |

## 檔案本身

- 格式：`.jpg` / `.jpeg` / `.png` / `.webp` / `.avif`
- **不用**自己先壓縮或縮圖，直接放原圖：建置時會產生 400 / 600 / 900 / 1200 四種寬度
- 但也別放沒必要的巨檔（例如 8000px 的原始 RAW 輸出），建置會變慢；長邊 2400px 綽綽有餘

## alt 文字

`alt` 描述「照片裡有什麼」，`caption` 是版面上顯示的說明文字，兩者用途不同。
`alt` 沒填會退回用 `caption`。

## 外部網址

`src` 也接受完整的 `https://` 網址或站內絕對路徑（`/foo.jpg`），但這兩種
**不會被最佳化**，會退回原生 `<img>`。遠端圖刻意不走 `<Image>`：`astro:assets`
抓不到遠端圖時會讓整個 build 失敗，而本站資料層的設計是「CMS 連不到就回空陣列
繼續 build」，兩者相衝突。

> 檔名打錯會直接讓 build 失敗，並列出目前實際存在的檔案——不會安靜地產生壞掉的圖。
