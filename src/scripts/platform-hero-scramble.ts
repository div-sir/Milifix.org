/** 首頁封面：標題 scramble（亂碼收斂到正確文字） */
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789░▒│▀▄█';

function randomGlyph(): string {
  return CHARSET[Math.floor(Math.random() * CHARSET.length)] ?? '■';
}

export function initPlatformHeroScramble() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const el = document.querySelector<HTMLElement>('[data-scramble-text]');
  if (!el) return;

  const target = el.dataset.scrambleText?.trim() ?? '';
  if (!target) return;

  const len = target.length;
  const totalFrames = 52;
  const stagger = 0.92;

  let frame = 0;

  function tick() {
    const t = frame / totalFrames;
    let out = '';
    for (let i = 0; i < len; i++) {
      const ch = target[i]!;
      if (ch === ' ') {
        out += ' ';
        continue;
      }
      const revealStart = (i / Math.max(1, len - 1)) * stagger;
      const local = Math.max(0, Math.min(1, (t - revealStart) / (1 - stagger * 0.35)));
      const eased = 1 - Math.pow(1 - local, 2.4);
      if (eased >= 0.97 || Math.random() < eased) {
        out += ch;
      } else {
        out += randomGlyph();
      }
    }
    el.textContent = out;
    frame += 1;
    if (frame <= totalFrames) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target;
    }
  }

  el.textContent = Array.from(target, (c) => (c === ' ' ? ' ' : randomGlyph())).join('');
  requestAnimationFrame(tick);
}
