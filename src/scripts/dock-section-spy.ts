/** 底部導覽：依捲動位置標示目前區塊（支援錨點連結或無 # 的捲動按鈕） */
function controlSectionId(el: HTMLElement): string | null {
  if (el.tagName === 'A') {
    const h = el.getAttribute('href') || '';
    return h.startsWith('#') ? h.slice(1) : null;
  }
  if (el.tagName === 'BUTTON') {
    return el.getAttribute('data-dock-scroll-id');
  }
  return null;
}

export function initDockSectionSpy(navRoot: HTMLElement) {
  const controls = [
    ...navRoot.querySelectorAll<HTMLElement>('a.dock-nav__section, button.dock-nav__section'),
  ];
  if (!controls.length) return;

  const sections: { id: string; el: HTMLElement }[] = [];
  for (const c of controls) {
    const id = controlSectionId(c);
    if (!id) continue;
    const target = document.getElementById(id);
    if (target) sections.push({ id, el: target });
  }
  if (!sections.length) return;

  function setActive(id: string | null) {
    for (const c of controls) {
      const cId = controlSectionId(c);
      const on = id !== null && cId === id;
      c.classList.toggle('dock-nav__section--active', on);
      if (on) c.setAttribute('aria-current', 'location');
      else c.removeAttribute('aria-current');
    }
  }

  navRoot.querySelectorAll<HTMLButtonElement>('button.dock-nav__section').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-dock-scroll-id');
      if (!id) return;
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      document.getElementById(id)?.scrollIntoView({
        behavior: reduce ? 'auto' : 'smooth',
        block: 'start',
      });
      const { pathname, search } = window.location;
      if (window.location.hash) {
        window.history.replaceState(null, '', pathname + search);
      }
    });
  });

  function updateActive() {
    const marker = window.innerHeight * 0.32;
    let current: string | null = null;
    for (const { id, el } of sections) {
      const r = el.getBoundingClientRect();
      if (r.top <= marker && r.bottom >= marker) {
        current = id;
        break;
      }
    }
    if (current === null) {
      for (let i = sections.length - 1; i >= 0; i--) {
        if (sections[i].el.getBoundingClientRect().top <= marker) {
          current = sections[i].id;
          break;
        }
      }
    }
    if (current === null) current = sections[0].id;
    setActive(current);
  }

  let ticking = false;
  function onScrollOrResize() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      updateActive();
    });
  }

  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });
  updateActive();
}
