import type maplibregl from 'maplibre-gl';
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

  // 統計數字滾動（尊重 reduced-motion）；與地圖無關，立即執行，不等 maplibre
  animateCounters(reduce);

  // maplibre-gl（＋其 CSS）體積不小，地圖初始化前使用者往往還在看上方的
  // 刊頭／核心票券／統計區。用 IntersectionObserver 在地圖容器接近視口
  // 前就先動態載入，讓下載與捲動時間重疊，同時不拖慢首屏。
  const panel = mapEl.closest<HTMLElement>('.trip-map-panel') ?? mapEl;
  let started = false;
  const startMapLoad = (): void => {
    if (started) return;
    started = true;
    observer.disconnect();
    void loadAndInitMap(data, mapEl, reduce);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) startMapLoad();
    },
    // 提早兩個視口高度預抓，讓下載時間與使用者捲動上方內容重疊
    { rootMargin: '200% 0px' },
  );
  observer.observe(panel);
}

async function loadAndInitMap(data: MapData, mapEl: HTMLElement, reduce: boolean): Promise<void> {
  const [{ default: maplibregl }] = await Promise.all([
    import('maplibre-gl'),
    import('maplibre-gl/dist/maplibre-gl.css'),
  ]);

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
    // 預設歸屬控制關閉，改於左下角自行加入 compact 版本（見下），
    // 收合成小 ⓘ 以最低調呈現 OSM 授權標示，同時避開右下角縮放鈕。
    attributionControl: false,
    cooperativeGestures: true,
  });
  map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
  // OSM／OpenFreeMap 授權標示為 ODbL 要求，保留但壓到最低調（compact 小 ⓘ）
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-left');

  // tile 載入失敗（沙箱 proxy 擋 tiles.openfreemap.org）不應中斷其餘功能
  const noteEl = document.getElementById('trip-map-note');
  map.on('error', () => {
    if (noteEl) noteEl.classList.add('is-visible');
  });

  // ── 自訂 DOM markers（常駐圓點＋名稱標籤）──────────────
  // 外層 div 由 MapLibre 控制定位；內層 .trip-marker 負責視覺與 is-day/is-active
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
    new maplibregl.Marker({ element: el, anchor: 'left' })
      .setLngLat([stop.coords.lng, stop.coords.lat])
      .addTo(map);
  }

  let activeDay: number | null = null;
  let activeStopKey: string | null = null;

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

  // ── 徽章／導覽 DOM ───────────────────────────────────
  const badgeEl = document.querySelector<HTMLElement>('.trip-map-badge');
  const badgeDayEl = document.querySelector<HTMLElement>('.trip-map-badge__day');
  const badgeTitleEl = document.querySelector<HTMLElement>('.trip-map-badge__title');
  const dayWord = badgeEl?.dataset.dayWord || 'Day';
  const navDots = Array.from(document.querySelectorAll<HTMLElement>('.trip-daynav__dot'));
  const stopEls = Array.from(document.querySelectorAll<HTMLElement>('.trip-stop'));

  const paintActiveRoute = (segs: Seg[]): void => {
    const src = map.getSource(SRC_ACTIVE) as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(toFeatures(segs));
  };

  // 標記某天全部景點（is-day）；清掉非當天者
  const markDay = (dayIds: Set<string>): void => {
    for (const [id, m] of markerByStop) m.classList.toggle('is-day', dayIds.has(id));
  };

  // ── 進入某一天：畫出當天所有路徑、標記當天所有景點、更新徽章/導覽 ──
  const activateDay = (dayNum: number): void => {
    if (activeDay === dayNum) return;
    activeDay = dayNum;
    const d = dayByNum.get(dayNum);
    if (!d) return;

    paintActiveRoute(d.segments);
    markDay(new Set(d.stopIds));

    if (badgeEl && badgeDayEl && badgeTitleEl) {
      badgeDayEl.textContent = `${dayWord} ${d.day}`;
      badgeTitleEl.textContent = d.title;
      badgeEl.classList.add('is-visible');
    }
    for (const dot of navDots) dot.classList.toggle('is-active', Number(dot.dataset.day) === dayNum);
  };

  // ── 聚焦單一景點：放大該點、flyTo、標亮對應條目 ──
  const focusStop = (stopId: string, dayNum: number, stopEl?: HTMLElement): void => {
    activateDay(dayNum);

    const key = `${dayNum}:${stopId}`;
    if (activeStopKey === key) return;
    activeStopKey = key;

    // marker：清掉舊 active，設新的（保留 is-day）
    for (const m of markerByStop.values()) m.classList.remove('is-active');
    const marker = markerByStop.get(stopId);
    marker?.classList.add('is-active');

    // 條目：標亮目前
    for (const el of stopEls) el.classList.remove('is-active');
    stopEl?.classList.add('is-active');

    const s = stopById.get(stopId);
    if (s) {
      move({
        center: [s.coords.lng, s.coords.lat],
        zoom: zoomForKind(s.kind),
        pitch: 46,
        bearing: (dayNum % 2 === 0 ? -1 : 1) * 16,
      });
    }
  };

  const resetDefault = (): void => {
    activeDay = null;
    activeStopKey = null;
    markDay(new Set());
    for (const m of markerByStop.values()) m.classList.remove('is-active');
    for (const el of stopEls) el.classList.remove('is-active');
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

  // ── ScrollTrigger：每一天畫路徑、每一景點聚焦 ─────────
  const daySections = Array.from(document.querySelectorAll<HTMLElement>('[data-trip-day]'));
  daySections.forEach((sec, i) => {
    const dayNum = Number(sec.dataset.tripDay);
    ScrollTrigger.create({
      trigger: sec,
      start: 'top 60%',
      end: 'bottom 40%',
      onEnter: () => activateDay(dayNum),
      onEnterBack: () => activateDay(dayNum),
      // 捲回第一天之前（回到刊頭/essentials）→ 全覽
      onLeaveBack: i === 0 ? resetDefault : undefined,
    });
  });

  stopEls.forEach((el) => {
    const stopId = el.dataset.tripStop;
    const dayNum = Number(el.dataset.day);
    if (!stopId || !Number.isFinite(dayNum)) return;
    ScrollTrigger.create({
      trigger: el,
      start: 'top 55%',
      end: 'bottom 45%',
      onEnter: () => focusStop(stopId, dayNum, el),
      onEnterBack: () => focusStop(stopId, dayNum, el),
    });
  });

  // ── Day 導覽點擊 → 平滑捲動 ──────────────────────────
  for (const dot of navDots) {
    dot.addEventListener('click', () => {
      const dayNum = Number(dot.dataset.day);
      const target = daySections.find((s) => Number(s.dataset.tripDay) === dayNum);
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  }

  // ── 點擊控制地圖：點景點條目 → 立即聚焦該點；點地圖標記 → 捲到對應條目 ──
  stopEls.forEach((el) => {
    const stopId = el.dataset.tripStop;
    const dayNum = Number(el.dataset.day);
    if (!stopId || !Number.isFinite(dayNum)) return;
    const go = (): void => focusStop(stopId, dayNum, el);
    el.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('a')) return; // 不攔截連結點擊
      go();
    });
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        go();
      }
    });
  });

  for (const [id, marker] of markerByStop) {
    marker.addEventListener('click', () => {
      const target = stopEls.find((el) => el.dataset.tripStop === id);
      target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    });
  }
}

function emptyFC(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
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
