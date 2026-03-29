/** 依捲動更新頂部閱讀進度條 */
export function initReadingProgress() {
  const root = document.querySelector<HTMLElement>('[data-reading-progress]');
  const fill = root?.querySelector<HTMLElement>('.reading-progress__fill');
  if (!root || !fill) return;

  const rootEl = root;
  const fillEl = fill;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    rootEl.classList.add('reading-progress--reduced');
  }

  function tick() {
    const doc = document.documentElement;
    const scrollTop = window.scrollY;
    const scrollable = doc.scrollHeight - window.innerHeight;
    const p = scrollable > 0 ? Math.min(1, Math.max(0, scrollTop / scrollable)) : 0;
    fillEl.style.transform = `scaleX(${p})`;
  }

  tick();
  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', tick, { passive: true });
}
