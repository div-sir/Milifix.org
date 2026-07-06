/** 自訂游標與延遲跟隨環（若 DOM 缺少 `#cursor` / `#cursor-ring` 則略過）；僅精準指標（滑鼠）啟用，觸控/粗指標停用 */
export function initPortfolioCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  const mq = window.matchMedia('(pointer: fine)');
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
    // transform 平移（合成器處理）取代 left/top（會觸發 layout）
    cursorEl.style.transform = `translate3d(${mx}px, ${my}px, 0) translate(-50%, -50%)`;
  }

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ringEl.style.transform = `translate3d(${rx}px, ${ry}px, 0) translate(-50%, -50%)`;
    rafId = requestAnimationFrame(animateRing);
  }

  function disable() {
    document.removeEventListener('mousemove', onMove);
    cancelAnimationFrame(rafId);
    rafId = 0;
    cursorEl.style.display = 'none';
    ringEl.style.display = 'none';
    document.documentElement.classList.remove('has-custom-cursor');
  }

  function enable() {
    disable();
    cursorEl.style.removeProperty('display');
    ringEl.style.removeProperty('display');
    document.documentElement.classList.add('has-custom-cursor');
    document.addEventListener('mousemove', onMove);
    animateRing();
  }

  function sync() {
    if (mq.matches) enable();
    else disable();
  }

  sync();
  mq.addEventListener('change', sync);
}
