import type { CollectionConfig } from 'payload'

export const Lounges: CollectionConfig = {
  slug: 'lounges',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'airportCode', 'terminal', 'network'],
    group: 'Travel',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '貴賓室名稱',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'airport',
      type: 'text',
      required: true,
      label: '機場名稱',
      admin: { description: '例：桃園國際機場、松山機場、成田國際機場' },
    },
    {
      name: 'airportCode',
      type: 'text',
      required: true,
      label: '機場代碼 (IATA)',
      admin: { description: '例：TPE、TSA、NRT' },
      maxLength: 4,
    },
    {
      name: 'terminal',
      type: 'text',
      label: '航廈',
      admin: { description: '例：第一航廈、第二航廈' },
    },
    {
      name: 'location',
      type: 'text',
      label: '位置',
      admin: { description: '例：出境大廳 D 區旁、管制區內 3 樓' },
    },
    {
      name: 'openingHours',
      type: 'text',
      label: '營業時間',
      admin: { description: '例：06:00–22:00' },
    },
    {
      name: 'network',
      type: 'text',
      label: '聯盟網路',
      admin: {
        description:
          '例：Priority Pass、Dragon Pass、LoungeKey、Plaza Premium',
      },
    },
    {
      name: 'images',
      type: 'array',
      label: '圖片',
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
      name: 'description',
      type: 'textarea',
      label: '說明',
    },
  ],
}
