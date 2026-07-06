import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// ── 由 <script id="trip-map-data"> 傳入的資料型別 ──────────
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
interface Cam {
  center?: GeoPoint;
  zoom?: number;
  pitch?: number;
  bearing?: number;
}
interface DayData {
  day: number;
  title: string;
  stopIds: string[];
  segments: Seg[];
  camera: Cam | null;
}
interface MapData {
  mapDefault: { center: GeoPoint; zoom: number };
  allStops: Stop[];
  days: DayData[];
}

const STYLE_URL: Record<'dark' | 'light', string> = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};

const SRC_ALL = 'trip-route-all';
const SRC_ACTIVE = 'trip-route-active';

function currentTheme(): 'dark' | 'light' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function readVar(name: string, fallback: string): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

function zoomForKind(kind?: string): number {
  switch (kind) {
    case 'airport':
    case 'area':
      return 11;
    case 'station':
    case 'facility':
      return 12;
    case 'sight':
    case 'shrine':
    case 'castle':
    case 'garden':
    case 'viewpoint':
      return 13;
    default:
      return 12;
  }
}

export function initTripReportClient(): void {
  const dataEl = document.getElementById('trip-map-data');
  const mapEl = document.getElementById('trip-map');
  if (!dataEl || !mapEl) return;

  let data: MapData;
  try {
    data = JSON.parse(dataEl.textContent || '{}') as MapData;
  } catch {
    return;
  }
  if (!data.days || !data.allStops) return;

  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 統計數字滾動（尊重 reduced-motion）
  animateCounters(reduce);

  gsap.registerPlugin(ScrollTrigger);

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

  const allSegments = data.days.flatMap((d) => d.segments);
  const allFeatures = toFeatures(allSegments);

  // ── 建立地圖 ──────────────────────────────────────────
  let theme = currentTheme();
  const map = new maplibregl.Map({
    container: mapEl,
    style: STYLE_URL[theme],
    center: [data.mapDefault.center.lng, data.mapDefault.center.lat],
    zoom: data.mapDefault.zoom,
    pitch: 0,
    bearing: 0,
    attributionControl: { compact: true },
    cooperativeGestures: true,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

  // tile 載入失敗（沙箱 proxy 擋 tiles.openfreemap.org）不應中斷其餘功能
  const noteEl = document.getElementById('trip-map-note');
  map.on('error', () => {
    if (noteEl) noteEl.classList.add('is-visible');
  });

  // ── 自訂 DOM markers（脈衝動畫）──────────────────────
  const dotByStop = new Map<string, HTMLElement>();
  for (const stop of data.allStops) {
    const el = document.createElement('div');
    const dot = document.createElement('div');
    dot.className = 'trip-marker';
    el.appendChild(dot);
    dotByStop.set(stop.id, dot);
    const marker = new maplibregl.Marker({ element: el, anchor: 'center' }).setLngLat([
      stop.coords.lng,
      stop.coords.lat,
    ]);
    if (!reduce) marker.setPopup(new maplibregl.Popup({ offset: 16, closeButton: false }).setText(stop.name));
    marker.addTo(map);
  }

  let activeDay: number | null = null;

  // ── 路線 source/layer（每次 style.load 重新加回）────────
  const addLayers = (): void => {
    if (map.getSource(SRC_ALL)) return;
    const muted = readVar('--trip-route-muted', 'rgba(150,150,150,0.35)');
    const accent = readVar('--accent', '#e2b565');

    map.addSource(SRC_ALL, { type: 'geojson', data: allFeatures });
    map.addSource(SRC_ACTIVE, {
      type: 'geojson',
      data: activeDay != null ? toFeatures(dayByNum.get(activeDay)?.segments ?? []) : emptyFC(),
    });

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
  // setStyle 後 sources/layers 被清空，於 style.load 重新加回
  map.on('style.load', addLayers);

  // ── 主題切換：監聽 html data-theme ───────────────────
  const themeObserver = new MutationObserver(() => {
    const next = currentTheme();
    if (next === theme) return;
    theme = next;
    map.setStyle(STYLE_URL[theme]);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // ── 鏡頭移動 ─────────────────────────────────────────
  const move = (opts: {
    center: [number, number];
    zoom: number;
    pitch?: number;
    bearing?: number;
  }): void => {
    const camera = { pitch: 0, bearing: 0, ...opts };
    if (reduce) {
      map.jumpTo(camera);
    } else {
      map.flyTo({ ...camera, duration: 2200, curve: 1.5, speed: 0.7, essential: true });
    }
  };

  const flyToDay = (d: DayData): void => {
    const stops = d.stopIds.map((id) => stopById.get(id)).filter((s): s is Stop => !!s);

    if (d.camera?.center) {
      move({
        center: [d.camera.center.lng, d.camera.center.lat],
        zoom: d.camera.zoom ?? 12,
        pitch: d.camera.pitch ?? 45,
        bearing: d.camera.bearing ?? 0,
      });
      return;
    }
    if (stops.length === 0) return;
    if (stops.length === 1) {
      const s = stops[0];
      move({
        center: [s.coords.lng, s.coords.lat],
        zoom: zoomForKind(s.kind),
        pitch: 45,
        bearing: (d.day % 2 === 0 ? -1 : 1) * 18,
      });
      return;
    }
    // 多點 → 依 bounds 求鏡頭，再帶 pitch 電影感
    const bounds = new maplibregl.LngLatBounds();
    for (const s of stops) bounds.extend([s.coords.lng, s.coords.lat]);
    const cam = map.cameraForBounds(bounds, { padding: boundsPadding(), maxZoom: 12 });
    if (cam && cam.center) {
      const c = maplibregl.LngLat.convert(cam.center);
      move({ center: [c.lng, c.lat], zoom: cam.zoom ?? 11, pitch: 40, bearing: cam.bearing ?? 0 });
    }
  };

  // ── 啟用某一天 ───────────────────────────────────────
  const badgeEl = document.querySelector<HTMLElement>('.trip-map-badge');
  const badgeDayEl = document.querySelector<HTMLElement>('.trip-map-badge__day');
  const badgeTitleEl = document.querySelector<HTMLElement>('.trip-map-badge__title');
  const dayWord = badgeEl?.dataset.dayWord || 'Day';
  const navDots = Array.from(document.querySelectorAll<HTMLElement>('.trip-daynav__dot'));

  const paintActiveRoute = (segs: Seg[]): void => {
    const src = map.getSource(SRC_ACTIVE) as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(toFeatures(segs));
  };

  const setMarkers = (activeIds: Set<string>): void => {
    for (const [id, dot] of dotByStop) dot.classList.toggle('is-active', activeIds.has(id));
  };

  const activate = (dayNum: number): void => {
    if (activeDay === dayNum) return;
    activeDay = dayNum;
    const d = dayByNum.get(dayNum);
    if (!d) return;

    setMarkers(new Set(d.stopIds));
    paintActiveRoute(d.segments);

    if (badgeEl && badgeDayEl && badgeTitleEl) {
      badgeDayEl.textContent = `${dayWord} ${d.day}`;
      badgeTitleEl.textContent = d.title;
      badgeEl.classList.add('is-visible');
    }
    for (const dot of navDots) dot.classList.toggle('is-active', Number(dot.dataset.day) === dayNum);

    flyToDay(d);
  };

  const resetDefault = (): void => {
    activeDay = null;
    setMarkers(new Set());
    paintActiveRoute([]);
    badgeEl?.classList.remove('is-visible');
    for (const dot of navDots) dot.classList.remove('is-active');
    move({
      center: [data.mapDefault.center.lng, data.mapDefault.center.lat],
      zoom: data.mapDefault.zoom,
      pitch: 0,
      bearing: 0,
    });
  };

  // ── ScrollTrigger 同步 ───────────────────────────────
  const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-trip-day]'));
  sections.forEach((sec, i) => {
    const dayNum = Number(sec.dataset.tripDay);
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => activate(dayNum),
      onEnterBack: () => activate(dayNum),
      // 捲回第一天之前（回到 hero/essentials）→ 全覽
      onLeaveBack: i === 0 ? resetDefault : undefined,
    });
  });

  // ── Day 導覽點擊 → 平滑捲動 ──────────────────────────
  for (const dot of navDots) {
    dot.addEventListener('click', () => {
      const dayNum = Number(dot.dataset.day);
      const target = sections.find((s) => Number(s.dataset.tripDay) === dayNum);
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}

function boundsPadding(): number {
  return window.innerWidth < 900 ? 48 : 90;
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
