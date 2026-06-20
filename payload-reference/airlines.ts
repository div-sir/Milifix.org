import type { CollectionConfig } from 'payload'

export const Airlines: CollectionConfig = {
  slug: 'airlines',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'iataCode', 'alliance'],
    group: 'Travel',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '航空公司名稱',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'iataCode',
      type: 'text',
      required: true,
      label: 'IATA 代碼',
      admin: { description: '例：BR (長榮)、CI (華航)、JL (日航)' },
      maxLength: 3,
    },
    {
      name: 'alliance',
      type: 'select',
      required: true,
      defaultValue: 'none',
      label: '航空聯盟',
      options: [
        { label: '星空聯盟 (Star Alliance)', value: 'star-alliance' },
        { label: '寰宇一家 (oneworld)', value: 'oneworld' },
        { label: '天合聯盟 (SkyTeam)', value: 'skyteam' },
        { label: '非聯盟', value: 'none' },
      ],
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
      label: 'Logo',
    },
    {
      name: 'description',
      type: 'textarea',
      label: '說明',
    },
  ],
}
