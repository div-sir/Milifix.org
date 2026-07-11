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
  /** 投稿 CTA */
  submitCta: string;
  submitComingSoon: string;
  /** 篩選 */
  filterAll: string;
  filterCountry: string;
  filterCategory: string;
  /** 卡片與詳情 */
  reviewsUnit: string;
  noReviews: string;
  noProducts: string;
  backToIndex: string;
  ratingLabel: string;
  priceLabel: string;
  storeLabel: string;
  by: string;
  relatedInChain: string;
  countryNames: Record<KonbiniCountry, string>;
  categoryNames: Record<KonbiniCategory, string>;
  currencySymbol: Record<KonbiniCurrency, string>;
  submit: {
    pageTitle: string;
    intro: string;
    signInPrompt: string;
    signedInAs: string;
    fieldProduct: string;
    fieldRating: string;
    fieldTitle: string;
    fieldBody: string;
    fieldPrice: string;
    fieldStore: string;
    fieldCountry: string;
    fieldDisplayName: string;
    optional: string;
    send: string;
    sending: string;
    success: string;
    errorGeneric: string;
    errorSignIn: string;
    moderationNote: string;
    notConfigured: string;
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
  submitCta: 'Submit a review',
  submitComingSoon: 'Submissions open soon',
  filterAll: 'All',
  filterCountry: 'Country',
  filterCategory: 'Category',
  reviewsUnit: 'reviews',
  noReviews: 'No reviews yet — be the first.',
  noProducts: 'No picks published yet. Check back soon.',
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
  submit: {
    pageTitle: 'Submit a review',
    intro: 'Share a convenience-store must-try. Sign in with Google — your review goes live after a quick review.',
    signInPrompt: 'Sign in with Google to submit',
    signedInAs: 'Signed in as',
    fieldProduct: 'Product',
    fieldRating: 'Rating',
    fieldTitle: 'Title',
    fieldBody: 'Your review',
    fieldPrice: 'Price paid',
    fieldStore: 'Where you bought it',
    fieldCountry: 'Country',
    fieldDisplayName: 'Display name',
    optional: 'optional',
    send: 'Submit review',
    sending: 'Submitting…',
    success: 'Thanks! Your review was submitted and will appear after moderation.',
    errorGeneric: 'Something went wrong. Please try again.',
    errorSignIn: 'Please sign in with Google first.',
    moderationNote: 'All submissions are moderated before publishing.',
    notConfigured: 'Submissions are not enabled yet. Please check back soon.',
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
  submitCta: '我要投稿',
  submitComingSoon: '投稿功能即將開放',
  filterAll: '全部',
  filterCountry: '國家',
  filterCategory: '分類',
  reviewsUnit: '則評價',
  noReviews: '還沒有評價——搶頭香吧。',
  noProducts: '目前還沒有推薦上架，敬請期待。',
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
  submit: {
    pageTitle: '我要投稿',
    intro: '分享你的超商必吃。用 Google 登入投稿，內容經審核後就會上線。',
    signInPrompt: '用 Google 登入以投稿',
    signedInAs: '目前登入',
    fieldProduct: '商品',
    fieldRating: '評分',
    fieldTitle: '標題',
    fieldBody: '你的心得',
    fieldPrice: '購買價格',
    fieldStore: '購買地點',
    fieldCountry: '國家',
    fieldDisplayName: '顯示名稱',
    optional: '選填',
    send: '送出評價',
    sending: '送出中…',
    success: '感謝投稿！內容經審核後就會顯示。',
    errorGeneric: '發生錯誤，請再試一次。',
    errorSignIn: '請先用 Google 登入。',
    moderationNote: '所有投稿都會先經過審核才會發佈。',
    notConfigured: '投稿功能尚未開放，敬請期待。',
  },
};

const DICT: Record<'en' | 'zh', KonbiniStrings> = { en, zh };

/** konbini 僅 en + zh；其餘語系回退英文。 */
export function konbini(lang: Lang): KonbiniStrings {
  return lang === 'zh' ? DICT.zh : DICT.en;
}
