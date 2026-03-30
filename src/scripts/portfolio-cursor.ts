/** 自訂游標與延遲跟隨環（若 DOM 缺少 `#cursor` / `#cursor-ring` 則略過）；≤768px 停用 */
export function initPortfolioCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  const mq = window.matchMedia('(max-width: 768px)');
  const cursorEl = cursor;
  const ringEl = ring;
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  let rafId = 0;

  function onMove(e: MouseEvent) {
    mx = e.clientX;
    my = e.clientY;
    cursorEl.style.left = `${mx}px`;
    cursorEl.style.top = `${my}px`;
  }

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ringEl.style.left = `${rx}px`;
    ringEl.style.top = `${ry}px`;
    rafId = requestAnimationFrame(animateRing);
  }

  function disable() {
    document.removeEventListener('mousemove', onMove);
    cancelAnimationFrame(rafId);
    rafId = 0;
    cursorEl.style.display = 'none';
    ringEl.style.display = 'none';
  }

  function enable() {
    disable();
    cursorEl.style.removeProperty('display');
    ringEl.style.removeProperty('display');
    document.addEventListener('mousemove', onMove);
    animateRing();
  }

  function sync() {
    if (mq.matches) disable();
    else enable();
  }

  sync();
  mq.addEventListener('change', sync);
}
