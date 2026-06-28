import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import './DomeGallery.css';

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export default function AirlineDome({ airlines, lang }) {
  const images = useMemo(() => airlines.map((a) => ({
    src: a.logo?.url ?? `https://pics.avs.io/200/200/${a.iataCode}.png`,
    alt: `${a.name} (${a.iataCode})`,
    slug: a.slug,
    name: a.name,
    iataCode: a.iataCode,
    alliance: a.alliance,
  })), [airlines]);

  const rootRef = useRef(null);
  const gridRef = useRef(null);
  const panRef = useRef({ x: 0, y: 0 });
  const startPanRef = useRef({ x: 0, y: 0 });
  const startPosRef = useRef(null);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const inertiaRAF = useRef(null);
  const autoRAF = useRef(null);
  const lastDragEndAt = useRef(0);
  const lastSampleRef = useRef(null);
  const velRef = useRef({ vx: 0, vy: 0 });
  const autoResumeAt = useRef(0);
  const hintRef = useRef(null);
  const hintDismissedRef = useRef(false);
  const captionRef = useRef(null);
  const inViewRef = useRef(true);
  const [cellSize, setCellSize] = useState(80);

  const IDLE_BEFORE_AUTO = 2000;
  const isZh = lang === 'zh';

  // Hex grid layout: compute cols/rows for the pattern block
  const { cols, rows, pattern } = useMemo(() => {
    const n = images.length;
    if (!n) return { cols: 1, rows: 1, pattern: [] };
    const c = Math.max(3, Math.ceil(Math.sqrt(n * 1.15)));
    const r = Math.ceil(n / c);
    const arr = [];
    for (let i = 0; i < r * c; i++) {
      arr.push(images[i % n]);
    }
    return { cols: c, rows: r, pattern: arr };
  }, [images]);

  const bumpAutoResume = useCallback(() => {
    autoResumeAt.current = performance.now() + IDLE_BEFORE_AUTO;
  }, []);

  const dismissHint = useCallback(() => {
    if (hintDismissedRef.current) return;
    hintDismissedRef.current = true;
    hintRef.current?.classList.add('is-hidden');
  }, []);

  const applyPan = useCallback(() => {
    if (!gridRef.current) return;
    gridRef.current.style.transform = `translate(${panRef.current.x}px, ${panRef.current.y}px)`;
  }, []);

  // Caption
  const showCaption = useCallback((el) => {
    const cap = captionRef.current;
    if (!cap || !el?.dataset?.name) return;
    cap.querySelector('.airline-caption__name').textContent = el.dataset.name;
    const meta = el.dataset.meta || '';
    const metaEl = cap.querySelector('.airline-caption__meta');
    metaEl.textContent = meta;
    metaEl.style.display = meta ? '' : 'none';
    cap.classList.add('is-visible');
    dismissHint();
    bumpAutoResume();
  }, [dismissHint, bumpAutoResume]);
  const hideCaption = useCallback(() => { captionRef.current?.classList.remove('is-visible'); }, []);
  const onTileOver = useCallback((e) => {
    const el = e.target.closest?.('.hc-tile');
    if (el) showCaption(el); else hideCaption();
  }, [showCaption, hideCaption]);

  // Resize: compute cell size
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ro = new ResizeObserver(entries => {
      const cr = entries[0].contentRect;
      const w = Math.max(1, cr.width);
      const cellW = Math.round(clamp(w * 0.11, 56, 100));
      setCellSize(prev => prev === cellW ? prev : cellW);
      root.style.setProperty('--hc-cell', `${cellW}px`);
    });
    ro.observe(root);
    return () => ro.disconnect();
  }, []);

  // Auto-pan
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const SPEED = 0.012; // px/ms
    autoResumeAt.current = performance.now() + 3500;
    let lastT = performance.now();
    const tick = (t) => {
      const dt = Math.min(64, t - lastT);
      lastT = t;
      const idle = inViewRef.current && !draggingRef.current && !inertiaRAF.current && t >= autoResumeAt.current;
      if (idle) {
        dismissHint();
        panRef.current.x -= SPEED * dt;
        applyPan();
      }
      autoRAF.current = requestAnimationFrame(tick);
    };
    autoRAF.current = requestAnimationFrame(tick);

    const root = rootRef.current;
    const io = root ? new IntersectionObserver(([e]) => { inViewRef.current = e.isIntersecting; }, { threshold: 0.05 }) : null;
    if (io && root) io.observe(root);

    return () => {
      if (autoRAF.current) cancelAnimationFrame(autoRAF.current);
      io?.disconnect();
    };
  }, [dismissHint, applyPan]);

  const stopInertia = useCallback(() => {
    if (inertiaRAF.current) { cancelAnimationFrame(inertiaRAF.current); inertiaRAF.current = null; }
  }, []);

  const startInertia = useCallback((vx, vy) => {
    const FRICTION = 0.965;
    const STOP = 0.15;
    let cvx = clamp(vx, -40, 40), cvy = clamp(vy, -40, 40);
    const step = () => {
      cvx *= FRICTION; cvy *= FRICTION;
      if (Math.abs(cvx) < STOP && Math.abs(cvy) < STOP) { inertiaRAF.current = null; return; }
      panRef.current.x += cvx;
      panRef.current.y += cvy;
      applyPan();
      inertiaRAF.current = requestAnimationFrame(step);
    };
    stopInertia();
    inertiaRAF.current = requestAnimationFrame(step);
  }, [stopInertia, applyPan]);

  // Pointer drag
  const onPointerDown = useCallback((e) => {
    stopInertia();
    bumpAutoResume();
    draggingRef.current = true;
    movedRef.current = false;
    startPanRef.current = { ...panRef.current };
    startPosRef.current = { x: e.clientX, y: e.clientY };
    lastSampleRef.current = { t: performance.now(), x: e.clientX, y: e.clientY };
    velRef.current = { vx: 0, vy: 0 };
    e.currentTarget.setPointerCapture(e.pointerId);
  }, [stopInertia, bumpAutoResume]);

  const onPointerMove = useCallback((e) => {
    bumpAutoResume();
    if (!draggingRef.current || !startPosRef.current) return;
    const dx = e.clientX - startPosRef.current.x;
    const dy = e.clientY - startPosRef.current.y;
    if (!movedRef.current && dx * dx + dy * dy > 16) { movedRef.current = true; dismissHint(); }
    panRef.current.x = startPanRef.current.x + dx;
    panRef.current.y = startPanRef.current.y + dy;
    applyPan();

    const now = performance.now();
    const prev = lastSampleRef.current;
    if (prev) {
      const dt = now - prev.t;
      if (dt > 0) {
        const ivx = (e.clientX - prev.x) / dt;
        const ivy = (e.clientY - prev.y) / dt;
        if (dt > 100) {
          velRef.current = { vx: ivx, vy: ivy };
        } else {
          velRef.current.vx = velRef.current.vx * 0.6 + ivx * 0.4;
          velRef.current.vy = velRef.current.vy * 0.6 + ivy * 0.4;
        }
      }
    }
    lastSampleRef.current = { t: now, x: e.clientX, y: e.clientY };
  }, [bumpAutoResume, dismissHint, applyPan]);

  const onPointerUp = useCallback((e) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    const FRAME_MS = 1000 / 60;
    const avx = velRef.current.vx * FRAME_MS;
    const avy = velRef.current.vy * FRAME_MS;
    if (Math.abs(avx) > 0.5 || Math.abs(avy) > 0.5) startInertia(avx, avy);
    if (movedRef.current) lastDragEndAt.current = performance.now();
    bumpAutoResume();
    movedRef.current = false;
  }, [startInertia, bumpAutoResume]);

  const openSlug = useCallback((slug) => {
    if (slug) window.dispatchEvent(new CustomEvent('airline:open', { detail: { slug } }));
  }, []);

  const onTileClick = useCallback((e) => {
    if (movedRef.current || performance.now() - lastDragEndAt.current < 80) return;
    bumpAutoResume();
    openSlug(e.currentTarget.dataset.slug);
  }, [openSlug, bumpAutoResume]);

  const onTileKey = useCallback((e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openSlug(e.currentTarget.dataset.slug);
    }
  }, [openSlug]);

  const ALLIANCE_LABEL = {
    'star-alliance': isZh ? '星空聯盟' : 'Star Alliance',
    oneworld: isZh ? '寰宇一家' : 'oneworld',
    skyteam: isZh ? '天合聯盟' : 'SkyTeam',
  };

  // Build hex grid tiles: render 3×3 copies for infinite wrap
  const renderGrid = () => {
    const spacingX = cellSize * 1.15;
    const spacingY = cellSize * 1.0;
    const blockW = cols * spacingX;
    const blockH = rows * spacingY;
    const tiles = [];
    const seen = new Set();

    for (let by = -1; by <= 1; by++) {
      for (let bx = -1; bx <= 1; bx++) {
        const ox = bx * blockW;
        const oy = by * blockH;
        pattern.forEach((img, idx) => {
          const r = Math.floor(idx / cols);
          const c = idx % cols;
          const x = ox + c * spacingX + (r % 2 ? spacingX * 0.5 : 0);
          const y = oy + r * spacingY;
          const dup = seen.has(img.slug);
          if (img.slug) seen.add(img.slug);
          const meta = [img.iataCode, ALLIANCE_LABEL[img.alliance]].filter(Boolean).join(' · ');
          tiles.push(
            <div
              key={`${bx},${by},${idx}`}
              className="hc-tile"
              role="button"
              tabIndex={dup ? -1 : 0}
              data-slug={img.slug}
              data-name={img.name}
              data-meta={meta}
              aria-label={img.alt}
              aria-hidden={dup ? 'true' : undefined}
              onClick={onTileClick}
              onKeyDown={onTileKey}
              style={{
                position: 'absolute',
                left: `${x}px`,
                top: `${y}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
              }}
            >
              <div className="hc-tile__img">
                <img src={img.src} draggable={false} alt={dup ? '' : img.alt} loading="lazy" />
              </div>
            </div>
          );
        });
      }
    }
    return tiles;
  };

  return (
    <div ref={rootRef} className="hc-root" style={{ '--hc-cell': '80px' }}>
      <div
        className="hc-viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerOver={onTileOver}
        onPointerLeave={(e) => { hideCaption(); onPointerUp(e); }}
        onFocus={onTileOver}
        onBlur={hideCaption}
      >
        <div ref={gridRef} className="hc-grid" style={{ transform: 'translate(0px, 0px)' }}>
          {renderGrid()}
        </div>
        <div className="hc-fade hc-fade--left" />
        <div className="hc-fade hc-fade--right" />
        <div className="hc-fade hc-fade--top" />
        <div className="hc-fade hc-fade--bottom" />
      </div>
      <div ref={hintRef} className="airline-dome-hint" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M5 12l4-4M5 12l4 4M19 12l-4-4M19 12l-4 4"/></svg>
        <span>{isZh ? '拖曳探索 · 點擊查看' : 'Drag to explore · Tap to view'}</span>
      </div>
      <div ref={captionRef} className="airline-dome-caption" aria-hidden="true">
        <span className="airline-caption__name" />
        <span className="airline-caption__meta" />
      </div>
    </div>
  );
}
