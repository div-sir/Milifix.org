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
};

const DICT: Record<'en' | 'zh', KonbiniStrings> = { en, zh };

/** konbini 僅 en + zh；其餘語系回退英文。 */
export function konbini(lang: Lang): KonbiniStrings {
  return lang === 'zh' ? DICT.zh : DICT.en;
}
