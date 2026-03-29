import { animate, onScroll } from 'animejs';

/**
 * 使用 Anime.js onScroll 將捲動進度映射到動畫時間軸（sync mode）。
 * @see https://animejs.com/documentation/events/onscroll/
 */
export function initAnimeOnScrollReveals() {
  document.querySelectorAll<HTMLElement>('[data-onscroll-reveal]').forEach((host) => {
    animate(host, {
      opacity: [0, 1],
      y: [44, 0],
      duration: 1000,
      ease: 'linear',
      autoplay: onScroll({
        target: host,
        sync: true,
        repeat: false,
      }),
    });
  });
}
