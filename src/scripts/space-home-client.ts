import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { animate, onScroll } from 'animejs';
import { initAnimeOnScrollReveals } from './init-anime-onscroll-reveals';
import { initAnimeSplitText } from './init-anime-splittext';
import { initPortfolioCursor } from './portfolio-cursor';

export function initSpaceHomeClient() {
  gsap.registerPlugin(ScrollTrigger);
  initPortfolioCursor();

  const scrollNudge = document.querySelector('[data-anime-scroll-nudge]');
  if (scrollNudge) {
    animate(scrollNudge, {
      y: { from: 0, to: 8 },
      duration: 2400,
      ease: 'inOut(3)',
      loop: true,
      alternate: true,
    });
  }

  const cards = gsap.utils.toArray<HTMLElement>('.work-card-anim');
  gsap.set(cards, { y: 60, opacity: 0 });
  ScrollTrigger.batch(cards, {
    start: 'top 88%',
    once: true,
    onEnter: (batch) => {
      gsap.to(batch, {
        y: 0,
        opacity: 1,
        duration: 0.75,
        stagger: 0.1,
        ease: 'power2.out',
        overwrite: true,
      });
    },
  });

  const magneticLabel = document.getElementById('magnetic-view-label');
  let magX = 0;
  let magY = 0;
  let magLx = 0;
  let magLy = 0;
  let magActive = false;
  let rafId: number;

  function magneticLoop() {
    if (magneticLabel && magActive) {
      magLx += (magX - magLx) * 0.18;
      magLy += (magY - magLy) * 0.18;
      magneticLabel.style.transform = `translate3d(${Math.round(magLx)}px, ${Math.round(magLy)}px, 0)`;
    }
    rafId = requestAnimationFrame(magneticLoop);
  }
  magneticLoop();

  // 收集 card 事件 handlers 以便清理
  type CardCleanup = { card: HTMLElement; enter: () => void; leave: () => void; move: (e: MouseEvent) => void };
  const cardCleanups: CardCleanup[] = [];

  if (magneticLabel) {
    document.querySelectorAll<HTMLElement>('[data-work-card]').forEach((card) => {
      const enter = () => {
        const rect = card.getBoundingClientRect();
        magLx = rect.right - 56;
        magLy = rect.top + 40;
        magX = magLx;
        magY = magLy;
        magneticLabel.style.transform = `translate3d(${Math.round(magLx)}px, ${Math.round(magLy)}px, 0)`;
        magActive = true;
        magneticLabel.classList.add('is-visible');
      };
      const leave = () => {
        magActive = false;
        magneticLabel.classList.remove('is-visible');
      };
      const move = (e: MouseEvent) => {
        const rect = card.getBoundingClientRect();
        const anchorX = rect.right - 56;
        const anchorY = rect.top + 40;
        magX = anchorX + (e.clientX - anchorX) * 0.45;
        magY = anchorY + (e.clientY - anchorY) * 0.45;
      };
      card.addEventListener('mouseenter', enter);
      card.addEventListener('mouseleave', leave);
      card.addEventListener('mousemove', move);
      cardCleanups.push({ card, enter, leave, move });
    });
  }

  const heroEl = document.getElementById('main-content');
  const heroScrollLine = document.querySelector('.hero-scroll__line');
  if (heroEl && heroScrollLine) {
    animate(heroScrollLine, {
      scaleY: [0, 1],
      transformOrigin: '50% 0%',
      duration: 1000,
      ease: 'linear',
      autoplay: onScroll({
        target: heroEl,
        sync: true,
        repeat: false,
      }),
    });
  }

  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) e.target.classList.add('visible');
      });
    },
    { threshold: 0.1 },
  );
  document.querySelectorAll('.fade-up').forEach((el) => io.observe(el));

  initAnimeSplitText();
  initAnimeOnScrollReveals();

  // View Transitions cleanup：頁面切換前釋放資源
  document.addEventListener(
    'astro:before-swap',
    () => {
      cancelAnimationFrame(rafId);
      cardCleanups.forEach(({ card, enter, leave, move }) => {
        card.removeEventListener('mouseenter', enter);
        card.removeEventListener('mouseleave', leave);
        card.removeEventListener('mousemove', move);
      });
      ScrollTrigger.getAll().forEach((st) => st.kill());
      io.disconnect();
    },
    { once: true },
  );
}
