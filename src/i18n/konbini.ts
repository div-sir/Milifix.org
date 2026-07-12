import type { Lang } from './types';
import type {
  KonbiniCategory,
  KonbiniCountry,
  KonbiniCurrency,
} from '../lib/cms';

/**
 * konbini（超商評價）專案的獨立 i18n 字典。
 * 刻意不併入龐大的 ui.ts，讓此新區塊自成一格、互不影響。
 * 目前語系：en + zh（比照 travel）。
 */

export interface KonbiniStrings {
  navLabel: string;
  metaTitle: string;
  metaDesc: string;
  heroTag: string;
  heroTitle: string;
  heroDesc: string;
  /** 每個連鎖店商品清單最後的「新增商品」卡片 */
  addProductCta: string;
  /** 頁尾新增商品表單右上角的關閉按鈕 */
  closeAddSection: string;
  /** 照片／封面預覽縮圖上的移除按鈕（新增商品表單與評分表單共用） */
  removePhoto: string;
  /** 篩選（用在 tablist 的 aria-label） */
  filterCountry: string;
  filterChain: string;
  /** 卡片與詳情 */
  reviewsUnit: string;
  noReviews: string;
  noProducts: string;
  /** 連鎖店還沒有任何商品時的提示 */
  emptyChain: string;
  addFirstProduct: string;
  backToIndex: string;
  ratingLabel: string;
  priceLabel: string;
  storeLabel: string;
  by: string;
  relatedInChain: string;
  countryNames: Record<KonbiniCountry, string>;
  categoryNames: Record<KonbiniCategory, string>;
  currencySymbol: Record<KonbiniCurrency, string>;
  /** 商品頁內嵌評分元件（以商品排行為核心，非開放式投稿表單） */
  rate: {
    heading: string;
    signInReason: string;
    signedInAs: string;
    fieldBody: string;
    fieldPhotos: string;
    photoHint: string;
    photoTooMany: string;
    optional: string;
    send: string;
    sending: string;
    success: string;
    successUpdated: string;
    errorGeneric: string;
    errorSignIn: string;
    moderationNote: string;
    notConfigured: string;
  };
  /** 新增商品頁（/konbini/new） */
  newProduct: {
    pageTitle: string;
    intro: string;
    signInReason: string;
    signedInAs: string;
    fieldName: string;
    fieldChain: string;
    chainPlaceholder: string;
    fieldCategory: string;
    categoryPlaceholder: string;
    fieldPrice: string;
    fieldRating: string;
    fieldBody: string;
    fieldCover: string;
    optional: string;
    send: string;
    sending: string;
    success: string;
    errorGeneric: string;
    errorSignIn: string;
    notConfigured: string;
    noChains: string;
  };
}

const en: KonbiniStrings = {
  navLabel: 'Konbini',
  metaTitle: 'Konbini Picks — Taiwan & Japan convenience-store must-tries',
  metaDesc:
    'Community-sourced reviews of the best things to buy at Taiwan and Japan convenience stores and chains.',
  heroTag: 'Community reviews',
  heroTitle: 'Convenience-store must-tries',
  heroDesc:
    'The best things to grab at Taiwan and Japan convenience stores and chains — ranked and reviewed by the community.',
  addProductCta: 'Add a product',
  closeAddSection: 'Close',
  removePhoto: 'Remove photo',
  filterCountry: 'Country',
  filterChain: 'Chain',
  reviewsUnit: 'reviews',
  noReviews: 'No reviews yet — be the first.',
  noProducts: 'No picks published yet. Check back soon.',
  emptyChain: 'No products yet for this chain.',
  addFirstProduct: 'Add the first product',
  backToIndex: 'Back to Konbini',
  ratingLabel: 'Rating',
  priceLabel: 'Price',
  storeLabel: 'Where',
  by: 'by',
  relatedInChain: 'More from this chain',
  countryNames: { taiwan: 'Taiwan', japan: 'Japan' },
  categoryNames: {
    onigiri: 'Rice balls',
    bento: 'Bento & meals',
    hotfood: 'Hot food',
    dessert: 'Desserts',
    bread: 'Bread',
    drink: 'Drinks',
    snack: 'Snacks',
    frozen: 'Ice & frozen',
    other: 'Other',
  },
  currencySymbol: { TWD: 'NT$', JPY: '¥' },
  rate: {
    heading: 'Rate this pick',
    signInReason: 'Sign in with Google to rate — this keeps voting honest.',
    signedInAs: 'Signed in as',
    fieldBody: 'Your comment',
    fieldPhotos: 'Photos',
    photoHint: 'Up to 3 photos. Large images are resized automatically.',
    photoTooMany: 'You can attach at most 3 photos.',
    optional: 'optional',
    send: 'Submit rating',
    sending: 'Submitting…',
    success: 'Thanks! Your rating was submitted and will appear after moderation.',
    successUpdated: 'Your rating was updated and will appear after moderation.',
    errorGeneric: 'Something went wrong. Please try again.',
    errorSignIn: 'Please sign in with Google first.',
    moderationNote: 'All ratings are moderated before publishing.',
    notConfigured: 'Rating is not enabled yet. Please check back soon.',
  },
  newProduct: {
    pageTitle: 'Add a product',
    intro: 'Suggest a convenience-store must-try that isn’t listed yet, along with your rating — no need to come back later. Sign in with Google, and it goes live after a quick review.',
    signInReason: 'Sign in with Google to add a product — this keeps submissions honest.',
    signedInAs: 'Signed in as',
    fieldName: 'Product name',
    fieldChain: 'Chain',
    chainPlaceholder: 'Select a chain',
    fieldCategory: 'Category',
    categoryPlaceholder: 'Select a category',
    fieldPrice: 'Price',
    fieldRating: 'Your rating',
    fieldBody: 'Your comment',
    fieldCover: 'Photo (also used as your review photo)',
    optional: 'optional',
    send: 'Submit product',
    sending: 'Submitting…',
    success: 'Thanks! Your product is live now (it may take a little while to appear after the next site rebuild).',
    errorGeneric: 'Something went wrong. Please try again.',
    errorSignIn: 'Please sign in with Google first.',
    notConfigured: 'Submissions are not enabled yet. Please check back soon.',
    noChains: 'No chains available yet — please check back soon.',
  },
};

const zh: KonbiniStrings = {
  navLabel: '超商必吃',
  metaTitle: '超商必吃 — 台灣・日本便利商店與連鎖店推薦',
  metaDesc:
    '由社群投稿整理的台灣、日本便利商店與大型連鎖店必吃商品推薦與評價。',
  heroTag: '社群評價',
  heroTitle: '便利商店必吃的東西',
  heroDesc:
    '台灣、日本便利商店與連鎖店裡最值得買的東西——由社群投稿、評分與排行。',
  addProductCta: '新增商品',
  closeAddSection: '關閉',
  removePhoto: '移除照片',
  filterCountry: '國家',
  filterChain: '連鎖店',
  reviewsUnit: '則評價',
  noReviews: '還沒有評價——搶頭香吧。',
  noProducts: '目前還沒有推薦上架，敬請期待。',
  emptyChain: '這家店還沒有商品。',
  addFirstProduct: '新增第一個商品',
  backToIndex: '回超商必吃',
  ratingLabel: '評分',
  priceLabel: '價格',
  storeLabel: '購買地點',
  by: '投稿者',
  relatedInChain: '同品牌更多推薦',
  countryNames: { taiwan: '台灣', japan: '日本' },
  categoryNames: {
    onigiri: '飯糰',
    bento: '便當／飯食',
    hotfood: '熱食',
    dessert: '甜點',
    bread: '麵包',
    drink: '飲料',
    snack: '零食',
    frozen: '冰品／冷凍',
    other: '其他',
  },
  currencySymbol: { TWD: 'NT$', JPY: '¥' },
  rate: {
    heading: '幫這個商品評分',
    signInReason: '用 Google 登入才能評分，避免灌票。',
    signedInAs: '目前登入',
    fieldBody: '你的心得',
    fieldPhotos: '照片',
    photoHint: '最多 3 張；過大的圖片會自動縮小。',
    photoTooMany: '最多只能附上 3 張照片。',
    optional: '選填',
    send: '送出評分',
    sending: '送出中…',
    success: '感謝評分！內容經審核後就會顯示。',
    successUpdated: '評分已更新，經審核後就會顯示。',
    errorGeneric: '發生錯誤，請再試一次。',
    errorSignIn: '請先用 Google 登入。',
    moderationNote: '所有評分都會先經過審核才會發佈。',
    notConfigured: '評分功能尚未開放，敬請期待。',
  },
  newProduct: {
    pageTitle: '新增商品',
    intro: '分享一個還沒被收錄的超商必吃，順便附上你的評分——不用等審核通過再跑一趟。用 Google 登入投稿，內容經審核後就會上線。',
    signInReason: '用 Google 登入才能新增商品，避免濫投。',
    signedInAs: '目前登入',
    fieldName: '商品名稱',
    fieldChain: '連鎖店',
    chainPlaceholder: '選擇連鎖店',
    fieldCategory: '分類',
    categoryPlaceholder: '選擇分類',
    fieldPrice: '價格',
    fieldRating: '你的評分',
    fieldBody: '你的心得',
    fieldCover: '照片（同時作為這則評論的照片）',
    optional: '選填',
    send: '送出商品',
    sending: '送出中…',
    success: '感謝投稿！商品已經上架（下次網站重新建置後就會顯示）。',
    errorGeneric: '發生錯誤，請再試一次。',
    errorSignIn: '請先用 Google 登入。',
    notConfigured: '投稿功能尚未開放，敬請期待。',
    noChains: '目前還沒有可選的連鎖店，敬請期待。',
  },
};

const DICT: Record<'en' | 'zh', KonbiniStrings> = { en, zh };

/** konbini 僅 en + zh；其餘語系回退英文。 */
export function konbini(lang: Lang): KonbiniStrings {
  return lang === 'zh' ? DICT.zh : DICT.en;
}
