# Meridiel 開發進度與未完成任務

最後更新：2026-07-17

本文件是 `milifix.com/meridiel/` 的唯一後續工作清單。完成項目保留簡短紀錄；未完成項目依風險排序，只有符合驗收條件才可勾選。

## 已完成

- [x] 路由與本機資料持久化修復（PR #62）
- [x] Local-first 訪客模式與 Google Drive 選用同步（PR #63）
- [x] 桌面、手機版面與視覺整理（PR #64）
- [x] 啟動效能與載入狀態改善（PR #65）
- [x] UI bundle、模組邊界與全域變數整理（PR #66–#67）
- [x] 3D globe、OpenFlights、Google Identity Services 按需載入（PR #68–#70）
- [x] 國界、旗幟、OpenFlights 與字型改為同源固定資產（PR #71–#74）
- [x] 收緊 Meridiel CSP（PR #75）
- [x] 大型固定資產加入一年 immutable HTTP cache（PR #76）
- [x] 移除 OpenFlights 解析結果的重複 localStorage 快取，並清除舊 cache key（PR #77）

## P0：功能或資料可靠性

### 1. 完成或移除假的 CSV 匯入介面

目前「Import CSV」只有外觀，沒有檔案選擇、拖放、解析、預覽或寫入功能，屬於會欺騙使用者的死入口。

- [ ] 支援點擊選檔與 drag-and-drop
- [ ] 驗證欄位、日期與 IATA 機場代碼
- [ ] 匯入前顯示成功、警告與拒絕筆數
- [ ] 去重並為每筆資料建立穩定 ID
- [ ] 匯入失敗不得留下半套資料
- [ ] 若近期不實作，先完全移除該分頁與宣稱

驗收：桌面與手機 E2E 各涵蓋成功匯入、部分錯誤、整檔無效三種情境。

### 2. 修正 Share link 的錯誤承諾

目前 Copy link 只附加 `#shared`，沒有序列化或上傳 atlas，卻顯示「reopens this exact atlas」。其他人開啟後不會看到分享者資料。

- [ ] 決定真正的唯讀分享模型：URL 壓縮快照、後端 snapshot，或取消此功能
- [ ] 分享內容不得包含 Google access token、email、照片 EXIF 等私密資料
- [ ] 設計 snapshot 版本與過期／刪除策略
- [ ] 在完成前把按鈕與誤導文案移除

驗收：無痕瀏覽器開啟分享 URL，可還原同一份唯讀 atlas；或產品介面已不再宣稱能分享資料。

### 3. 防止多裝置 Google Drive 同步互相覆蓋

目前每次修改會覆寫同一個 JSON 檔；只在登入載入時合併一次。兩台裝置同時編輯時，較晚儲存者可能覆蓋另一台尚未拉取的修改。

- [ ] 儲存前取得 Drive revision／modifiedTime 並做 compare-and-merge
- [ ] 409／412 衝突時重新載入、依 `updatedAt` 與 tombstone 合併後重試
- [ ] 限制重試次數並向使用者顯示衝突狀態
- [ ] 測試新增、編輯、刪除在兩裝置交錯寫入的結果

驗收：自動化測試模擬兩個 client 交錯更新，任何一方的較新修改與刪除都不會消失。

### 4. 拆分照片與航班 JSON 儲存

照片目前以 base64 塞入航班陣列，再整包寫進 localStorage 與單一 Drive JSON；少量照片就可能超過瀏覽器 quota，並讓每次小修改重傳全部圖片。

- [ ] 本機照片改存 IndexedDB／OPFS，航班記錄只留 photo ID
- [ ] 雲端照片使用獨立 Drive appData 檔或可控物件儲存
- [ ] 加入壓縮尺寸、格式、單張與總量上限
- [ ] 提供既有 base64 記錄的可回復 migration

驗收：加入至少 50 張照片後，編輯一筆純文字航班不需重新序列化／上傳全部圖片；quota 不足時資料不遺失。

### 5. 修正日期欄位重複 wrapper

`public/meridiel/app/modals.jsx` 的 date field 目前有重複的 `.field-date` 開頭標籤，可能擴大點擊區與破壞表單 DOM 結構。

- [ ] 移除重複 wrapper
- [ ] 點擊日期欄以外的 Airline／Aircraft 欄位不得開啟 date picker
- [ ] 補一個回歸測試

## P1：產品品質

### 6. 自動產生內容雜湊資產名稱

目前 CSS、bundle 與資料檔靠人工更新 `?v=20260716m`。在一年 immutable cache 下，只要漏改一次版本，就會讓回訪者長期執行新舊混合檔案。

- [ ] build 產生 hash filename 或 asset manifest
- [ ] 自動重寫 `index.html` 與 lazy-loader URL
- [ ] CI 驗證 source 變更時產物 URL 必須同步變更

驗收：修改任何 app source 後，輸出檔名與 HTML 引用自動更新，不需要手動改日期字串。

### 7. Modal 鍵盤與螢幕閱讀器完整化

- [ ] 加上 `role="dialog"`、`aria-modal` 與標題關聯
- [ ] 開啟時把焦點移入 modal，Tab 不得逃到背景
- [ ] 關閉後把焦點還給觸發按鈕
- [ ] 鎖定背景捲動，並以 `inert` 隔離背景
- [ ] Escape 關閉與錯誤提示需由螢幕閱讀器讀出

驗收：鍵盤可完整操作 Add/Edit/Share modal，axe 無 serious／critical dialog 違規。

### 8. 真正的資料備份與還原

- [ ] 匯出版本化 JSON 與標準 CSV
- [ ] JSON 還原前顯示差異與新增／更新／刪除數量
- [ ] schema migration 可讀取舊版本
- [ ] 提供「只下載、不上雲」的本機備份路徑

驗收：全新瀏覽器可由匯出檔完整還原航班、刪除 tombstone 與照片引用。

### 9. 國際化

Meridiel UI 目前固定英文，與 Milifix 主站的繁中／英文／日文結構不一致。

- [ ] 將 UI 文案抽成字典，不在 JSX 內散落字串
- [ ] 支援 `zh-Hant`、`en`、`ja`
- [ ] 日期、里程、距離與數字使用 locale formatter
- [ ] SEO title、description 與 share card 同步語系

驗收：三語核心流程無英文 fallback；缺 key 時 CI 失敗。

### 10. 雲端同步整合測試

- [ ] mock Google Identity Services 的成功、取消、過期與重連
- [ ] mock Drive list/load/create/update、401 retry 與 API error
- [ ] 驗證 local-only 使用者不會載入 GIS
- [ ] 驗證同步失敗時仍保留本機修改

驗收：CI 不需真實 Google 帳號即可覆蓋登入與同步狀態機。

## P2：架構與長期維護

### 11. 把 Meridiel 收進正式 TypeScript／React 建置

目前已從多個全域腳本收斂成單一 IIFE，但仍依賴 UMD React globals，source 也缺完整型別檢查。

- [ ] 建立獨立 entry 與 TypeScript types
- [ ] 移除 `window.React`／`window.ReactDOM` 依賴
- [ ] code-split globe、export renderer 與 auth
- [ ] 保留 `/meridiel/` 靜態部署與 CSP 相容性

驗收：所有 Meridiel source 進入 `tsc`／ESLint；初始 JS 不超過現有 300 KB budget。

### 12. 將大型 OpenFlights 解析移至 Web Worker

目前已用 idle chunk 避免長任務；低階手機仍需在主執行緒解析兩份 CSV 與建立搜尋索引。

- [ ] Worker 解析並回傳最小化結構
- [ ] 支援取消與超時
- [ ] 保留 curated fallback
- [ ] 用效能測試記錄主執行緒 blocking time

驗收：參考資料載入期間主執行緒沒有超過 50 ms 的 long task。

### 13. 錯誤觀測與隱私安全的診斷

- [ ] 定義可觀測事件：runtime load、reference data、PNG export、Drive sync
- [ ] 不記錄 email、token、完整航班或照片
- [ ] 提供匿名、可關閉的錯誤回報
- [ ] 建立正式環境錯誤率與同步失敗率基準

## 每個 PR 的共同完成條件

- [ ] `npm test`
- [ ] `npm run lint`
- [ ] `astro check` 為 0 errors / warnings / hints
- [ ] `npm run build`
- [ ] `npm run test:budget`
- [ ] Desktop Chromium 與 Mobile Chromium E2E
- [ ] Vercel Preview 為 `READY`，且實際頁面無 console error／CSP violation
- [ ] 若改到 immutable 資產，URL 或內容 hash 已更新
