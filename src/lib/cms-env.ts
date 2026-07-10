/**
 * cms.ts 依賴的 import.meta.env 讀取集中於此。
 *
 * 原因：cms.ts 的 fail-fast / memoization 分支原本在模組頂層把
 * `import.meta.env.PROD` 之類的值算一次成 const；vitest 下同一支測試檔
 * 難以在不同測試間切換 import.meta.env，因此把讀取包成函式、每次呼叫時
 * 才讀取（build 期間 env 本就不會變化，故 production 行為不受影響），
 * 測試再用 vi.mock 整支抽換即可獨立控制每個分支。
 */

export function getCmsUrl(): string {
  return import.meta.env.CMS_URL ?? 'http://localhost:3000'
}

/** 逃生旗標。CMS_ALLOW_EMPTY 為 '1' / 'true' 時，fetch 失敗維持寬鬆行為。 */
export function isAllowEmpty(): boolean {
  return ['1', 'true'].includes(String(import.meta.env.CMS_ALLOW_EMPTY ?? '').toLowerCase())
}

export function isProd(): boolean {
  return Boolean(import.meta.env.PROD)
}

/** fail-fast 邊界：只有在 build（PROD）且未開逃生旗標時才 throw。 */
export function isFailFast(): boolean {
  return isProd() && !isAllowEmpty()
}
