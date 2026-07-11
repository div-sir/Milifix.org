import type { Lang } from './types';

/** Intl.DateTimeFormat locale，供文章發佈日期等三語顯示使用 */
const DATE_LOCALE: Record<Lang, string> = {
  en: 'en-US',
  zh: 'zh-TW',
  ja: 'ja-JP',
};

/**
 * 把 ISO 日期字串（YYYY-MM-DD 或含時間）格式化為該語系慣用的顯示格式。
 * 解析失敗時原樣回傳輸入字串，避免整頁因單一壞資料而炸掉。
 */
export function formatPostDate(dateStr: string, lang: Lang): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(d);
}
