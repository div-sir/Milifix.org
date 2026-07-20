import type maplibregl from 'maplibre-gl';
import { gsap } from 'gsap';

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
  id: string;
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
  transportIcon: string;
  transportLabel: string;
}
interface MapData {
  mapDefault: { center: GeoPoint; zoom: number };
  allStops: Stop[];
  days: DayData[];
  anchors: AnchorData[];
}

const STYLE_URL: Record<'dark' | 'light', string> = {
  dark: 'https://tiles.openfreemap.org/styles/dark',
  light: 'https://tiles.openfreemap.org/styles/positron',
};
const SRC_ALL = 'immersive-route-all';
const SRC_ACTIVE = 'immersive-route-active';

function currentTheme(): 'dark' | 'light' {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

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

  let theme = currentTheme();
  const map = new maplibregl.Map({
    container: mapEl,
    style: STYLE_URL[theme],
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
  let activeDay: number | null = null;
  let activeShowRoute = false;
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
    activeShowRoute = showRoute;
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

  // style.load 於初次載入與每次 setStyle（主題切換）後皆會觸發：重新加回被清空的
  // sources/layers，並依當前作用中的日期重畫路線／當日標記（marker 為 DOM，
  // 其 class 於 setStyle 後仍保留，但路線 source 會被清空需重畫）。
  map.on('style.load', () => {
    addLayers();
    const d = activeDay != null ? dayByNum.get(activeDay) : undefined;
    paintActiveRoute(activeShowRoute && d ? d.segments : []);
    if (d) markDay(new Set(d.stopIds));
  });

  // ── HUD DOM ──────────────────────────────────────────
  const hudEl = document.getElementById('immersive-hud');
  const titleClusterEl = document.getElementById('immersive-hud-title-cluster');
  const tagEl = document.getElementById('immersive-hud-tag');
  const titleEl = document.getElementById('immersive-hud-title');
  const transportEl = document.getElementById('immersive-hud-transport');
  const transportIconEl = document.getElementById('immersive-hud-transport-icon');
  const transportLabelEl = document.getElementById('immersive-hud-transport-label');
  const descEl = document.getElementById('immersive-hud-desc');
  const noteBoxEl = document.getElementById('immersive-hud-note');
  const telemetryEl = document.getElementById('immersive-hud-telemetry');
  const liveEl = document.getElementById('immersive-live');
  const mobileRouteIndexEl = document.getElementById('immersive-route-index');
  const mobileRouteTitleEl = document.getElementById('immersive-route-title');
  const mobileRoutePrevEl = document.getElementById('immersive-route-prev') as HTMLButtonElement | null;
  const mobileRouteNextEl = document.getElementById('immersive-route-next') as HTMLButtonElement | null;
  const photoBoxEl = document.getElementById('immersive-hud-photo');
  const photoImgEl = document.getElementById('immersive-hud-img') as HTMLImageElement | null;
  const photoPlaceholderEl = document.getElementById('immersive-hud-placeholder');

  // ── 懸浮視差（分層）：HUD 文字（前景）位移最大，中層裝飾（刻度／準星／
  // 座標讀數）次之，深層裝飾（外框／四角括號）幾乎不動，疊出真正的縱深。
  // 都疊加在各自既有的定位方式之上（transform 供視差獨用；.immersive-ticks
  // 原本用 transform:translateX(-50%) 置中，改由 gsap xPercent:-50 設定，
  // 與 quickTo 的 x 位移在同一條 transform 上組合，不會互相覆寫）。
  if (!reduce && window.matchMedia('(pointer: fine)').matches) {
    const midEls = Array.from(document.querySelectorAll<HTMLElement>('.immersive-parallax-mid'));
    const deepEls = Array.from(document.querySelectorAll<HTMLElement>('.immersive-parallax-deep'));
    const ticksEl = document.querySelector<HTMLElement>('.immersive-ticks');
    if (ticksEl) gsap.set(ticksEl, { xPercent: -50 });
    if (deepEls.length > 0) gsap.set(deepEls, { transformPerspective: 1400, transformOrigin: 'center' });

    const layers: Array<{ els: HTMLElement[]; x: number; y: number }> = [
      { els: hudEl ? [hudEl] : [], x: 34, y: 22 },
      { els: midEls, x: 20, y: 13 },
      { els: deepEls, x: 8, y: 5 },
    ];
    const movers = layers
      .filter((l) => l.els.length > 0)
      .map((l) => ({
        x: gsap.quickTo(l.els, 'x', { duration: 0.9, ease: 'power3.out' }),
        y: gsap.quickTo(l.els, 'y', { duration: 0.9, ease: 'power3.out' }),
        magX: l.x,
        magY: l.y,
      }));
    // 深層裝飾（外框／四角括號）額外疊加輕微 3D 傾斜（非單純位移），
    // 讓整個場景隨游標像被「往裡看」一樣轉動，比純平移更有立體縱深感。
    const tilt =
      deepEls.length > 0
        ? {
            rx: gsap.quickTo(deepEls, 'rotationX', { duration: 0.9, ease: 'power3.out' }),
            ry: gsap.quickTo(deepEls, 'rotationY', { duration: 0.9, ease: 'power3.out' }),
          }
        : null;

    const resetParallax = (): void => {
      for (const m of movers) {
        m.x(0);
        m.y(0);
      }
      tilt?.ry(0);
      tilt?.rx(0);
    };

    window.addEventListener('mousemove', (e) => {
      if (window.innerWidth <= 640) {
        resetParallax();
        return;
      }
      const nx = e.clientX / window.innerWidth - 0.5;
      const ny = e.clientY / window.innerHeight - 0.5;
      for (const m of movers) {
        m.x(nx * m.magX * 2);
        m.y(ny * m.magY * 2);
      }
      tilt?.ry(nx * 10);
      tilt?.rx(ny * -10);
    });
    window.addEventListener('resize', () => {
      if (window.innerWidth <= 640) resetParallax();
    });
  }

  // ── 座標／相機讀數：隨鏡頭飛行的目的地即時更新（經緯度 + 縮放／方位／傾角）──
  const coordsEl = document.getElementById('immersive-coords');
  const camEl = document.getElementById('immersive-cam');
  const progressFillEl = document.getElementById('immersive-progress-fill');
  const progressCountEl = document.getElementById('immersive-progress-count');
  const progressDayEl = document.getElementById('immersive-progress-day');
  const progressStatusEl = document.getElementById('immersive-progress-status');
  const compassNeedleEl = document.getElementById('immersive-compass-needle');
  const compassBearingEl = document.getElementById('immersive-compass-bearing');
  const fmtCoord = (lat: number, lng: number): string =>
    `${Math.abs(lat).toFixed(4)}°${lat >= 0 ? 'N' : 'S'} ${Math.abs(lng).toFixed(4)}°${lng >= 0 ? 'E' : 'W'}`;
  const fmtCam = (zoom: number, bearing: number, pitch: number): string =>
    `ZOOM ${zoom.toFixed(1)} · BRG ${bearing >= 0 ? '+' : ''}${bearing.toFixed(0)}° · PITCH ${pitch.toFixed(0)}°`;

  const applyPos = (pos: AnchorData['pos']): void => {
    if (!hudEl) return;
    // 內容採固定的四區分散佈局，pos 只保留作為細微動態／除錯語意；
    // 不再把整組文字搬到同一角落，避免重新形成文字牆。
    hudEl.dataset.layout = pos;
  };

  const hudVector = (pos: AnchorData['pos']): { x: number; y: number } => ({
    'bottom-left': { x: -12, y: 9 },
    'bottom-right': { x: 12, y: 9 },
    'top-left': { x: -12, y: -9 },
    'top-right': { x: 12, y: -9 },
  })[pos];

  // ── HUD 內容切換動畫（GSAP）──────────────────────────────
  // 立即把新內容寫進 DOM（避免捲動快速切換時殘留舊資料），再由 GSAP
  // 時間軸播放「退場（舊內容淡出下沉）→ 寫入 → 進場（新內容錯落淡入）」。
  // 每次切換都先 kill 前一條時間軸；因寫入永遠用當下最新的錨點資料，
  // 即使中途被打斷也只會略過中間畫格、直接呈現最新內容，不會停在舊資料。
  const writeHudContent = (d: DOMStringMap): void => {
    if (tagEl) tagEl.textContent = d.tag || '';
    if (titleEl) titleEl.textContent = d.title || '';
    if (transportEl && transportIconEl && transportLabelEl) {
      if (d.transportLabel) {
        transportIconEl.textContent = d.transportIcon || '';
        transportLabelEl.textContent = d.transportLabel;
        transportEl.hidden = false;
      } else {
        transportEl.hidden = true;
      }
    }
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
      } else {
        // 沒有實際圖片時不顯示「空白照片卡」；裝飾不能冒充內容。
        photoImgEl.hidden = true;
        photoPlaceholderEl.hidden = false;
        photoBoxEl.hidden = true;
      }
    }
  };

  const hudAnimTargets = [photoBoxEl, titleClusterEl, transportEl, descEl, noteBoxEl, telemetryEl].filter(
    (el): el is HTMLElement => el != null
  );
  let hudTl: gsap.core.Timeline | null = null;
  let hudFirst = true;
  let currentHudLayout: AnchorData['pos'] = 'bottom-left';
  const swapHud = (d: DOMStringMap, nextLayout: AnchorData['pos']): void => {
    if (hudFirst || reduce) {
      // 首次（尚在讀取遮罩下，隨場景一起淡入）或減少動態：直接寫入定位
      applyPos(nextLayout);
      writeHudContent(d);
      gsap.set(hudAnimTargets, { clearProps: 'opacity,transform' });
      currentHudLayout = nextLayout;
      hudFirst = false;
      return;
    }
    hudTl?.kill();
    const exitVector = hudVector(currentHudLayout);
    const entryVector = hudVector(nextLayout);
    hudTl = gsap.timeline();
    // 退場與進場都沿著該構圖的來源方向；中途再次捲動時，GSAP 直接從
    // 當下畫面值接手，因此不必等待舊動畫結束，也不會跳回預設位置。
    hudTl.to(hudAnimTargets, {
      opacity: 0,
      x: exitVector.x,
      y: exitVector.y,
      duration: 0.16,
      ease: 'power2.in',
      overwrite: 'auto',
    });
    hudTl.add(() => {
      applyPos(nextLayout);
      writeHudContent(d);
      currentHudLayout = nextLayout;
    });
    hudTl.fromTo(
      hudAnimTargets,
      { opacity: 0, x: entryVector.x, y: entryVector.y },
      {
        opacity: 1,
        x: 0,
        y: 0,
        duration: 0.4,
        stagger: 0.04,
        ease: 'power3.out',
        onComplete: () => {
          gsap.set(hudAnimTargets, { clearProps: 'opacity,transform' });
        },
      }
    );
  };

  const dayNavDots = Array.from(document.querySelectorAll<HTMLElement>('.immersive-daynav__dot'));
  const anchorEls = Array.from(document.querySelectorAll<HTMLElement>('.immersive-anchor'));
  const anchorTotal = anchorEls.length;

  const scrollToAnchorAt = (index: number): void => {
    const target = anchorEls[Math.max(0, Math.min(anchorTotal - 1, index))];
    target?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
  };

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
  let activeAnchorEl: HTMLElement | null = null;
  const activate = (el: HTMLElement): void => {
    // 「與視窗中心最近」的判定每個 scroll rAF 都會重算一次，同一個錨點
    // 停留在中心附近時每次都會拿到同一個 el；沒有這道防呆的話，flyTo／
    // HUD 進退場動畫就會在使用者停止捲動後仍每一幀重播，造成閃爍與
    // 不必要的地圖鏡頭重置。
    if (el === activeAnchorEl) return;
    activeAnchorEl = el;
    const d = el.dataset;
    const camera = {
      center: [Number(d.lng), Number(d.lat)] as [number, number],
      zoom: Number(d.zoom),
      pitch: Number(d.pitch || 0),
      bearing: Number(d.bearing || 0),
    };
    if (reduce) map.jumpTo(camera);
    else map.flyTo({ ...camera, duration: 1700, curve: 1.4, essential: true });
    if (coordsEl) coordsEl.textContent = fmtCoord(camera.center[1], camera.center[0]);
    if (camEl) camEl.textContent = fmtCam(camera.zoom, camera.bearing, camera.pitch);

    const anchorIndex = Math.max(1, Number(d.index || '1'));
    const progress = anchorTotal > 1 ? ((anchorIndex - 1) / (anchorTotal - 1)) * 100 : 100;
    if (progressFillEl) progressFillEl.style.transform = `scaleX(${progress / 100})`;
    if (progressCountEl) {
      progressCountEl.textContent = `${String(anchorIndex).padStart(2, '0')} / ${String(anchorTotal).padStart(2, '0')}`;
    }
    if (mobileRouteIndexEl) {
      mobileRouteIndexEl.textContent = `${String(anchorIndex).padStart(2, '0')} / ${String(anchorTotal).padStart(2, '0')}`;
    }
    if (mobileRouteTitleEl) mobileRouteTitleEl.textContent = d.title || '';
    if (mobileRoutePrevEl) mobileRoutePrevEl.disabled = anchorIndex <= 1;
    if (mobileRouteNextEl) mobileRouteNextEl.disabled = anchorIndex >= anchorTotal;
    if (progressDayEl) {
      progressDayEl.textContent = d.day ? `DAY ${String(d.day).padStart(2, '0')}` : d.tag || 'OVERVIEW';
    }
    if (progressStatusEl) {
      progressStatusEl.textContent = d.dayIntro === '1' ? 'DAY ROUTE ACQUIRED' : d.transportLabel || 'MAP SYNCHRONIZED';
    }
    const normalizedBearing = ((camera.bearing % 360) + 360) % 360;
    if (compassBearingEl) compassBearingEl.textContent = `${String(Math.round(normalizedBearing)).padStart(3, '0')}°`;
    if (compassNeedleEl) {
      // 地圖向右旋轉時，北向指針反向旋轉，維持真實方位關係。
      compassNeedleEl.style.transform = `rotate(${-camera.bearing}deg)`;
    }

    swapHud(d, (d.pos as AnchorData['pos']) || 'bottom-left');

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

    for (const dot of dayNavDots) {
      const active = Number(dot.dataset.day) === dayNum;
      dot.classList.toggle('is-active', active);
      if (active) dot.setAttribute('aria-current', 'step');
      else dot.removeAttribute('aria-current');
    }

    if (liveEl) {
      liveEl.textContent = [d.tag, d.title, d.transportLabel].filter(Boolean).join('，');
    }
    if (d.anchorId && location.hash !== `#${encodeURIComponent(d.anchorId)}`) {
      history.replaceState(null, '', `${location.pathname}${location.search}#${encodeURIComponent(d.anchorId)}`);
    }
  };

  let initialAnchor = anchorEls[0];
  try {
    const requestedAnchorId = decodeURIComponent(location.hash.slice(1));
    initialAnchor = anchorEls.find((a) => a.dataset.anchorId === requestedAnchorId) ?? initialAnchor;
  } catch {
    // 無效 percent-encoding 不應阻擋報告載入，回到總覽即可。
  }
  if (initialAnchor) {
    activate(initialAnchor);
    if (initialAnchor !== anchorEls[0]) {
      requestAnimationFrame(() => initialAnchor.scrollIntoView({ behavior: 'auto', block: 'center' }));
    }
  }

  // ── 捲動 → 啟用錨點：改用「與視窗中心最近」精準判定 ──────────
  // 原本用 IntersectionObserver 搭配一條縮出來的中央帶（rootMargin），
  // entries.find 只取批次中「第一個」符合的 entry；快速捲動時同一批
  // 可能有多個 entry 同時觸發，取到的未必是真正離畫面中心最近、使用者
  // 視覺焦點所在的那個，且窄帶本身在極快速捲動（如觸控板慣性滑動）下
  // 可能整段被跳過，導致 HUD 卡在舊資料不更新。改為在每個 rAF 節流的
  // scroll 事件中，直接算出全部錨點裡「中點離視窗中心最近」的那一個
  // 再啟用，精準且不會有帶寬漏判的問題；錨點數量（數十個）逐一讀取
  // getBoundingClientRect 的成本可忽略。
  let scrollTicking = false;
  const pickClosestAnchor = (): void => {
    const centerY = window.innerHeight / 2;
    let best: HTMLElement | null = null;
    let bestDist = Infinity;
    for (const a of anchorEls) {
      const rect = a.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(mid - centerY);
      if (dist < bestDist) {
        bestDist = dist;
        best = a;
      }
    }
    if (best) activate(best);
  };
  const onScrollOrResize = (): void => {
    if (scrollTicking) return;
    scrollTicking = true;
    requestAnimationFrame(() => {
      pickClosestAnchor();
      scrollTicking = false;
    });
  };
  window.addEventListener('scroll', onScrollOrResize, { passive: true });
  window.addEventListener('resize', onScrollOrResize, { passive: true });

  mobileRoutePrevEl?.addEventListener('click', () => {
    const index = activeAnchorEl ? anchorEls.indexOf(activeAnchorEl) : 0;
    scrollToAnchorAt(index - 1);
  });
  mobileRouteNextEl?.addEventListener('click', () => {
    const index = activeAnchorEl ? anchorEls.indexOf(activeAnchorEl) : 0;
    scrollToAnchorAt(index + 1);
  });

  // 桌面用左右方向鍵前後切換場景；不攔截輸入欄位，也不改寫熟悉的上下捲動。
  window.addEventListener('keydown', (event) => {
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('input, textarea, select, button, a, [contenteditable="true"]')) return;
    const stageRect = document.querySelector<HTMLElement>('.immersive-stage')?.getBoundingClientRect();
    if (!stageRect || stageRect.bottom <= 0 || stageRect.top >= window.innerHeight) return;
    event.preventDefault();
    const index = activeAnchorEl ? anchorEls.indexOf(activeAnchorEl) : 0;
    scrollToAnchorAt(index + (event.key === 'ArrowRight' ? 1 : -1));
  });

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

  // ── 主題切換：監聽 html data-theme，切換深色／positron 淺色地圖底圖 ──
  // setStyle 會清空 sources/layers，於上方 style.load 事件重新加回並重畫當前路線。
  const themeObserver = new MutationObserver(() => {
    const next = currentTheme();
    if (next === theme) return;
    theme = next;
    map.setStyle(STYLE_URL[theme]);
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
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
      for (const t of ticks) {
        const active = t.stopId === stopId;
        t.el.classList.toggle('is-active', active);
        if (active) t.el.setAttribute('aria-current', 'step');
        else t.el.removeAttribute('aria-current');
      }
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
