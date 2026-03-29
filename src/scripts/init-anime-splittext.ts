import { animate, splitText, stagger } from 'animejs';

type SplitGranularity = 'chars' | 'words';

function parseMode(raw: string | undefined): { granularity: SplitGranularity; inview: boolean } {
  if (raw === 'words-inview') return { granularity: 'words', inview: true };
  if (raw === 'chars-inview') return { granularity: 'chars', inview: true };
  if (raw === 'words') return { granularity: 'words', inview: false };
  return { granularity: 'chars', inview: false };
}

function parseDelayStart(el: HTMLElement): number {
  const v = el.dataset.animeSplittextDelay;
  if (v === undefined) return 0;
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function runSplit(el: HTMLElement) {
  const { granularity } = parseMode(el.dataset.animeSplittext ?? undefined);
  const delayStart = parseDelayStart(el);

  const splitter = splitText(el, {
    accessible: true,
    includeSpaces: false,
    words: granularity === 'words' ? { wrap: 'clip', class: 'anime-split-word' } : false,
    chars: granularity === 'chars' ? { wrap: 'clip', class: 'anime-split-char' } : false,
  });

  splitter.addEffect((instance) => {
    const targets = granularity === 'words' ? instance.words : instance.chars;
    if (!targets.length) return () => {};
    return animate(targets, {
      opacity: [0, 1],
      y: ['0.9em', '0em'],
      duration: granularity === 'words' ? 620 : 380,
      ease: 'out(3)',
      delay: stagger(granularity === 'words' ? 56 : 20, { start: 60 + delayStart }),
    });
  });
}

/**
 * Anime.js splitText（https://animejs.com/documentation/text/splittext）：依 `data-anime-splittext` 拆字／拆詞並進場。
 * - `chars` | `words`：載入後執行（預設 chars）
 * - `chars-inview` | `words-inview`：進入視窗後執行
 * - `data-anime-splittext-delay`：毫秒，加在 stagger 起點
 */
export function initAnimeSplitText() {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const nodes = document.querySelectorAll<HTMLElement>('[data-anime-splittext]');

  nodes.forEach((el) => {
    const { inview } = parseMode(el.dataset.animeSplittext ?? undefined);

    if (inview) {
      const io = new IntersectionObserver(
        (entries, observer) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            observer.unobserve(entry.target);
            runSplit(entry.target as HTMLElement);
          });
        },
        { rootMargin: '0px 0px -10% 0px', threshold: 0.06 },
      );
      io.observe(el);
    } else {
      runSplit(el);
    }
  });
}
