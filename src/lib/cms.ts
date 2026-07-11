import type { Lang } from '../i18n/types'
import postTranslations from '../data/post-translations.json'
import { getCmsUrl, isFailFast, isProd } from './cms-env'

const CMS_API = `${getCmsUrl()}/api`

type FetchOptions = {
  where?: Record<string, unknown>
  limit?: number
  sort?: string
  depth?: number
  /**
   * 選用 collection：即便在 fail-fast（正式 build）失敗也回空值而非 throw。
   * 用於「CMS 端可能尚未建立」的新區塊（如 konbini），避免其未上線前
   * 拖垮整個正式 build。既有必要 collection 不設此旗標，維持嚴格保護。
   */
  optional?: boolean
}

type PayloadResponse<T> = { docs: T[]; totalDocs?: number }

class CmsFetchError extends Error {
  constructor(
    readonly collection: string,
    readonly status: number | null,
    detail?: string,
  ) {
    const cause = status === null ? 'network error' : `HTTP ${status}`
    super(
      `[cms] fetch failed for collection "${collection}" (${cause})` +
        (detail ? `: ${detail}` : ''),
    )
    this.name = 'CmsFetchError'
  }
}

/**
 * module-level memoization。key 為完整 request URL，已涵蓋
 * collection + where + sort + depth + limit，因此能區分不同查詢。
 * 快取的是 Promise，讓同一 build process 內對相同查詢的並發呼叫
 * 共用同一次 HTTP。僅在 build（PROD）時啟用，避免長時間 dev server
 * 快取造成內容過時。
 */
const requestCache = new Map<string, Promise<PayloadResponse<unknown>>>()

// 逐次逾時與重試上限。Render 免費方案的 CMS 會休眠，冷啟動可能先回 5xx 或
// 讓連線久候；因此對「網路錯誤 / 408 / 429 / 5xx」等暫時性失敗做退避重試，
// 只有連續失敗到上限才視為真失敗（在 build 觸發 fail-fast）。4xx（非 408/429）
// 屬確定性錯誤，不重試。
const REQUEST_TIMEOUT_MS = 30_000
const MAX_ATTEMPTS = 4
const RETRY_BASE_DELAY_MS = 1_500

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
export const isRetryableStatus = (s: number) => s === 408 || s === 429 || s >= 500

async function requestJson<T>(
  collection: string,
  url: string,
): Promise<PayloadResponse<T>> {
  let lastErr: CmsFetchError | null = null
  // 只有真正的 build（fail-fast）才需要為冷啟動重試；dev / CMS_ALLOW_EMPTY
  // 反正會 fallback 空值，單次嘗試即可，避免無謂拖慢。
  const attempts = isFailFast() ? MAX_ATTEMPTS : 1

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
    let res: Response
    try {
      res = await fetch(url, { signal: controller.signal })
    } catch (err) {
      // 網路錯誤或逾時（abort）——暫時性，可重試
      lastErr = new CmsFetchError(
        collection,
        null,
        err instanceof Error ? err.message : String(err),
      )
      if (attempt < attempts) {
        await sleep(RETRY_BASE_DELAY_MS * attempt)
        continue
      }
      throw lastErr
    } finally {
      clearTimeout(timer)
    }

    if (res.ok) return (await res.json()) as PayloadResponse<T>

    // 非 2xx：暫時性狀態才重試，其餘立即拋出
    if (isRetryableStatus(res.status) && attempt < attempts) {
      lastErr = new CmsFetchError(collection, res.status)
      await sleep(RETRY_BASE_DELAY_MS * attempt)
      continue
    }
    throw new CmsFetchError(collection, res.status)
  }

  // 迴圈理論上必在上面 return/throw；保底
  throw lastErr ?? new CmsFetchError(collection, null, 'unknown')
}

function fetchJson<T>(
  collection: string,
  url: string,
): Promise<PayloadResponse<T>> {
  if (!isProd()) return requestJson<T>(collection, url)
  const cached = requestCache.get(url)
  if (cached) return cached as Promise<PayloadResponse<T>>
  const pending = requestJson<T>(collection, url)
  requestCache.set(url, pending as Promise<PayloadResponse<unknown>>)
  return pending
}

/** Payload 回應含 totalDocs；被 limit 截斷時指名 collection 與差額。 */
function warnIfTruncated(collection: string, data: PayloadResponse<unknown>) {
  const total = data.totalDocs
  const got = data.docs?.length ?? 0
  if (typeof total === 'number' && total > got) {
    console.warn(
      `[cms] collection "${collection}" truncated: got ${got} of ${total} docs ` +
        `(missing ${total - got}) — raise limit or paginate`,
    )
  }
}

async function fetchCollection<T>(collection: string, opts: FetchOptions = {}): Promise<T[]> {
  const params = new URLSearchParams()
  params.set('limit', String(opts.limit ?? 100))
  if (opts.sort) params.set('sort', opts.sort)
  if (opts.depth !== undefined) params.set('depth', String(opts.depth))
  if (opts.where) params.set('where', JSON.stringify(opts.where))
  const url = `${CMS_API}/${collection}?${params}`

  try {
    const data = await fetchJson<T>(collection, url)
    warnIfTruncated(collection, data)
    return data.docs
  } catch (err) {
    if (isFailFast() && !opts.optional) throw err
    console.warn(
      `${err instanceof Error ? err.message : String(err)} — returning [] (CMS_ALLOW_EMPTY / dev / optional)`,
    )
    return []
  }
}

async function fetchDoc<T>(
  collection: string,
  slug: string,
  opts: { optional?: boolean } = {},
): Promise<T | null> {
  const params = new URLSearchParams({
    where: JSON.stringify({ slug: { equals: slug } }),
    limit: '1',
    depth: '1',
  })
  const url = `${CMS_API}/${collection}?${params}`
  try {
    const data = await fetchJson<T>(collection, url)
    return (data.docs[0] ?? null) as T | null
  } catch (err) {
    if (isFailFast() && !opts.optional) throw err
    console.warn(
      `${err instanceof Error ? err.message : String(err)} — returning null (CMS_ALLOW_EMPTY / dev)`,
    )
    return null
  }
}

// ── Works ──────────────────────────────────────────────────

export type CmsWork = {
  id: string
  title: string
  slug: string
  space: 'solilium' | 'voidlane'
  date: string
  description: string
  quote?: string
  quoteAttribution?: string
  cover?: { url: string; alt?: string }
  coverUrl?: string
  tags: { id: string; tag: string }[]
  cardVariant: 'standard' | 'featured' | 'compact' | 'cinema'
  pageVariant: 'classic' | 'editorial' | 'immersive' | 'minimal'
  workType?: 'gallery' | 'article' | 'project'
  content?: unknown
  mediaGallery?: { id: string; kind: string; file?: { url: string }; src?: string; caption?: string }[]
}

/** 封面圖 URL：優先用 UploadThing 上傳的，fallback 到 coverUrl 暫存欄位 */
export function workCoverUrl(work: CmsWork): string {
  return work.cover?.url ?? work.coverUrl ?? ''
}

/** 封面圖 alt：CMS 有填寫時輸出，否則維持空字串（裝飾性圖片） */
export function workCoverAlt(work: CmsWork): string {
  return work.cover?.alt ?? ''
}

export const getWorks = (space?: 'solilium' | 'voidlane') =>
  fetchCollection<CmsWork>('works', {
    where: space ? { space: { equals: space } } : undefined,
    sort: '-date',
    depth: 1,
  })

export const getWork = (slug: string) => fetchDoc<CmsWork>('works', slug)

// ── Posts ──────────────────────────────────────────────────

export type CmsPost = {
  id: string
  title: string
  slug: string
  description: string
  date: string
  draft: boolean
  hideInBlogIndex?: boolean
  hideToc?: boolean
  bucket?: string
  cover?: { url: string; alt?: string }
  content: unknown
}

export const getPosts = (opts: { includeDrafts?: boolean } = {}) =>
  fetchCollection<CmsPost>('posts', {
    where: opts.includeDrafts ? undefined : { draft: { equals: false } },
    sort: '-date',
    depth: 1,
  })

export const getPost = (slug: string) => fetchDoc<CmsPost>('posts', slug)

/**
 * 譯文以前端 repo 的 src/data/post-translations.json 承載（不動 CMS schema）。
 * 形狀：{ [slug]: { en?: {title,description,content}, ja?: {title,description,content} } }
 * content 為 Lexical JSON。由 scripts/translate-posts.mjs（AI 初譯）產生並 commit。
 */
type PostTranslation = { title?: string; description?: string; content?: unknown }
const POST_TRANSLATIONS = postTranslations as Record<
  string,
  Partial<Record<'en' | 'ja', PostTranslation>>
>

/**
 * 取單篇文章在指定語系的標題／摘要／內文。
 * zh 直接回原文；en/ja 讀 post-translations.json，任一欄為空則 fallback 中文原文。
 */
export function localizedPost(
  post: CmsPost,
  lang: Lang,
): { title: string; description: string; content: unknown } {
  if (lang === 'zh') {
    return { title: post.title, description: post.description, content: post.content }
  }
  const t = POST_TRANSLATIONS[post.slug]?.[lang]
  return {
    title: t?.title && t.title.trim() ? t.title : post.title,
    description: t?.description && t.description.trim() ? t.description : post.description,
    content: t?.content != null && t.content !== '' ? t.content : post.content,
  }
}

// ── Pages ──────────────────────────────────────────────────

export type CmsPage = {
  id: string
  pageKey: 'home' | 'solilium' | 'voidlane'
  hero?: { kicker?: string; line1?: string; line2?: string; tag?: string; description?: string }
  about?: { title?: string; lead?: string; second?: string }
  quoteBand?: string
  quoteBandAttr?: string
  tagline?: string
  magneticLabel?: string
}

export const getPage = (key: CmsPage['pageKey']) => fetchDoc<CmsPage>('pages', key)

// ── Travel: Credit Cards ──────────────────────────────────

export type CmsCardNetwork = 'visa' | 'mastercard' | 'jcb' | 'amex'
export type CmsBenefitType =
  | 'lounge'
  | 'miles'
  | 'priority-boarding'
  | 'upgrade'
  | 'baggage'
  | 'insurance'
  | 'airport-transfer'
  | 'airline-membership'
  | 'flight-discount'
  | 'duty-free-discount'
  | 'cashback'
  | 'hotel'
  | 'airport-parking'
  | 'other'

export type CmsAnnualFeeWaivable = 'yes' | 'no' | 'unknown'

export type CmsCardBenefit = {
  id: string
  benefitType: CmsBenefitType
  title: string
  description?: string
  conditions?: string
  guestPolicy?: string
  supplementaryCardEligible?: boolean
  requirePhysicalCard?: boolean
  insuranceTravel?: number
  insuranceOverseas?: number
  insuranceFlightDelay?: number
  insuranceBaggageDelay?: number
  insuranceBaggageLost?: number
  insuranceTripCancel?: number
  airline?: CmsAirline | string
  lounge?: CmsLounge | string
  program?: (CmsProgram | string)[]
}

export type CmsCreditCard = {
  id: string
  name: string
  slug: string
  bank: string
  image?: { url: string; alt?: string }
  annualFee: number
  annualFeeNote?: string
  annualFeeWaivable?: CmsAnnualFeeWaivable
  supplementaryCardFee?: number
  supplementaryCardMax?: number
  cardNetwork: CmsCardNetwork
  officialUrl?: string
  tags: { id: string; tag: string }[]
  benefits: CmsCardBenefit[]
  description?: string
  signUpBonus?: string
  renewalBonus?: string
}

export const getCreditCards = (opts?: { bank?: string }) =>
  fetchCollection<CmsCreditCard>('credit-cards', {
    where: opts?.bank ? { bank: { equals: opts.bank } } : undefined,
    sort: 'bank,name',
    depth: 2,
  })

export const getCreditCard = (slug: string) =>
  fetchDoc<CmsCreditCard>('credit-cards', slug)

// ── Travel: Airlines ──────────────────────────────────────

export type CmsAlliance = 'star-alliance' | 'oneworld' | 'skyteam' | 'none'

export type CmsAirline = {
  id: string
  name: string
  slug: string
  iataCode: string
  alliance: CmsAlliance
  logo?: { url: string; alt?: string }
  description?: string
}

export const getAirlines = () =>
  fetchCollection<CmsAirline>('airlines', { sort: 'name', depth: 1 })

export const getAirline = (slug: string) =>
  fetchDoc<CmsAirline>('airlines', slug)

// ── Travel: Lounges ───────────────────────────────────────

export type CmsLounge = {
  id: string
  name: string
  slug: string
  airport: string
  airportCode: string
  terminal?: string
  location?: string
  openingHours?: string
  network?: string
  images?: { id: string; image: { url: string; alt?: string } }[]
  description?: string
}

export const getLounges = (opts?: { airportCode?: string }) =>
  fetchCollection<CmsLounge>('lounges', {
    where: opts?.airportCode
      ? { airportCode: { equals: opts.airportCode } }
      : undefined,
    sort: 'airportCode,name',
    depth: 1,
  })

export const getLounge = (slug: string) =>
  fetchDoc<CmsLounge>('lounges', slug)

// ── Travel: Cross-references ──────────────────────────────

export const getCardsByAirline = (airlineId: string) =>
  fetchCollection<CmsCreditCard>('credit-cards', {
    where: { 'benefits.airline': { equals: airlineId } },
    sort: 'bank,name',
    depth: 2,
  })

export const getCardsByLounge = (loungeId: string) =>
  fetchCollection<CmsCreditCard>('credit-cards', {
    where: { 'benefits.lounge': { equals: loungeId } },
    sort: 'bank,name',
    depth: 2,
  })

// ── Travel: Programs / Networks ───────────────────────

export type CmsProgramType = 'lounge-network' | 'hotel-program' | 'airline-alliance'

export type CmsProgram = {
  id: string
  name: string
  slug: string
  programType: CmsProgramType
  logo?: { url: string; alt?: string }
  website?: string
  summary: string
  content?: unknown
  highlights: { id: string; text: string }[]
}

export const getPrograms = (opts?: { programType?: CmsProgramType }) =>
  fetchCollection<CmsProgram>('programs', {
    where: opts?.programType
      ? { programType: { equals: opts.programType } }
      : undefined,
    sort: 'programType,name',
    depth: 1,
  })

export const getProgram = (slug: string) =>
  fetchDoc<CmsProgram>('programs', slug)

// ── Konbini: 超商／連鎖店評價 ──────────────────────────────

export type KonbiniCountry = 'taiwan' | 'japan'
export type KonbiniStoreType =
  | 'convenience'
  | 'supermarket'
  | 'restaurant'
  | 'drink'
  | 'bakery'
  | 'other'
export type KonbiniCategory =
  | 'onigiri'
  | 'bento'
  | 'hotfood'
  | 'dessert'
  | 'bread'
  | 'drink'
  | 'snack'
  | 'frozen'
  | 'other'
export type KonbiniCurrency = 'TWD' | 'JPY'
export type KonbiniReviewStatus = 'pending' | 'approved' | 'rejected'

export type KonbiniChain = {
  id: string
  name: string
  slug: string
  country: KonbiniCountry
  storeType: KonbiniStoreType
  logo?: { url: string; alt?: string }
  website?: string
  description?: string
}

export type KonbiniReview = {
  id: string
  product: KonbiniProduct | string
  rating: number
  title?: string
  body?: string
  photos?: { id: string; image?: { url: string; alt?: string } }[]
  price?: number
  currency?: KonbiniCurrency
  store?: string
  country?: KonbiniCountry
  authorName?: string
  status: KonbiniReviewStatus
  submittedAt?: string
}

export type KonbiniProduct = {
  id: string
  name: string
  slug: string
  chain?: KonbiniChain | string
  country: KonbiniCountry
  category: KonbiniCategory
  cover?: { url: string; alt?: string }
  price?: number
  currency?: KonbiniCurrency
  featured?: boolean
  description?: string
  /** 由 build 時聚合已核准評價塞入（CMS 端不存在此欄位） */
  reviews?: KonbiniReview[]
}

export const getKonbiniChains = (opts?: { country?: KonbiniCountry }) =>
  fetchCollection<KonbiniChain>('konbini-chains', {
    where: opts?.country ? { country: { equals: opts.country } } : undefined,
    sort: 'name',
    depth: 1,
    optional: true,
  })

export const getKonbiniChain = (slug: string) =>
  fetchDoc<KonbiniChain>('konbini-chains', slug, { optional: true })

export const getKonbiniProducts = (opts?: {
  country?: KonbiniCountry
  category?: KonbiniCategory
}) =>
  fetchCollection<KonbiniProduct>('konbini-products', {
    where: {
      ...(opts?.country ? { country: { equals: opts.country } } : {}),
      ...(opts?.category ? { category: { equals: opts.category } } : {}),
    },
    sort: '-featured,name',
    depth: 1,
    optional: true,
  })

export const getKonbiniProduct = (slug: string) =>
  fetchDoc<KonbiniProduct>('konbini-products', slug, { optional: true })

/** 已核准的評價；depth 1 讓 product 關聯帶回 slug 以便分組。 */
export const getApprovedKonbiniReviews = () =>
  fetchCollection<KonbiniReview>('konbini-reviews', {
    where: { status: { equals: 'approved' } },
    sort: '-submittedAt',
    depth: 1,
    limit: 1000,
    optional: true,
  })

/** 從評價取商品 id（product 可能是關聯物件或裸 id）。 */
export function reviewProductId(review: KonbiniReview): string {
  return typeof review.product === 'string' ? review.product : review.product?.id
}

/** 平均星等（無評價回 0）。 */
export function averageRating(reviews: KonbiniReview[]): number {
  if (!reviews.length) return 0
  return reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
}
