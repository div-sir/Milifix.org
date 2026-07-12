import type maplibregl from 'maplibre-gl';

// ── 由 <script id="immersive-map-data"> 傳入的資料型別 ─────
interface GeoPoint {
  lat: number;
  lng: number;
}
interface Stop {
  id: string;
  name: string;
  coords: GeoPoint;
  kind?: string;
}
interface Seg {
  mode: string;
  from: string;
  to: string;
  viaCoords: GeoPoint[];
}
interface DayData {
  day: number;
  title: string;
  stopIds: string[];
  segments: Seg[];
}
interface AnchorData {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
  pos: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right';
  tag: string;
  title: string;
  desc: string;
  note: string;
  photo: string;
  photoAlt: string;
  day: string;
  dayIntro: string;
}
interface MapData {
  mapDefault: { center: GeoPoint; zoom: number };
  allStops: Stop[];
  days: DayData[];
  anchors: AnchorData[];
}

const STYLE_URL = 'https://tiles.openfreemap.org/styles/dark';
const SRC_ALL = 'immersive-route-all';
const SRC_ACTIVE = 'immersive-route-active';

const POS_STYLE: Record<
  AnchorData['pos'],
  { left: string; right: string; top: string; bottom: string; direction: string }
> = {
  'bottom-left': { left: '5vw', right: 'auto', top: 'auto', bottom: '9vh', direction: 'row' },
  'bottom-right': { left: 'auto', right: '5vw', top: 'auto', bottom: '9vh', direction: 'row-reverse' },
  'top-left': { left: '5vw', right: 'auto', top: '14vh', bottom: 'auto', direction: 'row' },
  'top-right': { left: 'auto', right: '5vw', top: '14vh', bottom: 'auto', direction: 'row-reverse' },
};

function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

// ── 工業風載入進度：分階段推進，真正 idle 才視為完成 ──────────
interface LoaderController {
  setStage: (pct: number) => void;
  complete: () => void;
}

function initLoader(reduce: boolean): LoaderController {
  const loaderEl = document.getElementById('immersive-loader');
  const fillEl = document.getElementById('immersive-loader-fill');
  const pctEl = document.getElementById('immersive-loader-pct');
  const mapColEl = document.querySelector<HTMLElement>('.immersive-map-col');

  let current = 0;
  let raf = 0;
  let done = false;

  const render = (target: number): void => {
    current = Math.max(current, Math.min(100, target));
    if (fillEl) fillEl.style.width = `${current}%`;
    if (pctEl) pctEl.textContent = String(Math.round(current));
  };

  const tweenTo = (target: number): void => {
    if (reduce) {
      render(target);
      return;
    }
    cancelAnimationFrame(raf);
    const start = current;
    const startTime = performance.now();
    const duration = 420;
    const step = (now: number): void => {
      const p = Math.min(1, (now - startTime) / duration);
      render(start + (target - start) * p);
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };

  return {
    setStage: tweenTo,
    complete: (): void => {
      if (done) return;
      done = true;
      tweenTo(100);
      window.setTimeout(
        () => {
          loaderEl?.classList.add('is-done');
          mapColEl?.classList.add('is-revealed');
        },
        reduce ? 0 : 340
      );
    },
  };
}

export function initTripReportImmersiveClient(): void {
  const dataEl = document.getElementById('immersive-map-data');
  const mapEl = document.getElementById('immersive-map');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const loader = initLoader(reduce);
  if (!dataEl || !mapEl) {
    loader.complete();
    return;
  }

  let data: MapData;
  try {
    data = JSON.parse(dataEl.textContent || '{}') as MapData;
  } catch {
    loader.complete();
    return;
  }
  if (!data.days || !data.allStops || !data.anchors) {
    loader.complete();
    return;
  }

  animateCounters(reduce);
  // 保底：若地圖引擎遲遲連 style 都無法就緒（如整段網路離線），
  // 最多等 4 秒強制進場，避免載入畫面卡死擋住整篇報告書；
  // 正常情況下 map 的 load 事件會提早觸發，不會等到這裡。
  window.setTimeout(() => loader.complete(), 4000);
  void loadAndInitMap(data, mapEl, reduce, loader);
}

async function loadAndInitMap(data: MapData, mapEl: HTMLElement, reduce: boolean, loader: LoaderController): Promise<void> {
  loader.setStage(15);
  const [{ default: maplibregl }] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);
  loader.setStage(45);

  const stopById = new Map<string, Stop>(data.allStops.map((s) => [s.id, s]));
  const dayByNum = new Map<number, DayData>(data.days.map((d) => [d.day, d]));

  const segCoords = (seg: Seg): number[][] | null => {
    const from = stopById.get(seg.from);
    const to = stopById.get(seg.to);
    if (!from || !to) return null;
    const pts: number[][] = [[from.coords.lng, from.coords.lat]];
    for (const v of seg.viaCoords ?? []) pts.push([v.lng, v.lat]);
    pts.push([to.coords.lng, to.coords.lat]);
    return pts;
  };

  const toFeatures = (segs: Seg[]): GeoJSON.FeatureCollection => {
    const features: GeoJSON.Feature[] = [];
    for (const seg of segs) {
      const coords = segCoords(seg);
      if (!coords) continue;
      features.push({
        type: 'Feature',
        properties: { night: seg.mode === 'night-train' },
        geometry: { type: 'LineString', coordinates: coords },
      });
    }
    return { type: 'FeatureCollection', features };
  };

  const allFeatures = toFeatures(data.days.flatMap((d) => d.segments));

  const map = new maplibregl.Map({
    container: mapEl,
    style: STYLE_URL,
    center: [data.mapDefault.center.lng, data.mapDefault.center.lat],
    zoom: data.mapDefault.zoom,
    pitch: 0,
    bearing: 0,
    attributionControl: false,
    // 此地圖完全由捲動驅動鏡頭，不開放手動拖曳／滾輪縮放，
    // 否則滾動頁面時會被地圖攔截滾輪事件，跳出「⌘/Ctrl+滾輪」提示。
    interactive: false,
  });
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

  const noteEl = document.querySelector<HTMLElement>('.immersive-scroll-hint');
  map.on('error', () => {
    // tile 載入失敗（本沙箱 proxy 擋 tiles.openfreemap.org，正式環境正常）
    // 不應中斷 HUD 文字／鏡頭邏輯，僅靜默略過視覺回饋。
    void noteEl;
  });

  // ── 常駐標記（沿用 trip-report.css 的 .trip-marker 樣式）───
  const markerByStop = new Map<string, HTMLElement>();
  for (const stop of data.allStops) {
    const el = document.createElement('div');
    const marker = document.createElement('div');
    marker.className = 'trip-marker';
    const dot = document.createElement('div');
    dot.className = 'trip-marker__dot';
    const label = document.createElement('div');
    label.className = 'trip-marker__label';
    label.textContent = stop.name;
    marker.append(dot, label);
    el.appendChild(marker);
    markerByStop.set(stop.id, marker);
    new maplibregl.Marker({ element: el, anchor: 'left' }).setLngLat([stop.coords.lng, stop.coords.lat]).addTo(map);
  }

  const addLayers = (): void => {
    if (map.getSource(SRC_ALL)) return;
    const muted = readVar('--trip-route-muted', 'rgba(150,150,150,0.35)');
    const accent = readVar('--accent', '#e2b565');

    map.addSource(SRC_ALL, { type: 'geojson', data: allFeatures });
    map.addSource(SRC_ACTIVE, { type: 'geojson', data: emptyFC() });

    map.addLayer({
      id: `${SRC_ALL}-solid`,
      type: 'line',
      source: SRC_ALL,
      filter: ['!=', ['get', 'night'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': muted, 'line-width': 2, 'line-opacity': 0.55 },
    });
    map.addLayer({
      id: `${SRC_ALL}-night`,
      type: 'line',
      source: SRC_ALL,
      filter: ['==', ['get', 'night'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': muted, 'line-width': 2, 'line-opacity': 0.5, 'line-dasharray': [1.5, 1.5] },
    });
    map.addLayer({
      id: `${SRC_ACTIVE}-solid`,
      type: 'line',
      source: SRC_ACTIVE,
      filter: ['!=', ['get', 'night'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': accent, 'line-width': 4, 'line-opacity': 0.95 },
    });
    map.addLayer({
      id: `${SRC_ACTIVE}-night`,
      type: 'line',
      source: SRC_ACTIVE,
      filter: ['==', ['get', 'night'], true],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': accent, 'line-width': 4, 'line-opacity': 0.9, 'line-dasharray': [1.5, 1.2] },
    });
  };
  map.on('load', () => {
    addLayers();
    loader.setStage(90);
    // 用 load（樣式與圖層就緒）而非 idle（等所有圖磚請求全部落地）
    // 當完成訊號：圖磚仍會在畫面上漸進載入，屬正常網頁地圖體驗，
    // 不需要讓使用者對著讀取畫面多等圖磚全部到齊。
    loader.complete();
  });
  map.on('style.load', addLayers);

  let activeDay: number | null = null;
  const paintActiveRoute = (segs: Seg[]): void => {
    const src = map.getSource(SRC_ACTIVE) as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(toFeatures(segs));
  };
  const markDay = (dayIds: Set<string>): void => {
    for (const [id, m] of markerByStop) m.classList.toggle('is-day', dayIds.has(id));
  };
  // 粗金色路線只在「當日概覽」鏡頭（低傾角、可看到整段路線）畫出；
  // 貼近單一停靠點時（高 zoom、低傾角仍會朝地平線拉伸）改為隱藏，
  // 避免長距離路段在透視下被拉成貫穿畫面的尖刺。
  const activateDay = (dayNum: number | null, showRoute: boolean): void => {
    if (activeDay === dayNum) {
      paintActiveRoute(showRoute ? (dayByNum.get(dayNum ?? -1)?.segments ?? []) : []);
      return;
    }
    activeDay = dayNum;
    if (dayNum == null) {
      paintActiveRoute([]);
      markDay(new Set());
      return;
    }
    const d = dayByNum.get(dayNum);
    if (!d) return;
    paintActiveRoute(showRoute ? d.segments : []);
    markDay(new Set(d.stopIds));
  };

  // ── HUD DOM ──────────────────────────────────────────
  const hudEl = document.getElementById('immersive-hud');
  const tagEl = document.getElementById('immersive-hud-tag');
  const titleEl = document.getElementById('immersive-hud-title');
  const descEl = document.getElementById('immersive-hud-desc');
  const noteBoxEl = document.getElementById('immersive-hud-note');
  const photoBoxEl = document.getElementById('immersive-hud-photo');
  const photoImgEl = document.getElementById('immersive-hud-img') as HTMLImageElement | null;
  const photoPlaceholderEl = document.getElementById('immersive-hud-placeholder');

  const applyPos = (pos: AnchorData['pos']): void => {
    if (!hudEl) return;
    const p = POS_STYLE[pos] ?? POS_STYLE['bottom-left'];
    hudEl.style.left = p.left;
    hudEl.style.right = p.right;
    hudEl.style.top = p.top;
    hudEl.style.bottom = p.bottom;
    hudEl.style.flexDirection = p.direction;
    hudEl.dataset.align = p.direction === 'row-reverse' ? 'right' : 'left';
  };

  const dayNavDots = Array.from(document.querySelectorAll<HTMLElement>('.immersive-daynav__dot'));
  const anchorEls = Array.from(document.querySelectorAll<HTMLElement>('.immersive-anchor'));

  const jumpToStopId = (stopId: string): void => {
    const target = anchorEls.find((a) => {
      if (a.dataset.dayIntro === '1') return false;
      const s = stopById.get(stopId);
      if (!s) return false;
      return (
        Math.abs(Number(a.dataset.lng) - s.coords.lng) < 1e-4 && Math.abs(Number(a.dataset.lat) - s.coords.lat) < 1e-4
      );
    });
    target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  };

  const ruler = initDayRuler(dayByNum, stopById, jumpToStopId);

  let activeStopId: string | null = null;
  const activate = (el: HTMLElement): void => {
    const d = el.dataset;
    const camera = {
      center: [Number(d.lng), Number(d.lat)] as [number, number],
      zoom: Number(d.zoom),
      pitch: Number(d.pitch || 0),
      bearing: Number(d.bearing || 0),
    };
    if (reduce) map.jumpTo(camera);
    else map.flyTo({ ...camera, duration: 1700, curve: 1.4, essential: true });

    applyPos((d.pos as AnchorData['pos']) || 'bottom-left');
    if (tagEl) tagEl.textContent = d.tag || '';
    if (titleEl) titleEl.textContent = d.title || '';
    if (descEl) descEl.textContent = d.desc || '';
    if (noteBoxEl) {
      if (d.note) {
        noteBoxEl.textContent = '▸ ' + d.note;
        noteBoxEl.hidden = false;
      } else {
        noteBoxEl.hidden = true;
      }
    }

    if (photoBoxEl && photoImgEl && photoPlaceholderEl) {
      if (d.photo) {
        photoImgEl.src = d.photo;
        photoImgEl.alt = d.photoAlt || d.title || '';
        photoImgEl.hidden = false;
        photoPlaceholderEl.hidden = true;
        photoBoxEl.hidden = false;
      } else if (!d.dayIntro && d.title) {
        // 停靠點但無真實照片：顯示佔位圖示，維持版面節奏
        photoImgEl.hidden = true;
        photoPlaceholderEl.hidden = false;
        photoBoxEl.hidden = false;
      } else {
        photoBoxEl.hidden = true;
      }
    }

    const dayNum = d.day ? Number(d.day) : null;
    const isDayIntro = d.dayIntro === '1';
    activateDay(Number.isFinite(dayNum) ? dayNum : null, isDayIntro);
    ruler.rebuild(Number.isFinite(dayNum) ? dayNum : null);

    for (const m of markerByStop.values()) m.classList.remove('is-active');
    if (!isDayIntro) {
      const matchedStop = data.allStops.find(
        (s) => Math.abs(s.coords.lng - camera.center[0]) < 1e-4 && Math.abs(s.coords.lat - camera.center[1]) < 1e-4
      );
      if (matchedStop) {
        markerByStop.get(matchedStop.id)?.classList.add('is-active');
        activeStopId = matchedStop.id;
      }
    } else {
      activeStopId = null;
    }
    ruler.markActive(activeStopId);

    for (const dot of dayNavDots) dot.classList.toggle('is-active', Number(dot.dataset.day) === dayNum);
  };

  if (anchorEls.length > 0) activate(anchorEls[0]);

  const observer = new IntersectionObserver(
    (entries) => {
      const hit = entries.find((e) => e.isIntersecting);
      if (hit) activate(hit.target as HTMLElement);
    },
    { root: null, rootMargin: '-45% 0px -45% 0px', threshold: 0 }
  );
  anchorEls.forEach((a) => observer.observe(a));

  // ── Day 導覽：跳到該日的日概覽錨點 ─────────────────────
  for (const dot of dayNavDots) {
    dot.addEventListener('click', () => {
      const dayNum = dot.dataset.day;
      const target = anchorEls.find((a) => a.dataset.day === dayNum && a.dataset.dayIntro === '1');
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }

  for (const [id, marker] of markerByStop) {
    marker.addEventListener('click', () => jumpToStopId(id));
  }
}

// ── 左側當日行程刻度尺：僅列出目前所在日的停靠點；hover 時浮動
//    標籤隨游標 Y 位置移動，點擊任一刻度／軌道即跳到最近的停靠點。
interface DayRulerController {
  rebuild: (dayNum: number | null) => void;
  markActive: (stopId: string | null) => void;
}

function initDayRuler(
  dayByNum: Map<number, DayData>,
  stopById: Map<string, Stop>,
  jumpToStopId: (stopId: string) => void
): DayRulerController {
  const rulerEl = document.getElementById('immersive-day-ruler');
  const trackEl = document.getElementById('immersive-day-ruler-track');
  const dayLabelEl = document.getElementById('immersive-day-ruler-daylabel');
  const cursorEl = document.getElementById('immersive-day-ruler-cursor');
  const cursorNameEl = document.getElementById('immersive-day-ruler-cursor-name');
  if (!rulerEl || !trackEl || !dayLabelEl || !cursorEl || !cursorNameEl) {
    return { rebuild: () => {}, markActive: () => {} };
  }

  let ticks: Array<{ el: HTMLButtonElement; stopId: string; pct: number }> = [];
  let currentDay: number | null = null;

  const nearestTick = (relYPct: number) => {
    let best = ticks[0];
    let bestDist = Infinity;
    for (const t of ticks) {
      const dist = Math.abs(t.pct - relYPct);
      if (dist < bestDist) {
        bestDist = dist;
        best = t;
      }
    }
    return best;
  };

  const rebuild = (dayNum: number | null): void => {
    if (dayNum === currentDay) return;
    currentDay = dayNum;
    trackEl.innerHTML = '';
    ticks = [];
    const d = dayNum != null ? dayByNum.get(dayNum) : undefined;
    if (!d || d.stopIds.length === 0) {
      rulerEl.classList.remove('is-visible');
      return;
    }
    rulerEl.classList.add('is-visible');
    dayLabelEl.textContent = `DAY ${String(dayNum).padStart(2, '0')}`;
    const n = d.stopIds.length;
    d.stopIds.forEach((stopId, i) => {
      const pct = n === 1 ? 50 : (i / (n - 1)) * 100;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'immersive-day-ruler__tick';
      btn.style.top = `${pct}%`;
      btn.setAttribute('aria-label', stopById.get(stopId)?.name || '');
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        jumpToStopId(stopId);
      });
      trackEl.appendChild(btn);
      ticks.push({ el: btn, stopId, pct });
    });
  };

  trackEl.addEventListener('mousemove', (e) => {
    if (ticks.length === 0) return;
    const rect = trackEl.getBoundingClientRect();
    const relY = rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * 100 : 0;
    const nearest = nearestTick(relY);
    for (const t of ticks) t.el.classList.toggle('is-near', t === nearest);
    cursorNameEl.textContent = stopById.get(nearest.stopId)?.name || '';
    cursorEl.style.top = `${Math.max(0, Math.min(rect.height, e.clientY - rect.top))}px`;
    cursorEl.hidden = false;
  });
  trackEl.addEventListener('mouseleave', () => {
    cursorEl.hidden = true;
    for (const t of ticks) t.el.classList.remove('is-near');
  });
  trackEl.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.immersive-day-ruler__tick')) return;
    if (ticks.length === 0) return;
    const rect = trackEl.getBoundingClientRect();
    const relY = rect.height > 0 ? ((e.clientY - rect.top) / rect.height) * 100 : 0;
    jumpToStopId(nearestTick(relY).stopId);
  });

  return {
    rebuild,
    markActive: (stopId: string | null): void => {
      for (const t of ticks) t.el.classList.toggle('is-active', t.stopId === stopId);
    },
  };
}

function animateCounters(reduce: boolean): void {
  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-count-to]'));
  for (const el of els) {
    const target = Number(el.dataset.countTo || '0');
    if (!Number.isFinite(target)) continue;
    if (reduce) {
      el.textContent = formatCount(target);
      continue;
    }
    const duration = 1400;
    const start = performance.now();
    const step = (now: number): void => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = formatCount(Math.round(target * eased));
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = formatCount(target);
    };
    requestAnimationFrame(step);
  }
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US');
}
