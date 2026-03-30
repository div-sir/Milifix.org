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
  const d = document as Document & { startViewTransition?: (cb: () => void | Promise<void>) => unknown };
  return typeof d.startViewTransition === 'function';
}

/** 圓形揭開中心（像素）；無事件時用視窗中心 */
function setThemeTransitionOrigin(ev?: Pick<PointerEvent | MouseEvent, 'clientX' | 'clientY'>) {
  const x =
    ev && Number.isFinite(ev.clientX) && ev.clientX >= 0
      ? ev.clientX
      : typeof window !== 'undefined'
        ? window.innerWidth / 2
        : 0;
  const y =
    ev && Number.isFinite(ev.clientY) && ev.clientY >= 0
      ? ev.clientY
      : typeof window !== 'undefined'
        ? window.innerHeight / 2
        : 0;
  document.documentElement.style.setProperty('--theme-vt-x', `${x}px`);
  document.documentElement.style.setProperty('--theme-vt-y', `${y}px`);
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

export function toggleTheme(ev?: PointerEvent | MouseEvent): Theme {
  setThemeTransitionOrigin(ev);
  const next: Theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
  runWithThemeTransition(() => applyTheme(next));
  return next;
}
