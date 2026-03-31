---
title: Record 原始資料
description: 原始 Record 資料入口，保留查詢導向的欄位與未分類條目。
date: '2026-03-31'
draft: false
---

`Record` 是你的基礎資料池，適合做：

<div class="data-snapshot">
  <div class="data-snapshot__grid">
    <div class="data-kpi">
      <div class="data-kpi__label">資料定位</div>
      <div class="data-kpi__value">Raw</div>
    </div>
    <div class="data-kpi">
      <div class="data-kpi__label">處理階段</div>
      <div class="data-kpi__value">Draft</div>
    </div>
    <div class="data-kpi">
      <div class="data-kpi__label">完成度</div>
      <div class="data-kpi__value">L1</div>
    </div>
  </div>

  <div class="data-bars">
    <div class="data-bars__row">
      <span>欄位對齊</span>
      <div class="data-bars__track"><i style="width: 58%"></i></div>
    </div>
    <div class="data-bars__row">
      <span>清洗進度</span>
      <div class="data-bars__track"><i style="width: 36%"></i></div>
    </div>
    <div class="data-bars__row">
      <span>分類完成</span>
      <div class="data-bars__track"><i style="width: 29%"></i></div>
    </div>
  </div>
</div>

- 未分類資料暫存
- 欄位對齊與清洗
- 交叉查詢入口

## 為什麼保留這一層

很多資料在剛匯入時還不適合直接放作品或文章，`Record` 可以作為中介層：

1. 先統一命名規則
2. 標記缺漏欄位
3. 再同步到旅行/飛行/年表分類

## 後續規劃

- 建立「已分類 / 待整理」狀態標記
- 增加資料品質檢查清單

