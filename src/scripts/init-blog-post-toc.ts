/**
 * Blog 文章目錄：固定右側；收合時 peek／固定展開與 init 內說明一致。
 * 目錄項為 button；標題來自 .prose 的 h1–h4。階級為「相對本篇最低標題層級」縮排（0–3）。
 */

const TOC_ROOT_ID = 'blog-post-toc';
const LS_COLLAPSED = 'portfolio:blog-toc-collapsed';
const PEEK_LEAVE_MS = 140;
const SUPPRESS_PEEK_MS = 500;

function visibleHeading(el: HTMLElement): boolean {
  return el.getClientRects().length > 0;
}

function headingLevel(tag: string): number {
  const n = parseInt(tag.slice(1), 10);
  return Number.isNaN(n) ? 6 : n;
}

/**
 * 相對於本篇出現的最低標題層級（min h1–h6）：避免整篇都用 `#` 時 TOC 全變同一階。
 * 例如僅 h1+h3 → 0 與 2；h1+h2+h3 → 0、1、2。
 */
function outlineDepth(headings: HTMLElement[], el: HTMLElement): number {
  const min = Math.min(...headings.map((h) => headingLevel(h.tagName)));
  const d = headingLevel(el.tagName) - min;
  return Math.max(0, Math.min(3, d));
}

/**
 * 側邊欄邏輯（僅 class／aria／localStorage，尺寸由 CSS 依 `blog-toc--collapsed` 決定）：
 * - 點擊 toggle → 切換 `blog-toc--collapsed`，並寫入 `portfolio:blog-toc-collapsed`。
 * - 收合時滑入 shell → `blog-toc--peek` 暫時露出面板；離開延遲清除 peek。
 * - 收合後短暫抑制 peek，避免剛收合就被 hover 打開。
 * - 切換鈕寬高在 CSS 固定（不依 collapsed 變）；箭頭僅旋轉、SVG 固定像素，避免點擊像縮放。
 */
function bindTocChrome(root: HTMLElement, toggle: HTMLButtonElement, shell: HTMLElement) {
  const labelUnpin = toggle.dataset.labelCollapse ?? '';
  const labelPin = toggle.dataset.labelExpand ?? '';

  let leavePeekTimer = 0;
  let suppressPeekUntil = 0;

  const setPeek = (on: boolean) => {
    root.classList.toggle('blog-toc--peek', on);
  };

  const clearLeavePeek = () => {
    if (leavePeekTimer) {
      window.clearTimeout(leavePeekTimer);
      leavePeekTimer = 0;
    }
  };

  const armLeavePeek = () => {
    clearLeavePeek();
    leavePeekTimer = window.setTimeout(() => {
      setPeek(false);
      leavePeekTimer = 0;
    }, PEEK_LEAVE_MS);
  };

  shell.addEventListener('mouseenter', () => {
    clearLeavePeek();
    if (!root.classList.contains('blog-toc--collapsed')) return;
    if (performance.now() < suppressPeekUntil) return;
    setPeek(true);
  });

  shell.addEventListener('mouseleave', () => {
    if (!root.classList.contains('blog-toc--collapsed')) return;
    armLeavePeek();
  });

  const setCollapsed = (on: boolean) => {
    root.classList.toggle('blog-toc--collapsed', on);
    toggle.setAttribute('aria-expanded', on ? 'false' : 'true');
    toggle.setAttribute('aria-label', on ? labelPin : labelUnpin);
    if (on) {
      setPeek(false);
      suppressPeekUntil = performance.now() + SUPPRESS_PEEK_MS;
    } else {
      setPeek(false);
      suppressPeekUntil = 0;
    }
    try {
      localStorage.setItem(LS_COLLAPSED, on ? '1' : '0');
    } catch {
      /* ignore */
    }
  };

  let initiallyCollapsed = true;
  try {
    initiallyCollapsed = localStorage.getItem(LS_COLLAPSED) !== '0';
  } catch {
    /* ignore */
  }
  setCollapsed(initiallyCollapsed);

  toggle.addEventListener('click', (ev) => {
    ev.preventDefault();
    setCollapsed(!root.classList.contains('blog-toc--collapsed'));
  });
}

export function initBlogPostToc(): void {
  const root = document.getElementById(TOC_ROOT_ID);
  const article = document.querySelector<HTMLElement>('article.wrap');
  if (!root || !article) return;

  const prose = article.querySelector<HTMLElement>('.prose');
  if (!prose) return;

  const all = Array.from(prose.querySelectorAll<HTMLElement>('h1, h2, h3, h4'));
  const headings = all.filter(visibleHeading);
  if (headings.length === 0) return;

  const nav = root.querySelector<HTMLElement>('.blog-toc__nav');
  const toggle = root.querySelector<HTMLButtonElement>('.blog-toc__toggle');
  const shell = root.querySelector<HTMLElement>('.blog-toc__shell');
  if (!nav || !toggle || !shell) return;

  bindTocChrome(root, toggle, shell);

  headings.forEach((h, i) => {
    if (!h.id) h.id = `blog-heading-${i}`;
  });

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let linkIndex = 0;
  for (const h of headings) {
    const depth = outlineDepth(headings, h);
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `blog-toc__link blog-toc__link--depth-${depth}`;
    btn.dataset.sectionId = h.id;
    if (!reduced) btn.style.setProperty('--toc-stagger', String(linkIndex));
    linkIndex += 1;

    const label = document.createElement('span');
    label.className = 'blog-toc__label';
    label.textContent = h.textContent?.trim().replace(/\s+/g, ' ') ?? '';

    btn.append(label);
    btn.addEventListener('click', () => {
      h.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
      const { pathname, search } = window.location;
      window.history.replaceState(null, '', `${pathname}${search}#${h.id}`);
    });

    nav.appendChild(btn);
  }

  const links = () => Array.from(nav.querySelectorAll<HTMLButtonElement>('button.blog-toc__link'));

  function setActive(id: string | null) {
    for (const b of links()) {
      const _sid = b.dataset.sectionId;
      const on = id !== null && _sid === id;
      b.classList.toggle('blog-toc__link--active', on);
      if (on) b.setAttribute('aria-current', 'location');
      else b.removeAttribute('aria-current');
    }
  }

  function pickActiveHeading() {
    const zone = window.innerHeight * 0.28;
    let current: HTMLElement | null = null;
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= zone) current = h;
    }
    setActive((current ?? headings[0]).id);
  }

  let ticking = false;
  const schedulePick = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      pickActiveHeading();
    });
  };

  const io = new IntersectionObserver(schedulePick, {
    root: null,
    rootMargin: '-8% 0px -52% 0px',
    threshold: [0, 0.05, 0.15, 0.35, 0.6, 1],
  });

  for (const h of headings) io.observe(h);

  schedulePick();

  window.addEventListener('resize', schedulePick, { passive: true });

  root.removeAttribute('hidden');
  if (reduced) {
    root.classList.add('blog-toc--mounted');
  } else {
    requestAnimationFrame(() => {
      root.classList.add('blog-toc--mounted');
    });
  }
}
