import type { CollectionConfig } from 'payload'

/**
 * 超商／連鎖店。konbini 評價專案的「品牌」層。
 * 例：7-ELEVEN、全家 FamilyMart、Lawson、萊爾富、全聯。
 *
 * 這份檔案是前端 repo 內的「權威 schema 規格」，需原樣同步到 milifix-cms
 * repo 的 collections/。前端只在 build 時透過 REST API 唯讀取用。
 */
export const KonbiniChains: CollectionConfig = {
  slug: 'konbini-chains',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'country', 'storeType'],
    group: '🏪 超商評價',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '連鎖店名稱',
      admin: { description: '例：7-ELEVEN、全家 FamilyMart、Lawson、萊爾富' },
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar', description: '網址用，例：seven-eleven、familymart' },
    },
    {
      name: 'country',
      type: 'select',
      required: true,
      label: '國家',
      options: [
        { label: '台灣', value: 'taiwan' },
        { label: '日本', value: 'japan' },
      ],
    },
    {
      name: 'storeType',
      type: 'select',
      label: '類型',
      defaultValue: 'convenience',
      options: [
        { label: '便利商店', value: 'convenience' },
        { label: '超市', value: 'supermarket' },
        { label: '連鎖餐飲', value: 'restaurant' },
        { label: '手搖／飲料', value: 'drink' },
        { label: '烘焙', value: 'bakery' },
        { label: '其他', value: 'other' },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: '品牌 Logo',
    },
    {
      name: 'website',
      type: 'text',
      label: '官方網站',
    },
    {
      name: 'description',
      type: 'textarea',
      label: '品牌說明',
    },
  ],
}
