const STORAGE_KEY = 'portfolio-theme';

export type Theme = 'dark' | 'light';

function getPreferred(): Theme {
  if (typeof window === 'undefined') return 'dark';
  const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
  if (saved === 'dark' || saved === 'light') return saved;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme() {
  applyTheme(getPreferred());
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      applyTheme(e.matches ? 'light' : 'dark');
    }
  });
}

function shouldUseViewTransition(): boolean {
  if (typeof document === 'undefined' || typeof window === 'undefined') return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  /** 窄螢幕整頁 View Transition 成本高，易與側欄／scrollbar 競態造成跳動 */
  if (window.matchMedia('(max-width: 768px)').matches) return false;
  const d = document as Document & { startViewTransition?: (cb: () => void | Promise<void>) => unknown };
  return typeof d.startViewTransition === 'function';
}

function runWithThemeTransition(run: () => void) {
  const d = document as Document & {
    startViewTransition?: (cb: () => void | Promise<void>) => unknown;
  };
  if (shouldUseViewTransition()) {
    d.startViewTransition!(run);
  } else {
    run();
  }
}

export function toggleTheme(): Theme {
  const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  runWithThemeTransition(() => applyTheme(next));
  return next;
}
