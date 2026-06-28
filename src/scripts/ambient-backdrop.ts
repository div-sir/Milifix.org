function shouldSkipClickEffectTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
}

function spawnClickRipple(layer: HTMLElement, clientX: number, clientY: number) {
  const el = document.createElement('span');
  el.className = 'ambient-click-ripple';
  el.style.left = `${clientX}px`;
  el.style.top = `${clientY}px`;
  layer.appendChild(el);
  el.addEventListener(
    'animationend',
    () => {
      el.remove();
    },
    { once: true }
  );
}

/** 游標驅動光暈 + 捲動位移 + 點擊漣漪；尊重 prefers-reduced-motion */
export function initAmbientBackdrop() {
  const root = document.querySelector<HTMLElement>('[data-ambient-backdrop]');
  if (!root) return;
  const backdropEl = root;
  const clickLayer = document.querySelector<HTMLElement>('[data-ambient-click-layer]');

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // 觸控裝置：游標光暈與捲動位移會在每個 scroll/touch frame 重繪整片漸層，
  // 是手機端卡頓主因之一；改為靜態背景（與 reduced-motion 相同）。
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const staticMode = reduceMotion || coarse;
  backdropEl.classList.toggle('ambient-backdrop--static', staticMode);

  function syncScroll() {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const s = window.scrollY / max;
    backdropEl.style.setProperty('--amb-scroll', s.toFixed(4));
  }

  if (staticMode) {
    backdropEl.style.setProperty('--amb-x', '0.5');
    backdropEl.style.setProperty('--amb-y', '0.5');
    backdropEl.style.setProperty('--amb-scroll', '0');
    return;
  }

  let targetX = 0.5;
  let targetY = 0.5;
  let curX = 0.5;
  let curY = 0.5;
  let rafId = 0;
  let idleSince = 0;

  function wake() {
    idleSince = 0;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function onMove(e: MouseEvent) {
    targetX = e.clientX / Math.max(1, window.innerWidth);
    targetY = e.clientY / Math.max(1, window.innerHeight);
    wake();
  }

  function onTouch(e: TouchEvent) {
    const t = e.touches[0];
    if (!t) return;
    targetX = t.clientX / Math.max(1, window.innerWidth);
    targetY = t.clientY / Math.max(1, window.innerHeight);
    wake();
  }

  function onPointerDown(e: PointerEvent) {
    if (!e.isPrimary || e.button !== 0) return;
    if (shouldSkipClickEffectTarget(e.target)) return;
    const x = e.clientX / Math.max(1, window.innerWidth);
    const y = e.clientY / Math.max(1, window.innerHeight);
    backdropEl.style.setProperty('--amb-pulse-x', x.toFixed(4));
    backdropEl.style.setProperty('--amb-pulse-y', y.toFixed(4));
    backdropEl.classList.remove('ambient-backdrop--pulse');
    void backdropEl.offsetWidth;
    backdropEl.classList.add('ambient-backdrop--pulse');
    window.setTimeout(() => backdropEl.classList.remove('ambient-backdrop--pulse'), 520);
    if (clickLayer) spawnClickRipple(clickLayer, e.clientX, e.clientY);
  }

  function tick(now: number) {
    curX += (targetX - curX) * 0.072;
    curY += (targetY - curY) * 0.072;
    curX = Math.max(0, Math.min(1, curX));
    curY = Math.max(0, Math.min(1, curY));
    backdropEl.style.setProperty('--amb-x', curX.toFixed(4));
    backdropEl.style.setProperty('--amb-y', curY.toFixed(4));

    // 接近目標即視為靜止，停止 rAF 省電；游標／捲動事件會再喚醒
    const settled = Math.abs(targetX - curX) < 0.0008 && Math.abs(targetY - curY) < 0.0008;
    if (settled) {
      if (!idleSince) idleSince = now;
      if (now - idleSince > 250) {
        rafId = 0;
        return;
      }
    } else {
      idleSince = 0;
    }
    rafId = requestAnimationFrame(tick);
  }

  window.addEventListener('mousemove', onMove, { passive: true });
  window.addEventListener('touchmove', onTouch, { passive: true });
  window.addEventListener('scroll', () => { syncScroll(); wake(); }, { passive: true });
  document.addEventListener('pointerdown', onPointerDown, true);
  syncScroll();
  wake();
}
