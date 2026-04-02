import '../styles/lang-transition.css';

export const LANG_TRANSITION_PENDING_KEY = 'portfolio:lang-transition-v1';

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function mountOverlayShell(): HTMLDivElement {
  let el = document.getElementById('portfolio-lang-transition') as HTMLDivElement | null;
  if (el && el.hasAttribute('data-early')) {
    el.removeAttribute('data-early');
    el.className = 'portfolio-lang-transition is-visible';
    el.innerHTML =
      '<div class="portfolio-lang-transition__bar" aria-hidden="true"></div>';
    el.style.setProperty('transition', 'none');
    el.style.setProperty('opacity', '1');
    requestAnimationFrame(() => {
      el.removeAttribute('style');
    });
    return el;
  }
  if (!el) {
    el = document.createElement('div');
    el.id = 'portfolio-lang-transition';
    el.className = 'portfolio-lang-transition';
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="portfolio-lang-transition__bar" aria-hidden="true"></div>';
    document.documentElement.appendChild(el);
  }
  return el;
}

/** 導覽選語言後：短暫遮罩再換頁，降低白屏突兀感。 */
export function navigateWithLangTransition(targetUrl: string): void {
  try {
    sessionStorage.setItem(LANG_TRANSITION_PENDING_KEY, '1');
  } catch {
    // private mode / disabled storage
  }
  if (prefersReducedMotion()) {
    window.location.href = targetUrl;
    return;
  }
  const el = mountOverlayShell();
  el.classList.remove('is-leaving');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('is-visible'));
  });
  window.setTimeout(() => {
    window.location.href = targetUrl;
  }, 220);
}

export function consumeLangTransitionPending(): boolean {
  try {
    if (sessionStorage.getItem(LANG_TRANSITION_PENDING_KEY)) {
      sessionStorage.removeItem(LANG_TRANSITION_PENDING_KEY);
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Blog 載入：銜接 head 內早期遮罩，或為直接開啟 ?hl=en|ja 補上進場過場。
 * @param fromLangNavigation 是否剛從本站語言選單觸發換頁
 */
export function prepareBlogLangTransitionOverlay(fromLangNavigation: boolean): void {
  const el = mountOverlayShell();
  el.classList.remove('is-leaving');
  if (fromLangNavigation) {
    el.classList.add('is-visible');
    return;
  }
  if (prefersReducedMotion()) {
    el.classList.add('is-visible');
    return;
  }
  el.classList.remove('is-visible');
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('is-visible'));
  });
}

/** 翻譯完成或改回中文後淡出並移節點。 */
export function finishBlogLangTransitionOverlay(): void {
  const el = document.getElementById('portfolio-lang-transition');
  if (!el) return;
  if (prefersReducedMotion()) {
    el.remove();
    return;
  }
  el.classList.add('is-leaving');
  const done = () => el.remove();
  el.addEventListener('transitionend', done, { once: true });
  window.setTimeout(done, 320);
}
