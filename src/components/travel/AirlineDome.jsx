import { useEffect, useMemo, useRef, useCallback } from 'react';
import { useGesture } from '@use-gesture/react';
import './DomeGallery.css';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
const wrapAngleSigned = deg => {
  const a = (((deg + 180) % 360) + 360) % 360;
  return a - 180;
};

function buildItems(pool, seg) {
  const xCols = Array.from({ length: seg }, (_, i) => -37 + i * 2);
  const evenYs = [-4, -2, 0, 2, 4];
  const oddYs = [-3, -1, 1, 3, 5];
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

  const seg = 25;
  const items = useMemo(() => buildItems(images, seg), [images]);
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

  const maxVert = 5;
  const dragSens = 20;

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
      applyTransform(rotationRef.current.x, rotationRef.current.y);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  useEffect(() => { applyTransform(0, 0); }, []);

  const stopInertia = useCallback(() => { if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null; } }, []);

  const startInertia = useCallback((vx, vy) => {
    let vX = clamp(vx, -1.4, 1.4) * 80, vY = clamp(vy, -1.4, 1.4) * 80;
    let frames = 0;
    const step = () => {
      vX *= 0.96; vY *= 0.96;
      if ((Math.abs(vX) < 0.01 && Math.abs(vY) < 0.01) || ++frames > 200) { inertiaRAF.current = null; return; }
      const nx = clamp(rotationRef.current.x - vY / 200, -maxVert, maxVert);
      const ny = wrapAngleSigned(rotationRef.current.y + vX / 200);
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
      draggingRef.current = true; movedRef.current = false;
      startRotRef.current = { ...rotationRef.current };
      startPosRef.current = { x: event.clientX, y: event.clientY };
    },
    onDrag: ({ event, last, velocity = [0, 0], direction = [0, 0], movement }) => {
      if (!draggingRef.current || !startPosRef.current) return;
      const dx = event.clientX - startPosRef.current.x, dy = event.clientY - startPosRef.current.y;
      if (!movedRef.current && dx * dx + dy * dy > 16) movedRef.current = true;
      const nx = clamp(startRotRef.current.x - dy / dragSens, -maxVert, maxVert);
      const ny = wrapAngleSigned(startRotRef.current.y + dx / dragSens);
      rotationRef.current = { x: nx, y: ny }; applyTransform(nx, ny);
      if (last) {
        draggingRef.current = false;
        let [vm0, vm1] = velocity; const [d0, d1] = direction;
        let vx = vm0 * d0, vy = vm1 * d1;
        if (Math.abs(vx) < 0.001 && Math.abs(vy) < 0.001 && Array.isArray(movement)) {
          vx = clamp((movement[0] / dragSens) * 0.02, -1.2, 1.2);
          vy = clamp((movement[1] / dragSens) * 0.02, -1.2, 1.2);
        }
        if (Math.abs(vx) > 0.005 || Math.abs(vy) > 0.005) startInertia(vx, vy);
        if (movedRef.current) lastDragEndAt.current = performance.now();
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
    openSlug(e.currentTarget.dataset.slug);
  }, [openSlug]);

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
      <main ref={mainRef} className="sphere-main" onPointerDown={dismissHint}>
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
