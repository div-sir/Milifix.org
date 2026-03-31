import { prepare, layout } from '@chenglou/pretext';

type TargetEl = HTMLElement;

const TARGET_SELECTOR = [
  '.hero-desc',
  '.post-title',
  '.prose p',
  '.creator-row__tagline',
  '.section-label',
  'h1',
  'h2',
].join(', ');

const preparedCache = new Map<string, ReturnType<typeof prepare>>();

function px(value: string, fallback: number): number {
  if (!value || value === 'normal') return fallback;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function buildCanvasFont(cs: CSSStyleDeclaration): string {
  const fontStyle = cs.fontStyle || 'normal';
  const fontVariant = cs.fontVariant || 'normal';
  const fontWeight = cs.fontWeight || '400';
  const fontSize = cs.fontSize || '16px';
  const fontFamily = cs.fontFamily || 'sans-serif';
  return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize} ${fontFamily}`;
}

function measureAndApply(el: TargetEl) {
  const text = el.textContent?.trim();
  if (!text) return;

  const cs = window.getComputedStyle(el);
  const width = el.clientWidth;
  if (width <= 0) return;

  const font = buildCanvasFont(cs);
  const fontSizePx = px(cs.fontSize, 16);
  const lineHeightPx = px(cs.lineHeight, fontSizePx * 1.6);

  const cacheKey = `${font}::${text}`;
  let prepared = preparedCache.get(cacheKey);
  if (!prepared) {
    prepared = prepare(text, font);
    preparedCache.set(cacheKey, prepared);
  }

  const result = layout(prepared, width, lineHeightPx);
  const height = Math.ceil(result.height);

  el.style.setProperty('--pretext-line-count', String(result.lineCount));
  el.style.setProperty('--pretext-height', `${height}px`);
  el.style.minHeight = `${height}px`;
}

function run() {
  const targets = Array.from(document.querySelectorAll<HTMLElement>(TARGET_SELECTOR));
  for (const el of targets) {
    measureAndApply(el);
  }
}

export function initPretextLayout() {
  if (typeof window === 'undefined') return;

  run();

  let raf = 0;
  const onResize = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(run);
  };

  window.addEventListener('resize', onResize, { passive: true });
  window.addEventListener('pageshow', run, { passive: true });
}
