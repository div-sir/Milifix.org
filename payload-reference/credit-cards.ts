import type { CollectionConfig } from 'payload'

export const CreditCards: CollectionConfig = {
  slug: 'credit-cards',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'bank', 'cardNetwork', 'annualFee'],
    group: 'Travel',
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: '卡片名稱',
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'bank',
      type: 'text',
      required: true,
      label: '發卡銀行',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: '卡面圖片',
    },
    {
      name: 'annualFee',
      type: 'number',
      required: true,
      defaultValue: 0,
      label: '年費（0 = 免年費）',
    },
    {
      name: 'annualFeeNote',
      type: 'text',
      label: '年費備註',
      admin: { description: '例：首年免、消費滿額免' },
    },
    {
      name: 'cardNetwork',
      type: 'select',
      required: true,
      defaultValue: 'visa',
      label: '卡組織',
      options: [
        { label: 'Visa', value: 'visa' },
        { label: 'Mastercard', value: 'mastercard' },
        { label: 'JCB', value: 'jcb' },
        { label: 'American Express', value: 'amex' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      label: '標籤',
      fields: [
        {
          name: 'tag',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
      label: '卡片說明',
    },
    {
      name: 'benefits',
      type: 'array',
      label: '權益',
      admin: {
        description: '信用卡的旅遊相關權益，可關聯航空公司或貴賓室',
      },
      fields: [
        {
          name: 'benefitType',
          type: 'select',
          required: true,
          label: '權益類型',
          options: [
            { label: '貴賓室', value: 'lounge' },
            { label: '哩程', value: 'miles' },
            { label: '優先登機', value: 'priority-boarding' },
            { label: '艙等升等', value: 'upgrade' },
            { label: '額外行李', value: 'baggage' },
            { label: '旅遊保險', value: 'insurance' },
            { label: '其他', value: 'other' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          required: true,
          label: '權益名稱',
        },
        {
          name: 'description',
          type: 'textarea',
          label: '權益說明',
        },
        {
          name: 'conditions',
          type: 'textarea',
          label: '使用條件',
          admin: { description: '例：每年限 6 次、需消費滿 NT$30 萬' },
        },
        {
          name: 'airline',
          type: 'relationship',
          relationTo: 'airlines',
          label: '關聯航空公司',
          admin: {
            condition: (_, siblingData) =>
              ['miles', 'priority-boarding', 'upgrade', 'baggage'].includes(
                siblingData?.benefitType,
              ),
          },
        },
        {
          name: 'lounge',
          type: 'relationship',
          relationTo: 'lounges',
          label: '關聯貴賓室',
          admin: {
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'lounge',
          },
        },
      ],
    },
  ],
}
