export const ZEPH_NOTES_DIR = '筆記';

const tripLeaves = new Set([
  '2025瀨戶內海國際藝術祭-春夏秋展期與跳島筆記',
  '2025-曼谷旅行手冊',
  '大阪萬博2025-完全攻略',
  '東京隱藏景點-陽光60瞭望台',
  '地下神殿-首都圈外郭放水路',
  '拉麵系流派介紹-一碗風土一系風格六大門派',
  '金屬工藝聖地打鐵體驗-來燕三条打造自己專屬的刀',
  '日本經典自行車道路線精選-島波海道筑波霞浦',
]);

const noteBucketRules: Array<{ bucket: string; test: (ctx: { parts: string[]; leaf: string }) => boolean }> = [
  { bucket: '食旅·指南 · 筆記目錄', test: ({ leaf }) => leaf === '筆記目錄' },
  { bucket: '食旅·指南 · 必比登', test: ({ leaf }) => leaf.includes('東京必比登餐廳110家統整') },
  { bucket: '食旅·指南 · 研食', test: ({ leaf }) => leaf.includes('起司大解密') },
  { bucket: '鐵道·票券 · JR／周遊券', test: ({ leaf }) => leaf === 'jr-pass-與參考票價-統整' },
  {
    bucket: '鐵道·票券 · 觀光列車',
    test: ({ parts, leaf }) => parts[2] === '日本觀光列車' || leaf.includes('日本觀光列車總覽'),
  },
  {
    bucket: '鐵道·票券 · 樞紐與歐鐵',
    test: ({ leaf }) =>
      leaf.includes('成田機場') ||
      leaf.includes('歐洲鐵路夜車與eurail筆記整理') ||
      leaf.startsWith('orange-ferry') ||
      leaf.includes('大阪愛媛夜間渡輪'),
  },
  {
    bucket: '遊記·足跡 · 行程',
    test: ({ leaf }) =>
      leaf.includes('地下神殿') ||
      leaf.includes('拉麵系流派') ||
      leaf.includes('金屬工藝聖地打鐵體驗') ||
      tripLeaves.has(leaf),
  },
  {
    bucket: '航空·哩程 · 計畫與手冊',
    test: ({ leaf }) =>
      leaf.includes('全球三大航空聯盟') ||
      (leaf.includes('阿拉斯加航空') && leaf.includes('mileage-plan')) ||
      leaf.includes('機場貴賓室進出四途') ||
      leaf.startsWith('a320-') ||
      leaf.startsWith('f35-'),
  },
  { bucket: '住宿 · 集團筆記', test: ({ leaf }) => leaf.includes('國際酒店集團與品牌筆記') },
  { bucket: '專題·技術 · 實作', test: ({ leaf }) => leaf.startsWith('esp32-') || leaf.startsWith('http-狀態碼') },
];

export function resolveBlogBucket(postId: string): string {
  const parts = postId.split('/');
  if (parts[0] !== 'zephlog') return '其他 · 未分類';
  if (parts[1] === 'curated') return '其他 · 未分類';

  if (parts[1] === ZEPH_NOTES_DIR) {
    const leaf = parts[parts.length - 1] || '';
    for (const rule of noteBucketRules) {
      if (rule.test({ parts, leaf })) return rule.bucket;
    }
    return '其他 · 筆記未歸類';
  }

  return `其他 · ${parts[1] || '未分類'}`;
}
