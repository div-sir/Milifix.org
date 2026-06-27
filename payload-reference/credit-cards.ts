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
      name: 'annualFeeWaivable',
      type: 'select',
      label: '年費可否減免',
      defaultValue: 'unknown',
      options: [
        { label: '可減免', value: 'yes' },
        { label: '不可減免', value: 'no' },
        { label: '未知', value: 'unknown' },
      ],
    },
    {
      name: 'supplementaryCardFee',
      type: 'number',
      label: '附卡年費',
      defaultValue: 0,
      admin: { description: '0 = 免年費' },
    },
    {
      name: 'supplementaryCardMax',
      type: 'number',
      label: '附卡上限張數',
      admin: { description: '留空 = 無特別限制' },
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
      name: 'officialUrl',
      type: 'text',
      label: '官方連結',
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
      name: 'signUpBonus',
      type: 'textarea',
      label: '首刷禮 / 迎賓禮',
      admin: { description: '新戶核卡後的首刷回饋。留空 = 無首刷禮或未知。' },
    },
    {
      name: 'renewalBonus',
      type: 'textarea',
      label: '續卡禮',
      admin: { description: '繳交次年度年費後的回饋。留空 = 無續卡禮或未知。' },
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
            { label: '機場接送', value: 'airport-transfer' },
            { label: '航空會員', value: 'airline-membership' },
            { label: '機票折扣', value: 'flight-discount' },
            { label: '免稅折扣', value: 'duty-free-discount' },
            { label: '現金回饋', value: 'cashback' },
            { label: '飯店', value: 'hotel' },
            { label: '機場停車', value: 'airport-parking' },
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
          name: 'guestPolicy',
          type: 'text',
          label: '帶人規定',
          admin: {
            description: '例：可帶 2 位隨行親友',
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'lounge',
          },
        },
        {
          name: 'supplementaryCardEligible',
          type: 'checkbox',
          label: '附卡可用',
          defaultValue: true,
          admin: { description: '附卡持卡人是否也能使用此權益' },
        },
        {
          name: 'requirePhysicalCard',
          type: 'checkbox',
          label: '需出示實體卡',
          defaultValue: false,
        },
        // ── 保險結構化欄位（僅 insurance 類型顯示）──
        {
          name: 'insuranceTravel',
          type: 'number',
          label: '旅平險最高金額',
          admin: {
            description: '公共運輸工具旅遊平安險，單位：新台幣元（例 35000000 = NT$3,500 萬）',
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'insurance',
          },
        },
        {
          name: 'insuranceOverseas',
          type: 'number',
          label: '海外全程意外險最高金額',
          admin: {
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'insurance',
          },
        },
        {
          name: 'insuranceFlightDelay',
          type: 'number',
          label: '班機延誤（個人）',
          admin: {
            description: '實支實付，單位：新台幣元',
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'insurance',
          },
        },
        {
          name: 'insuranceBaggageDelay',
          type: 'number',
          label: '行李延誤（個人）',
          admin: {
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'insurance',
          },
        },
        {
          name: 'insuranceBaggageLost',
          type: 'number',
          label: '行李遺失（個人）',
          admin: {
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'insurance',
          },
        },
        {
          name: 'insuranceTripCancel',
          type: 'number',
          label: '行程取消/縮短（個人）',
          admin: {
            condition: (_, siblingData) =>
              siblingData?.benefitType === 'insurance',
          },
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
        {
          name: 'program',
          type: 'relationship',
          relationTo: 'programs',
          hasMany: true,
          label: '關聯計畫',
          admin: {
            condition: (_, siblingData) =>
              ['lounge', 'hotel'].includes(siblingData?.benefitType ?? ''),
          },
        },
      ],
    },
  ],
}
