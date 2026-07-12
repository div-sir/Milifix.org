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

export function initTripReportImmersiveClient(): void {
  const dataEl = document.getElementById('immersive-map-data');
  const mapEl = document.getElementById('immersive-map');
  if (!dataEl || !mapEl) return;

  let data: MapData;
  try {
    data = JSON.parse(dataEl.textContent || '{}') as MapData;
  } catch {
    return;
  }
  if (!data.days || !data.allStops || !data.anchors) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  animateCounters(reduce);
  void loadAndInitMap(data, mapEl, reduce);
}

async function loadAndInitMap(data: MapData, mapEl: HTMLElement, reduce: boolean): Promise<void> {
  const [{ default: maplibregl }] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);

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
  map.on('load', addLayers);
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
    activateDay(Number.isFinite(dayNum) ? dayNum : null, d.dayIntro === '1');

    for (const m of markerByStop.values()) m.classList.remove('is-active');
    if (!d.dayIntro) {
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
    void activeStopId;

    for (const dot of dayNavDots) dot.classList.toggle('is-active', Number(dot.dataset.day) === dayNum);
  };

  const anchorEls = Array.from(document.querySelectorAll<HTMLElement>('.immersive-anchor'));
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
    marker.addEventListener('click', () => {
      const target = anchorEls.find((a) => {
        if (a.dataset.dayIntro === '1') return false;
        const s = stopById.get(id);
        if (!s) return false;
        return (
          Math.abs(Number(a.dataset.lng) - s.coords.lng) < 1e-4 && Math.abs(Number(a.dataset.lat) - s.coords.lat) < 1e-4
        );
      });
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }
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
