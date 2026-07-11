import type { CollectionConfig } from 'payload'

/**
 * 商品。konbini 評價專案的核心被評對象——某連鎖店的某項「必吃的東西」。
 * 平均分由已核准的 konbini-reviews 於前端 build 時聚合，不存在本 collection。
 *
 * 權威 schema 規格，需同步到 milifix-cms repo。
 */
export const KonbiniProducts: CollectionConfig = {
  slug: 'konbini-products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'chain', 'category', 'country'],
    group: '🏪 超商評價',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '商品名稱',
      admin: { description: '例：大亨堡、からあげクン、霜淇淋' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'chain',
      type: 'relationship',
      relationTo: 'konbini-chains',
      required: true,
      label: '所屬連鎖店',
    },
    {
      name: 'country',
      type: 'select',
      required: true,
      label: '國家',
      admin: {
        description: '同一品牌在台日皆有時以此區分（例：台灣全家 vs 日本 FamilyMart）',
      },
      options: [
        { label: '台灣', value: 'taiwan' },
        { label: '日本', value: 'japan' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: '分類',
      defaultValue: 'other',
      options: [
        { label: '飯糰／御飯糰', value: 'onigiri' },
        { label: '便當／飯食', value: 'bento' },
        { label: '熱食／關東煮', value: 'hotfood' },
        { label: '甜點', value: 'dessert' },
        { label: '麵包', value: 'bread' },
        { label: '飲料', value: 'drink' },
        { label: '零食', value: 'snack' },
        { label: '冰品／冷凍', value: 'frozen' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: '封面圖',
    },
    {
      name: 'price',
      type: 'number',
      label: '建議售價',
    },
    {
      name: 'currency',
      type: 'select',
      label: '幣別',
      defaultValue: 'TWD',
      options: [
        { label: '新台幣 TWD', value: 'TWD' },
        { label: '日圓 JPY', value: 'JPY' },
      ],
    },
    {
      name: 'featured',
      type: 'checkbox',
      label: '精選（首頁優先顯示）',
      defaultValue: false,
    },
    {
      name: 'description',
      type: 'textarea',
      label: '商品說明',
    },
  ],
}
