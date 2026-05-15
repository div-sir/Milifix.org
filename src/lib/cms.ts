const CMS_URL = import.meta.env.CMS_URL ?? 'http://localhost:3000'
const CMS_API = `${CMS_URL}/api`

type FetchOptions = {
  where?: Record<string, unknown>
  limit?: number
  sort?: string
  depth?: number
}

async function fetchCollection<T>(collection: string, opts: FetchOptions = {}): Promise<T[]> {
  const params = new URLSearchParams()
  params.set('limit', String(opts.limit ?? 100))
  if (opts.sort) params.set('sort', opts.sort)
  if (opts.depth !== undefined) params.set('depth', String(opts.depth))
  if (opts.where) params.set('where', JSON.stringify(opts.where))

  const res = await fetch(`${CMS_API}/${collection}?${params}`)
  if (!res.ok) throw new Error(`CMS fetch failed: ${collection} (${res.status})`)
  const data = await res.json()
  return data.docs as T[]
}

async function fetchDoc<T>(collection: string, slug: string): Promise<T | null> {
  const params = new URLSearchParams({
    where: JSON.stringify({ slug: { equals: slug } }),
    limit: '1',
    depth: '1',
  })
  const res = await fetch(`${CMS_API}/${collection}?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  return (data.docs[0] ?? null) as T | null
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
