/** 自訂游標與延遲跟隨環（若 DOM 缺少 `#cursor` / `#cursor-ring` 則略過） */
export function initPortfolioCursor() {
  const cursor = document.getElementById('cursor');
  const ring = document.getElementById('cursor-ring');
  if (!cursor || !ring) return;

  const cursorEl = cursor;
  const ringEl = ring;
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;

  document.addEventListener('mousemove', (e) => {
    mx = e.clientX;
    my = e.clientY;
    cursorEl.style.left = `${mx}px`;
    cursorEl.style.top = `${my}px`;
  });

  function animateRing() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    ringEl.style.left = `${rx}px`;
    ringEl.style.top = `${ry}px`;
    requestAnimationFrame(animateRing);
  }
  animateRing();
}
