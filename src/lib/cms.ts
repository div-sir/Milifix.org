const CMS_URL = import.meta.env.CMS_URL ?? 'http://localhost:3000'
const CMS_API = `${CMS_URL}/api`

/**
 * 逃生旗標。CMS_ALLOW_EMPTY 為 '1' / 'true' 時，fetch 失敗維持寬鬆行為
 * （回 [] / null 並 warn），供本地或 CI 在沒有 CMS 的環境仍能 build。
 */
const ALLOW_EMPTY = ['1', 'true'].includes(
  String(import.meta.env.CMS_ALLOW_EMPTY ?? '').toLowerCase(),
)

/**
 * fail-fast 邊界：只有在 build（import.meta.env.PROD）且未開逃生旗標時，
 * fetch 失敗才 throw 讓 build 以非零 exit code 失敗，避免 CMS 停機時
 * webhook rebuild 產出空站覆蓋正式站。dev 一律寬鬆、不 throw。
 */
const FAIL_FAST = Boolean(import.meta.env.PROD) && !ALLOW_EMPTY

type FetchOptions = {
  where?: Record<string, unknown>
  limit?: number
  sort?: string
  depth?: number
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

async function requestJson<T>(
  collection: string,
  url: string,
): Promise<PayloadResponse<T>> {
  let res: Response
  try {
    res = await fetch(url)
  } catch (err) {
    throw new CmsFetchError(
      collection,
      null,
      err instanceof Error ? err.message : String(err),
    )
  }
  if (!res.ok) throw new CmsFetchError(collection, res.status)
  return (await res.json()) as PayloadResponse<T>
}

function fetchJson<T>(
  collection: string,
  url: string,
): Promise<PayloadResponse<T>> {
  if (!import.meta.env.PROD) return requestJson<T>(collection, url)
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
    if (FAIL_FAST) throw err
    console.warn(
      `${err instanceof Error ? err.message : String(err)} — returning [] (CMS_ALLOW_EMPTY / dev)`,
    )
    return []
  }
}

async function fetchDoc<T>(collection: string, slug: string): Promise<T | null> {
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
    if (FAIL_FAST) throw err
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
