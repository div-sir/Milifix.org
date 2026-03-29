import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initAnimeOnScrollReveals } from './init-anime-onscroll-reveals';
import { initAnimeSplitText } from './init-anime-splittext';
import { initPortfolioCursor } from './portfolio-cursor';

export function initWorkSlugClient() {
  gsap.registerPlugin(ScrollTrigger);
  initPortfolioCursor();

  gsap.from('.work-hero-animate', {
    y: 60,
    opacity: 0,
    duration: 0.72,
    stagger: 0.1,
    ease: 'power2.out',
    delay: 0.08,
  });

  document.querySelectorAll('.work-body p').forEach((p) => {
    gsap.from(p, {
      scrollTrigger: { trigger: p, start: 'top 88%', once: true },
      y: 48,
      opacity: 0,
      duration: 0.65,
      ease: 'power2.out',
    });
  });

  initAnimeSplitText();
  initAnimeOnScrollReveals();

  const immersiveImg = document.querySelector<HTMLElement>('.work-hero--immersive .work-hero__img');
  if (immersiveImg) {
    const onImmScroll = () => {
      const y = window.scrollY;
      immersiveImg.style.transform = `scale(1.08) translate3d(0, ${Math.min(y * 0.15, 120)}px, 0)`;
    };
    onImmScroll();
    window.addEventListener('scroll', onImmScroll, { passive: true });
  }
}
