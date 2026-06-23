// 擬真信用卡互動：滑鼠移動 3D 傾斜 + 反光，點擊 ↻ 翻面。
// 效能：rAF 節流、僅在 hover 時更新、離開即歸位；尊重 reduced-motion 與觸控裝置。
export function initCardTilt(): void {
  const cards = document.querySelectorAll<HTMLElement>('[data-cc-tilt]');
  if (cards.length === 0) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarse = window.matchMedia('(pointer: coarse)').matches;

  cards.forEach((card) => {
    // hover 進入翻面、離開復原
    card.addEventListener('pointerenter', () => {
      card.classList.add('is-flipped');
      if (!prefersReduced && !coarse) card.classList.add('is-tilting');
    });
    card.addEventListener('pointerleave', () => {
      card.classList.remove('is-flipped');
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });

    // 觸控／省動效裝置不啟用傾斜
    if (prefersReduced || coarse) return;

    const MAX = 10;
    let raf = 0;
    let rx = 0;
    let ry = 0;

    const apply = () => {
      raf = 0;
      card.style.setProperty('--rx', `${rx.toFixed(2)}deg`);
      card.style.setProperty('--ry', `${ry.toFixed(2)}deg`);
    };

    card.addEventListener('pointermove', (e: PointerEvent) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      ry = (px - 0.5) * 2 * MAX;
      rx = -(py - 0.5) * 2 * MAX;
      card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
      card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      if (!raf) raf = requestAnimationFrame(apply);
    });
  });
}
