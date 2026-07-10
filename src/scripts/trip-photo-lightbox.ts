interface LightboxItem {
  src: string;
  alt: string;
  caption: string;
  trigger: HTMLButtonElement;
}

/**
 * 旅行報告書照片燈箱：點擊任一張真實照片放大檢視，
 * 支援上一張／下一張、ESC、背景點擊關閉，並在關閉時把焦點還給觸發按鈕。
 */
export function initTripPhotoLightbox(): void {
  const triggers = Array.from(
    document.querySelectorAll<HTMLButtonElement>('.trip-photo__trigger[data-lightbox-src]')
  );
  if (triggers.length === 0) return;

  const main = document.getElementById('main-content');
  const labelClose = main?.dataset.lightboxClose || 'Close';
  const labelPrev = main?.dataset.lightboxPrev || 'Previous';
  const labelNext = main?.dataset.lightboxNext || 'Next';

  const items: LightboxItem[] = triggers.map((trigger) => ({
    src: trigger.dataset.lightboxSrc || '',
    alt: trigger.dataset.lightboxAlt || '',
    caption: trigger.dataset.lightboxCaption || '',
    trigger,
  }));

  // ── 建立燈箱 DOM（僅一份，惰性插入）─────────────────────
  const root = document.createElement('div');
  root.className = 'trip-lightbox';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <div class="trip-lightbox__backdrop" data-lightbox-dismiss></div>
    <div class="trip-lightbox__stage" role="dialog" aria-modal="true">
      <button type="button" class="trip-lightbox__close" aria-label="${labelClose}">✕</button>
      <button type="button" class="trip-lightbox__nav trip-lightbox__nav--prev" aria-label="${labelPrev}">‹</button>
      <figure class="trip-lightbox__figure">
        <img class="trip-lightbox__img" alt="" />
        <figcaption class="trip-lightbox__caption"></figcaption>
      </figure>
      <button type="button" class="trip-lightbox__nav trip-lightbox__nav--next" aria-label="${labelNext}">›</button>
    </div>
  `;
  document.body.appendChild(root);

  const imgEl = root.querySelector<HTMLImageElement>('.trip-lightbox__img')!;
  const captionEl = root.querySelector<HTMLElement>('.trip-lightbox__caption')!;
  const closeBtn = root.querySelector<HTMLButtonElement>('.trip-lightbox__close')!;
  const prevBtn = root.querySelector<HTMLButtonElement>('.trip-lightbox__nav--prev')!;
  const nextBtn = root.querySelector<HTMLButtonElement>('.trip-lightbox__nav--next')!;

  let activeIndex = -1;
  let lastFocused: HTMLElement | null = null;

  const render = (): void => {
    const item = items[activeIndex];
    if (!item) return;
    imgEl.src = item.src;
    imgEl.alt = item.alt;
    captionEl.textContent = item.caption;
    captionEl.hidden = item.caption.length === 0;
  };

  const open = (index: number): void => {
    activeIndex = index;
    lastFocused = document.activeElement as HTMLElement | null;
    render();
    root.classList.add('is-open');
    root.setAttribute('aria-hidden', 'false');
    document.body.classList.add('trip-lightbox-lock');
    closeBtn.focus();
    document.addEventListener('keydown', onKeydown);
  };

  const close = (): void => {
    root.classList.remove('is-open');
    root.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('trip-lightbox-lock');
    document.removeEventListener('keydown', onKeydown);
    lastFocused?.focus();
  };

  const step = (delta: number): void => {
    if (items.length === 0) return;
    activeIndex = (activeIndex + delta + items.length) % items.length;
    render();
  };

  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowLeft') step(-1);
    else if (e.key === 'ArrowRight') step(1);
  };

  items.forEach((item, i) => {
    item.trigger.addEventListener('click', () => open(i));
  });
  closeBtn.addEventListener('click', close);
  prevBtn.addEventListener('click', () => step(-1));
  nextBtn.addEventListener('click', () => step(1));
  root.querySelectorAll('[data-lightbox-dismiss]').forEach((el) => el.addEventListener('click', close));
}
