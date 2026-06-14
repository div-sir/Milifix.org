/**
 * 部落格頁面的 Google Translate 整合。
 *
 * 文章本身以中文撰寫；當使用者選擇 en / ja 檢視時，動態載入 Google Translate
 * 小工具即時翻譯頁面。中文則清除翻譯狀態還原原文。
 *
 * 兩個部落格頁（列表 /blog 與文章 /blog/[slug]）共用此邏輯。
 */
import {
  consumeLangTransitionPending,
  finishBlogLangTransitionOverlay,
  prepareBlogLangTransitionOverlay,
} from './lang-transition';

const BLOG_VIEW_LANG_KEY = 'portfolio:blog-view-lang';
const PREFERRED_LANG_KEY = 'portfolio:preferred-lang';

type BlogLang = 'en' | 'ja' | 'zh';

declare global {
  interface Window {
    googleTranslateElementInit?: () => void;
  }
  // Google Translate 小工具載入後注入的全域物件
  // eslint-disable-next-line no-var
  var google: {
    translate: {
      TranslateElement: new (
        options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
        elementId: string,
      ) => void;
    };
  };
}

function isBlogLang(value: string): value is BlogLang {
  return value === 'en' || value === 'ja' || value === 'zh';
}

function clearGoogleTranslateState(): void {
  const expire = 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=; expires=${expire}; path=/`;
  document.cookie = `googtrans=; expires=${expire}; path=/; domain=${window.location.hostname}`;
}

function getBlogDisplayLang(): BlogLang {
  const qsLang = (new URL(window.location.href).searchParams.get('hl') || '').toLowerCase();
  if (isBlogLang(qsLang)) return qsLang;
  const savedBlog = (localStorage.getItem(BLOG_VIEW_LANG_KEY) || '').toLowerCase();
  if (isBlogLang(savedBlog)) return savedBlog;
  const preferred = (localStorage.getItem(PREFERRED_LANG_KEY) || '').toLowerCase();
  if (isBlogLang(preferred)) return preferred;
  return 'zh';
}

function applyGoogleTranslate(targetLang: BlogLang): boolean {
  const combo = document.querySelector<HTMLSelectElement>('.goog-te-combo');
  if (!combo) return false;
  if (combo.value === targetLang) return true;
  combo.value = targetLang;
  combo.dispatchEvent(new Event('change'));
  return true;
}

function mountTranslateScript(targetLang: BlogLang, onSettled?: () => void): void {
  const host = document.createElement('div');
  host.id = 'google_translate_element';
  host.style.display = 'none';
  document.body.appendChild(host);

  window.googleTranslateElementInit = () => {
    new google.translate.TranslateElement(
      { pageLanguage: 'zh-TW', includedLanguages: 'zh-TW,ja,en', autoDisplay: false },
      'google_translate_element',
    );

    let retries = 0;
    const maxRetries = 24;
    const timer = window.setInterval(() => {
      retries += 1;
      if (applyGoogleTranslate(targetLang) || retries >= maxRetries) {
        window.clearInterval(timer);
        onSettled?.();
      }
    }, 250);
  };

  const script = document.createElement('script');
  script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  script.defer = true;
  document.body.appendChild(script);
}

/** 依使用者偏好語系套用或清除部落格頁的 Google 翻譯。 */
export function initBlogTranslate(): void {
  const displayLang = getBlogDisplayLang();
  const fromLangNav = consumeLangTransitionPending();

  if (displayLang === 'zh') {
    if (fromLangNav) prepareBlogLangTransitionOverlay(true);
    clearGoogleTranslateState();
    if (fromLangNav) requestAnimationFrame(() => finishBlogLangTransitionOverlay());
  } else {
    prepareBlogLangTransitionOverlay(fromLangNav);
    mountTranslateScript(displayLang, () => finishBlogLangTransitionOverlay());
  }
}
