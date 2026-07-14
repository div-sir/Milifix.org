import type { CollectionConfig } from 'payload'

/**
 * 投稿評價。開放外部使用者（第三方 Google 登入）投稿，一律先存 pending，
 * 站主於後台審核後轉 approved，排程 rebuild 才會顯示於靜態站。
 *
 * 前端 repo 內的參考快照；權威 schema 在 milifix-cms repo。
 *
 * ── Phase 2 存取控制（於 milifix-cms 實作，這裡先以註解記錄）──
 *   access: {
 *     // 任何人可讀「已核准」；後台管理者可讀全部
 *     read: ({ req }) => (req.user ? true : { status: { equals: 'approved' } }),
 *     // 需登入（Google OAuth）才能建立；hook 強制 status=pending、綁定 authorId
 *     create: ({ req }) => Boolean(req.user),
 *     update: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
 *     delete: ({ req }) => Boolean(req.user?.roles?.includes('admin')),
 *   }
 *   hooks.beforeChange: 建立時強制 status='pending'、authorId=req.user.sub、
 *   submittedAt=now，避免投稿者自行改狀態或冒名。
 */
export const KonbiniReviews: CollectionConfig = {
  slug: 'konbini-reviews',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'product', 'rating', 'status', 'submittedAt'],
    group: '🏪 超商評價',
  },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'konbini-products',
      required: true,
      label: '評價商品',
    },
    {
      name: 'rating',
      type: 'number',
      required: true,
      label: '星等（1–5）',
      min: 1,
      max: 5,
    },
    {
      name: 'title',
      type: 'text',
      label: '標題',
    },
    {
      name: 'body',
      type: 'textarea',
      label: '文字心得',
    },
    {
      name: 'photos',
      type: 'array',
      label: '照片',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
        },
      ],
    },
    {
      name: 'price',
      type: 'number',
      label: '購買價格',
    },
    {
      name: 'currency',
      type: 'select',
      defaultValue: 'TWD',
      options: [
        { label: '新台幣 TWD', value: 'TWD' },
        { label: '日圓 JPY', value: 'JPY' },
      ],
    },
    {
      name: 'store',
      type: 'text',
      label: '購買分店／地點',
      admin: { description: '例：台北車站店、新宿東口店' },
    },
    {
      name: 'country',
      type: 'select',
      label: '國家',
      options: [
        { label: '台灣', value: 'taiwan' },
        { label: '日本', value: 'japan' },
      ],
    },
    {
      name: 'authorName',
      type: 'text',
      label: '投稿者顯示名稱',
    },
    {
      name: 'authorId',
      type: 'text',
      label: '投稿者身分（Google sub）',
      admin: { position: 'sidebar', readOnly: true, description: 'OAuth 綁定，防冒名' },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      label: '審核狀態',
      admin: { position: 'sidebar' },
      options: [
        { label: '待審核', value: 'pending' },
        { label: '已核准', value: 'approved' },
        { label: '已退回', value: 'rejected' },
        { label: '已下架', value: 'hidden' },
      ],
    },
    {
      name: 'moderationNote',
      type: 'textarea',
      label: '本次審核／下架原因',
      admin: { position: 'sidebar' },
    },
    {
      name: 'moderatedAt',
      type: 'date',
      label: '最近審核時間',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'moderatedBy',
      type: 'text',
      label: '最近審核者',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'moderationHistory',
      type: 'json',
      label: '審核歷史',
      admin: { readOnly: true },
    },
    {
      name: 'submittedAt',
      type: 'date',
      label: '投稿時間',
      admin: { position: 'sidebar' },
    },
  ],
}
