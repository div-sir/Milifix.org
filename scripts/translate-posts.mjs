// AI 初譯（Path 2：譯文寫進前端 repo，完全不動 CMS）。
// 讀 CMS 唯讀 API 取文章 → 用 Anthropic API 把中文 title/description/content
// 翻成 en/ja → 寫進 src/data/post-translations.json（依 slug）。
//
// 完全不寫入 CMS、不改 schema。壞了頂多前端 fallback 中文。
//
// 環境變數：
//   ANTHROPIC_API_KEY   （必要）Anthropic API key
//   CMS_URL             預設 https://milifix-cms.onrender.com
//   MODEL               預設 claude-sonnet-5
//   CMS_EMAIL/CMS_PASSWORD 或 CMS_TOKEN （選填）帶了才連草稿一起翻；否則只翻已發布
//
// 旗標：--dry-run（不呼叫 API、不寫檔）、--only-missing（跳過已翻過的）、
//       --slug=<slug>、--lang=en|ja
//
// 用法：
//   ANTHROPIC_API_KEY=sk-ant-… node scripts/translate-posts.mjs --dry-run
//   ANTHROPIC_API_KEY=sk-ant-… node scripts/translate-posts.mjs --only-missing
//   （翻完 git add src/data/post-translations.json && git commit）

import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const CMS = process.env.CMS_URL ?? 'https://milifix-cms.onrender.com'
const MODEL = process.env.MODEL ?? 'claude-sonnet-5'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const ONLY_MISSING = args.includes('--only-missing')
const ONLY_SLUG = (args.find((a) => a.startsWith('--slug=')) ?? '').split('=')[1] || null
const ONLY_LANG = (args.find((a) => a.startsWith('--lang=')) ?? '').split('=')[1] || null
const LANGS = ONLY_LANG ? [ONLY_LANG] : ['en', 'ja']
const LANG_NAME = { en: 'English', ja: 'Japanese (日本語)' }

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_FILE = path.resolve(__dirname, '../src/data/post-translations.json')

const die = (m) => { console.error(`✗ ${m}`); process.exit(1) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// CMS 在 Render 免費方案會休眠，冷啟動首次請求可能 5xx／逾時。
// 對 5xx、429 與網路錯誤退避重試（Render 冷啟動可能要 30-60 秒才醒）。
async function fetchRetry(url, opts = {}, tries = 6) {
  let last
  for (let i = 0; i < tries; i++) {
    try {
      const r = await fetch(url, opts)
      if (r.ok || (r.status < 500 && r.status !== 429)) return r
      last = new Error(`HTTP ${r.status}`)
    } catch (e) { last = e }
    if (i < tries - 1) {
      const wait = Math.min(15000, 3000 * (i + 1))
      console.log(`  … CMS 未就緒（${last?.message ?? '?'}），${wait / 1000}s 後重試（${i + 1}/${tries - 1}）`)
      await sleep(wait)
    }
  }
  throw last ?? new Error('fetch failed')
}

async function maybeToken() {
  if (process.env.CMS_TOKEN) return process.env.CMS_TOKEN
  const { CMS_EMAIL, CMS_PASSWORD } = process.env
  if (!CMS_EMAIL || !CMS_PASSWORD) return null // 無憑證：只翻公開（非草稿）文章
  const r = await fetchRetry(`${CMS}/api/users/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: CMS_EMAIL, password: CMS_PASSWORD }),
  })
  if (!r.ok) die(`登入失敗（${r.status}）`)
  return (await r.json()).token ?? null
}

async function fetchAllPosts(headers) {
  const out = []
  let page = 1
  for (;;) {
    const r = await fetchRetry(`${CMS}/api/posts?limit=100&page=${page}&depth=1`, { headers })
    if (!r.ok) die(`取得文章失敗（${r.status}）`)
    const data = await r.json()
    out.push(...(data.docs ?? []))
    if (!data.hasNextPage) break
    page += 1
  }
  return out
}

// 收集 Lexical 內所有 text 節點（回填用同一組參照）
function collectTextNodes(node, acc) {
  if (!node || typeof node !== 'object') return
  if (node.type === 'text' && typeof node.text === 'string') acc.push(node)
  const kids = node.children ?? node.root?.children
  if (Array.isArray(kids)) for (const c of kids) collectTextNodes(c, acc)
  if (node.root) collectTextNodes(node.root, acc)
}

async function translateBatch(strings, lang) {
  const idxMap = []
  const payload = []
  strings.forEach((s, i) => { if (s && s.trim()) { idxMap.push(i); payload.push(s) } })
  if (payload.length === 0) return strings.slice()

  const prompt =
    `Translate each string in the following JSON array from Traditional Chinese to ${LANG_NAME[lang]}.\n` +
    `- Preserve meaning and tone; natural for the target language.\n` +
    `- Keep proper nouns, brand/program names, IATA codes, URLs and numbers as-is (use the standard target-language name where one clearly exists).\n` +
    `- Do NOT merge or split entries. Return exactly the same number of elements, same order.\n` +
    `- Return ONLY a JSON array of strings. No commentary, no code fence.\n\n` +
    JSON.stringify(payload)

  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: MODEL, max_tokens: 8192, messages: [{ role: 'user', content: prompt }] }),
  })
  if (!r.ok) throw new Error(`Anthropic API ${r.status}: ${await r.text().catch(() => '')}`)
  let text = ((await r.json()).content?.[0]?.text ?? '').trim()
  text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')
  let translated
  try { translated = JSON.parse(text) } catch { throw new Error(`模型回傳非 JSON：${text.slice(0, 200)}`) }
  if (!Array.isArray(translated) || translated.length !== payload.length) {
    throw new Error(`譯文陣列長度不符（期望 ${payload.length}，得 ${translated?.length}）`)
  }
  const result = strings.slice()
  idxMap.forEach((orig, k) => { result[orig] = translated[k] })
  return result
}

async function translatePost(post, lang) {
  const nodes = []
  const content = post.content ? structuredClone(post.content) : null
  if (content) collectTextNodes(content, nodes)
  const strings = [post.title ?? '', post.description ?? '', ...nodes.map((n) => n.text)]
  const out = await translateBatch(strings, lang)
  nodes.forEach((n, i) => { n.text = out[2 + i] })
  return { title: out[0], description: out[1], content }
}

async function main() {
  if (!DRY_RUN && !ANTHROPIC_KEY) die('請設定 ANTHROPIC_API_KEY')

  // 讀既有譯文（合併／--only-missing 用）
  let store = {}
  try { store = JSON.parse(await readFile(OUT_FILE, 'utf8')) } catch { store = {} }

  const token = await maybeToken()
  const headers = { 'Content-Type': 'application/json', ...(token ? { Authorization: `JWT ${token}` } : {}) }
  let posts = await fetchAllPosts(headers)
  if (ONLY_SLUG) posts = posts.filter((p) => p.slug === ONLY_SLUG)
  console.log(`共 ${posts.length} 篇${token ? '（含草稿）' : '（僅已發布）'}${DRY_RUN ? '，dry-run' : ''}；語言：${LANGS.join(', ')}`)

  let changed = false
  for (const post of posts) {
    for (const lang of LANGS) {
      if (ONLY_MISSING && store[post.slug]?.[lang]) { console.log(`  · ${post.slug} [${lang}] 已有，略過`); continue }
      if (DRY_RUN) { console.log(`  ~ ${post.slug} [${lang}] 將翻譯`); continue }
      try {
        const t = await translatePost(post, lang)
        store[post.slug] = { ...(store[post.slug] ?? {}), [lang]: t }
        changed = true
        console.log(`  ✓ ${post.slug} [${lang}]`)
      } catch (err) {
        console.log(`  ✗ ${post.slug} [${lang}] — ${err.message}`)
      }
    }
  }

  if (!DRY_RUN && changed) {
    // 依 slug 排序輸出，減少 diff 噪音
    const sorted = Object.fromEntries(Object.keys(store).sort().map((k) => [k, store[k]]))
    await writeFile(OUT_FILE, JSON.stringify(sorted, null, 2) + '\n')
    console.log(`已寫入 ${path.relative(process.cwd(), OUT_FILE)}。請 git add / commit。譯文為 AI 初稿，可再校訂。`)
  } else {
    console.log('未寫入（dry-run 或無變更）。')
  }
}

main().catch((e) => die(e.stack ?? String(e)))
