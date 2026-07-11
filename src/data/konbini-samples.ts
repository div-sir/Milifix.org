import type { KonbiniProduct } from '../lib/cms';

/**
 * 預覽／示範用的假資料。**僅在 CMS 回傳空且開了 CMS_ALLOW_EMPTY 時**作為
 * fallback（見 lib/konbini.ts 的 loadKonbiniProducts），讓 preview 部署與本地
 * 能看到真實版面。正式站一旦 CMS 有已核准內容即以 CMS 為準；CMS 若不可達，
 * 正式 build 會 fail-fast（不會顯示這些假資料）。CMS 上線後可刪除本檔。
 *
 * 為避免外部圖片相依，示範資料不帶封面圖，UI 以漸層佔位呈現。
 */
export const KONBINI_SAMPLES: KonbiniProduct[] = [
  {
    id: 'sample-hotdog',
    name: '大亨堡（原味）',
    slug: 'seven-tw-hotdog',
    country: 'taiwan',
    category: 'hotfood',
    price: 40,
    currency: 'TWD',
    featured: true,
    description: '7-ELEVEN 經典熱狗堡，櫃檯現組，加酸黃瓜與醬料是基本款。',
    chain: {
      id: 'chain-seven-tw',
      name: '7-ELEVEN',
      slug: 'seven-eleven-tw',
      country: 'taiwan',
      storeType: 'convenience',
    },
    reviews: [
      {
        id: 'r1',
        product: 'sample-hotdog',
        rating: 5,
        title: '深夜救星',
        body: '醬料給得大方，麵包烤過更香。加起司醬更邪惡。',
        store: '台北車站店',
        country: 'taiwan',
        authorName: 'maki',
        status: 'approved',
        submittedAt: '2026-06-20',
      },
      {
        id: 'r2',
        product: 'sample-hotdog',
        rating: 4,
        body: 'CP 值高，但要碰運氣看店員組得漂不漂亮。',
        authorName: 'ken',
        status: 'approved',
        submittedAt: '2026-06-18',
      },
    ],
  },
  {
    id: 'sample-karaage',
    name: 'からあげクン（レギュラー）',
    slug: 'lawson-jp-karaage-kun',
    country: 'japan',
    category: 'hotfood',
    price: 238,
    currency: 'JPY',
    featured: true,
    description: 'Lawson 招牌炸雞塊，一口大小，口味常有期間限定。',
    chain: {
      id: 'chain-lawson-jp',
      name: 'Lawson',
      slug: 'lawson-jp',
      country: 'japan',
      storeType: 'convenience',
    },
    reviews: [
      {
        id: 'r3',
        product: 'sample-karaage',
        rating: 5,
        title: '限定口味必收',
        body: '紅色包裝的辣味最對味，配啤酒一流。',
        store: '新宿東口店',
        country: 'japan',
        authorName: 'yuki',
        status: 'approved',
        submittedAt: '2026-06-25',
      },
    ],
  },
  {
    id: 'sample-softcream',
    name: '霜淇淋（期間限定）',
    slug: 'familymart-tw-softcream',
    country: 'taiwan',
    category: 'frozen',
    price: 40,
    currency: 'TWD',
    description: '全家 FamilyMart 霜淇淋，口味輪替，抹茶與巧克力最常見。',
    chain: {
      id: 'chain-family-tw',
      name: '全家 FamilyMart',
      slug: 'familymart-tw',
      country: 'taiwan',
      storeType: 'convenience',
    },
    reviews: [
      {
        id: 'r4',
        product: 'sample-softcream',
        rating: 4,
        body: '抹茶味夠濃不會太甜，但機台要看店家有沒有洗乾淨。',
        authorName: 'ally',
        status: 'approved',
        submittedAt: '2026-06-15',
      },
    ],
  },
  {
    id: 'sample-famichiki',
    name: 'ファミチキ',
    slug: 'familymart-jp-famichiki',
    country: 'japan',
    category: 'hotfood',
    price: 198,
    currency: 'JPY',
    description: 'FamilyMart 招牌炸雞排，皮酥肉多汁，深夜宵夜定番。',
    chain: {
      id: 'chain-family-jp',
      name: 'FamilyMart',
      slug: 'familymart-jp',
      country: 'japan',
      storeType: 'convenience',
    },
    reviews: [
      {
        id: 'r5',
        product: 'sample-famichiki',
        rating: 5,
        body: '骨付きじゃないから食べやすい。チーズ味も good。',
        authorName: 'sora',
        status: 'approved',
        submittedAt: '2026-06-22',
      },
    ],
  },
];
