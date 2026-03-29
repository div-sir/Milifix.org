---
title: 用 Markdown 寫部落格
description: 在 src/content/blog/ 新增 .md 檔並設定 frontmatter，建置後就會出現在 /blog。
date: '2026-03-28'
draft: false
---

這是一篇範例文章。之後你只要：

1. 在 `src/content/blog/` 底下新增 `文章檔名.md`
2. 開頭寫好 `title`、`description`、`date`，必要時設 `draft: true` 先隱藏
3. 執行 `npm run build`

內文支援一般 Markdown 語法（標題、列表、連結、程式碼區塊等）。

```ts
const hello = 'Milifix';
```
