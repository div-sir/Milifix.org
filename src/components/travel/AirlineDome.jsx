import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = deg => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};

function buildItems(pool, seg) {
  // 欄置中（球心對前），縱向列數隨密度調整以覆蓋約 52° 視野，磚牆錯位排列
  const xCols = Array.from({ length: seg }, (_, i) => i * 2 - (seg - 1));
  const R = clamp(Math.round((52 * seg) / 360) + 1, 5, 8);
  const evenYs = Array.from({ length: R }, (_, i) => i * 2 - (R - 1));
  const oddYs = evenYs.map(y => y + 1);
  const coords = xCols.flatMap((x, c) => {
    const ys = c % 2 === 0 ? evenYs : oddYs;
    return ys.map(y => ({ x, y, sizeX: 2, sizeY: 2 }));
  });
  const totalSlots = coords.length;
  if (!pool.length) return coords.map(c => ({ ...c, src: '', alt: '', href: '' }));
  const used = Array.from({ length: totalSlots }, (_, i) => pool[i % pool.length]);
  for (let i = 1; i < used.length; i++) {
    if (used[i].src === used[i - 1].src) {
      for (let j = i + 1; j < used.length; j++) {
        if (used[j].src !== used[i].src) { [used[i], used[j]] = [used[j], used[i]]; break; }
      }
    }
  }
  return coords.map((c, i) => ({ ...c, ...used[i] }));
}

export default function AirlineDome({ airlines, lang }) {
  const images = useMemo(() => airlines.map((a) => ({
    src: a.logo?.url ?? `https://pics.avs.io/200/200/${a.iataCode}.png`,
    alt: `${a.name} (${a.iataCode})`,
    slug: a.slug,
    name: a.name,
    iataCode: a.iataCode,
  })), [airlines]);

  const [seg, setSeg] = useState(33);
  const items = useMemo(() => buildItems(images, seg), [images, seg]);
  const rootRef = useRef(null);
  const mainRef = useRef(null);
  const sphereRef = useRef(null);
  const rotationRef = useRef({ x: 0, y: 0 });
  const startRotRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef(null);
  const lastDragEndAt = useRef(0);
  const lastSampleRef = useRef(null);            // 最近一次指標取樣 { t, x, y }
  const velSampleRef = useRef({ vx: 0, vy: 0 }); // 平滑後的指標速度（px/ms）
  const autoRAF = useRef(null);
  const autoResumeAt = useRef(0);
  const hoveringRef = useRef(false);
  const inViewRef = useRef(true);

  const maxVert = 5;
  const dragSens = 20;
  const AUTO_RESUME_DELAY = 2200;

  const bumpAutoResume = useCallback(() => {
    autoResumeAt.current = performance.now() + AUTO_RESUME_DELAY;
  }, []);

  const applyTransform = (x, y) => {
    if (sphereRef.current) sphereRef.current.style.transform = `translateZ(calc(var(--radius) * -1)) rotateX(${x}deg) rotateY(${y}deg)`;
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width), h = Math.max(1, cr.height);
      const minDim = Math.min(w, h), aspect = w / h;
      let basis = aspect >= 1.3 ? w : minDim;
      let radius = clamp(Math.min(basis * 0.55, h * 1.35), 400, Infinity);
      root.style.setProperty('--radius', `${Math.round(radius)}px`);
      root.style.setProperty('--viewer-pad', `${Math.max(8, Math.round(minDim * 0.2))}px`);
      // 依球面尺寸自動決定欄數：以圖標尺寸推算理想圓心間距，讓各螢幕間距一致地緊湊
      const iconPx = clamp(w * 0.062, 66, 104); // 對齊 CSS .airline-tile img 的 clamp
      const nextSeg = clamp(Math.round((2 * Math.PI * radius) / (iconPx * 1.28)), 20, 52);
      setSeg(prev => (prev === nextSeg ? prev : nextSeg));
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { applyTransform(0, 0); }, []);

  // 自動回轉：靜止時球面緩慢自轉，互動／移出視野／reduced-motion 時暫停
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const AUTO_SPEED = 0.004; // deg/ms ≈ 90 秒一圈
    let lastT = performance.now();
    const tick = (t) => {
      const dt = Math.min(64, t - lastT);
      lastT = t;
      const idle =
        inViewRef.current &&
        !draggingRef.current &&
        !inertiaRAF.current &&
        !hoveringRef.current &&
        t >= autoResumeAt.current;
      if (idle) {
        const ny = wrapAngleSigned(rotationRef.current.y + AUTO_SPEED * dt);
        rotationRef.current = { x: rotationRef.current.x, y: ny };
        applyTransform(rotationRef.current.x, ny);
      }
      autoRAF.current = requestAnimationFrame(tick);
    };
    autoRAF.current = requestAnimationFrame(tick);

    const root = rootRef.current;
    const io = root
      ? new IntersectionObserver(([e]) => { inViewRef.current = e.isIntersecting; }, { threshold: 0.05 })
      : null;
    if (io && root) io.observe(root);

    const onVis = () => {
      autoResumeAt.current = document.hidden ? Infinity : performance.now() + AUTO_RESUME_DELAY;
    };
    document.addEventListener('visibilitychange', onVis);

    return () => {
      if (autoRAF.current) cancelAnimationFrame(autoRAF.current);
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  const stopInertia = useCallback(() => { if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null; } }, []);

  // 拋甩慣性：以「度／影格」為角速度，每影格乘上摩擦係數逐漸減速直到停下
  const startInertia = useCallback((avx, avy) => {
    const FRICTION = 0.975; // 越接近 1 滑得越久（物理慣性手感）
    const STOP = 0.015;     // 低於此角速度即停止（度／影格）
    let vX = clamp(avx, -4, 4), vY = clamp(avy, -4, 4);
    const step = () => {
      vX *= FRICTION; vY *= FRICTION;
      if (Math.abs(vX) < STOP && Math.abs(vY) < STOP) { inertiaRAF.current = null; return; }
      const nx = clamp(rotationRef.current.x - vY, -maxVert, maxVert);
      const ny = wrapAngleSigned(rotationRef.current.y + vX);
      rotationRef.current = { x: nx, y: ny };
      applyTransform(nx, ny);
      inertiaRAF.current = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRAF.current = requestAnimationFrame(step);
  }, [stopInertia]);

  useGesture({
    onDragStart: ({ event }) => {
      stopInertia();
      bumpAutoResume();
      draggingRef.current = true; movedRef.current = false;
      startRotRef.current = { ...rotationRef.current };
      startPosRef.current = { x: event.clientX, y: event.clientY };
      lastSampleRef.current = { t: performance.now(), x: event.clientX, y: event.clientY };
      velSampleRef.current = { vx: 0, vy: 0 };
    },
    onDrag: ({ event, last }) => {
      if (!draggingRef.current || !startPosRef.current) return;
      const dx = event.clientX - startPosRef.current.x, dy = event.clientY - startPosRef.current.y;
      if (!movedRef.current && dx * dx + dy * dy > 16) movedRef.current = true;
      const nx = clamp(startRotRef.current.x - dy / dragSens, -maxVert, maxVert);
      const ny = wrapAngleSigned(startRotRef.current.y + dx / dragSens);
      rotationRef.current = { x: nx, y: ny }; applyTransform(nx, ny);

      // 自行取樣指標速度：比手勢庫的 velocity 更貼近放手瞬間，慣性更穩定
      const now = performance.now();
      const prev = lastSampleRef.current;
      if (prev) {
        const dt = now - prev.t;
        if (dt > 0) {
          const ivx = (event.clientX - prev.x) / dt;
          const ivy = (event.clientY - prev.y) / dt;
          if (dt > 100) {
            // 拖曳中出現停頓（無移動事件）→ 以當下瞬時速度重設，避免甩出殘留速度
            velSampleRef.current = { vx: ivx, vy: ivy };
          } else {
            velSampleRef.current.vx = velSampleRef.current.vx * 0.6 + ivx * 0.4;
            velSampleRef.current.vy = velSampleRef.current.vy * 0.6 + ivy * 0.4;
          }
        }
      }
      lastSampleRef.current = { t: now, x: event.clientX, y: event.clientY };

      if (last) {
        draggingRef.current = false;
        // px/ms → 度/影格（與拖曳手感一致：位移 / 靈敏度 = 旋轉角度）
        const FRAME_MS = 1000 / 60;
        const avX = (velSampleRef.current.vx / dragSens) * FRAME_MS;
        const avY = (velSampleRef.current.vy / dragSens) * FRAME_MS;
        if (Math.abs(avX) > 0.05 || Math.abs(avY) > 0.05) startInertia(avX, avY);
        if (movedRef.current) lastDragEndAt.current = performance.now();
        bumpAutoResume();
        movedRef.current = false;
      }
    }
  }, { target: mainRef, eventOptions: { passive: true } });

  const hintRef = useRef(null);
  const dismissHint = useCallback(() => { hintRef.current?.classList.add('is-hidden'); }, []);

  useEffect(() => {
    const id = setTimeout(dismissHint, 4500);
    return () => clearTimeout(id);
  }, [dismissHint]);

  const openSlug = useCallback((slug) => {
    if (slug) window.dispatchEvent(new CustomEvent('airline:open', { detail: { slug } }));
  }, []);

  const onTileClick = useCallback((e) => {
    if (movedRef.current || performance.now() - lastDragEndAt.current < 80) return;
    bumpAutoResume();
    openSlug(e.currentTarget.dataset.slug);
  }, [openSlug, bumpAutoResume]);

  const onPointerEnter = useCallback(() => {
    if (window.matchMedia('(hover: hover)').matches) hoveringRef.current = true;
  }, []);
  const onPointerLeave = useCallback(() => {
    hoveringRef.current = false;
    bumpAutoResume();
  }, [bumpAutoResume]);

  const onTileKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openSlug(e.currentTarget.dataset.slug);
    }
  }, [openSlug]);

  const isZh = lang === 'zh';
  const seen = new Set();

  return (
    <div
      ref={rootRef}
      className="sphere-root airline-dome-root"
      style={{
        '--segments-x': seg,
        '--segments-y': seg,
        '--overlay-blur-color': 'var(--bg, #111318)',
        '--tile-radius': '14px',
        '--image-filter': 'none',
      }}
    >
      <main ref={mainRef} className="sphere-main" onPointerDown={dismissHint} onPointerEnter={onPointerEnter} onPointerLeave={onPointerLeave}>
        <div className="stage">
          <div ref={sphereRef} className="sphere">
            {items.map((it, i) => {
              const dup = it.slug ? seen.has(it.slug) : true;
              if (it.slug) seen.add(it.slug);
              return (
                <div
                  key={`${it.x},${it.y},${i}`}
                  className="item"
                  aria-hidden={dup ? 'true' : undefined}
                  style={{ '--offset-x': it.x, '--offset-y': it.y, '--item-size-x': it.sizeX, '--item-size-y': it.sizeY }}
                >
                  <div
                    className="item__image airline-tile"
                    role="button"
                    tabIndex={dup ? -1 : 0}
                    data-slug={it.slug}
                    aria-label={it.alt || 'Airline'}
                    onClick={onTileClick}
                    onKeyDown={onTileKey}
                  >
                    <img src={it.src} draggable={false} alt={dup ? '' : it.alt} loading="lazy" />
                    <span className="airline-tile__label">{it.name}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="overlay" />
        <div className="overlay overlay--blur" />
        <div className="edge-fade edge-fade--top" />
        <div className="edge-fade edge-fade--bottom" />
        <div ref={hintRef} className="airline-dome-hint" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4"/></svg>
          <span>{isZh ? '拖曳探索 · 點擊查看' : 'Drag to explore · Tap to view'}</span>
        </div>
      </main>
    </div>
  );
}
