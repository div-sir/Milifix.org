export function initSiteNav() {
  const el = document.querySelector<HTMLElement>('.site-nav');
  if (!el) return;
  const siteNav: HTMLElement = el;

  const btn = siteNav.querySelector<HTMLButtonElement>('.site-nav__toggle');
  const backdrop = siteNav.querySelector<HTMLElement>('.site-nav__backdrop');
  const flyout = siteNav.querySelector<HTMLElement>('.site-nav__flyout');
  const langBtn = siteNav.querySelector<HTMLButtonElement>('#site-nav-lang-btn');
  const langPanel = siteNav.querySelector<HTMLElement>('#site-nav-lang-panel');
  const langWrap = siteNav.querySelector<HTMLElement>('.site-nav__lang-wrap');
  const worksBtn = siteNav.querySelector<HTMLButtonElement>('#site-nav-works-btn');
  const worksPanel = siteNav.querySelector<HTMLElement>('#site-nav-works-panel');
  const worksWrap = siteNav.querySelector<HTMLElement>('.site-nav__works-wrap');
  const unhide = document.getElementById('site-nav-unhide');
  const focusableSelector = 'a[href], button:not([disabled])';

  const mq = window.matchMedia('(max-width: 768px)');
  const desktopMq = window.matchMedia('(min-width: 769px)');
  let lastScrollY = window.scrollY;

  function syncUnhide() {
    if (!unhide) return;
    const show =
      desktopMq.matches &&
      siteNav.classList.contains('is-hidden') &&
      !siteNav.matches(':focus-within');
    if (show) unhide.removeAttribute('hidden');
    else unhide.setAttribute('hidden', '');
  }

  function updateScrollHide() {
    if (!desktopMq.matches || siteNav.classList.contains('is-open')) {
      siteNav.classList.remove('is-hidden');
      lastScrollY = window.scrollY;
      syncUnhide();
      return;
    }
    const y = window.scrollY;
    const delta = y - lastScrollY;
    if (y < 88) {
      siteNav.classList.remove('is-hidden');
    } else if (delta > 8) {
      siteNav.classList.add('is-hidden');
    } else if (delta < -8) {
      siteNav.classList.remove('is-hidden');
    }
    lastScrollY = y;
    syncUnhide();
  }

  siteNav.addEventListener('focusin', () => {
    if (!desktopMq.matches) return;
    siteNav.classList.remove('is-hidden');
    syncUnhide();
  });

  unhide?.addEventListener('click', () => {
    siteNav.classList.remove('is-hidden');
    lastScrollY = window.scrollY;
    syncUnhide();
  });

  desktopMq.addEventListener('change', () => {
    if (!desktopMq.matches) {
      siteNav.classList.remove('is-hidden');
      closeLang();
      closeWorks();
    }
    lastScrollY = window.scrollY;
    syncUnhide();
  });

  function isLangOpen() {
    return !!(langPanel && !langPanel.hidden);
  }

  function setLangOpen(open: boolean) {
    if (!langPanel || !langBtn) return;
    langPanel.hidden = !open;
    langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeLang() {
    setLangOpen(false);
  }

  function isWorksOpen() {
    return !!(worksPanel && !worksPanel.hidden);
  }

  function setWorksOpen(open: boolean) {
    if (!worksPanel || !worksBtn) return;
    worksPanel.hidden = !open;
    worksBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  function closeWorks() {
    setWorksOpen(false);
  }

  langBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (desktopMq.matches) return;
    closeWorks();
    setLangOpen(!isLangOpen());
  });

  worksBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    if (desktopMq.matches) return;
    closeLang();
    setWorksOpen(!isWorksOpen());
  });

  /** 桌機：游標移入／鍵盤 focus 在區塊內即展開下拉 */
  function bindDesktopHover(
    wrap: HTMLElement | null,
    setOpen: (open: boolean) => void,
    closePeer: () => void,
  ) {
    if (!wrap) return;
    wrap.addEventListener('mouseenter', () => {
      if (!desktopMq.matches) return;
      closePeer();
      setOpen(true);
    });
    wrap.addEventListener('mouseleave', () => {
      if (!desktopMq.matches) return;
      setOpen(false);
    });
    wrap.addEventListener('focusin', () => {
      if (!desktopMq.matches) return;
      closePeer();
      setOpen(true);
    });
    wrap.addEventListener('focusout', () => {
      if (!desktopMq.matches) return;
      requestAnimationFrame(() => {
        if (!wrap.contains(document.activeElement)) setOpen(false);
      });
    });
  }

  bindDesktopHover(langWrap, setLangOpen, closeWorks);
  bindDesktopHover(worksWrap, setWorksOpen, closeLang);

  document.addEventListener(
    'click',
    (e) => {
      const t = e.target as Node;
      if (isLangOpen() && langWrap && !langWrap.contains(t)) closeLang();
      if (isWorksOpen() && worksWrap && !worksWrap.contains(t)) closeWorks();
    },
    true,
  );

  function setOpen(open: boolean) {
    if (open) {
      closeLang();
      closeWorks();
    }
    if (open) siteNav.classList.remove('is-hidden');
    siteNav.classList.toggle('is-open', open);
    if (btn) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      const openL = btn.dataset.ariaOpen || 'Open menu';
      const closeL = btn.dataset.ariaClose || 'Close menu';
      btn.setAttribute('aria-label', open ? closeL : openL);
    }
    document.body.style.overflow = open && mq.matches ? 'hidden' : '';
  }

  function close() {
    setOpen(false);
  }

  btn?.addEventListener('click', () => {
    const opening = !siteNav.classList.contains('is-open');
    setOpen(opening);
    if (opening && flyout) {
      requestAnimationFrame(() => {
        flyout.querySelector<HTMLElement>(focusableSelector)?.focus();
      });
    }
  });

  backdrop?.addEventListener('click', close);

  siteNav.querySelectorAll<HTMLAnchorElement>(
    '.site-nav__logo, .site-nav__links a, [data-lang-option], [data-works-menuitem]',
  ).forEach((a) => {
    a.addEventListener('click', () => {
      if (mq.matches) close();
      closeLang();
      closeWorks();
    });
  });

  function closeDockRelated() {
    if (mq.matches) close();
    closeLang();
    closeWorks();
  }

  document.querySelectorAll<HTMLAnchorElement>('.dock-nav a[href]').forEach((a) => {
    a.addEventListener('click', closeDockRelated);
  });
  document.querySelectorAll<HTMLButtonElement>('.dock-nav button.dock-nav__section').forEach((b) => {
    b.addEventListener('click', closeDockRelated);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (isWorksOpen()) {
      closeWorks();
      worksBtn?.focus();
      return;
    }
    if (isLangOpen()) {
      closeLang();
      langBtn?.focus();
      return;
    }
    if (siteNav.classList.contains('is-open')) {
      close();
      btn?.focus();
    }
  });

  mq.addEventListener('change', (e) => {
    if (!e.matches) {
      close();
      document.body.style.overflow = '';
    }
  });

  const onScroll = () => {
    siteNav.classList.toggle('is-scrolled', window.scrollY > 10);
    updateScrollHide();
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  syncUnhide();
  document.addEventListener('focusin', syncUnhide);
}

/** 手機版：關閉漢堡抽屜（主題鈕 script 等可呼叫，需與 initSiteNav 同步 aria / body overflow） */
export function closeMobileSiteNavFlyout() {
  const w = window.matchMedia('(max-width: 768px)');
  if (!w.matches) return;
  const siteNav = document.querySelector<HTMLElement>('.site-nav');
  if (!siteNav?.classList.contains('is-open')) return;
  siteNav.classList.remove('is-open');
  document.body.style.overflow = '';
  const toggle = siteNav.querySelector<HTMLButtonElement>('.site-nav__toggle');
  if (toggle) {
    toggle.setAttribute('aria-expanded', 'false');
    const openL = toggle.dataset.ariaOpen || 'Open menu';
    toggle.setAttribute('aria-label', openL);
  }
}
