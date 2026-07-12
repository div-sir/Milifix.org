/**
 * 旅行報告書資料模型。
 * 每篇報告書一個資料檔（如 japan-jr-pass-2026.ts），由 index.ts 註冊。
 * 頁面元件（TripReportPage）與地圖腳本（trip-report-client）皆以此為唯一合約。
 */

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** 單一停靠點：地圖標記與飛行目標 */
export interface TripStop {
  /** 全 trip 唯一 id（kebab-case，如 'yokohama-sta'） */
  id: string;
  name: string;
  coords: GeoPoint;
  kind?:
    | 'airport'
    | 'station'
    | 'sight'
    | 'shrine'
    | 'castle'
    | 'garden'
    | 'viewpoint'
    | 'facility'
    | 'area';
  /** 景點簡介：一句雜誌式描述（地點本身，非行程動作）。用於各景點條目與地圖 popup。 */
  desc?: string;
  /** trip 專屬提醒：在此地點要做的事（如「兌換啟用 JR Pass」），與 desc 區隔。 */
  note?: string;
  /** 該景點專屬照片；未填時條目不顯示照片（day.photos 仍作為當日影像帶）。 */
  photos?: PhotoSlot[];
}

/** 交通段：地圖上畫成路線 */
export interface TransportSegment {
  mode:
    | 'flight'
    | 'shinkansen'
    | 'night-train'
    | 'train'
    | 'tram'
    | 'monorail'
    | 'ferry'
    | 'bus'
    | 'walk';
  /** 顯示名稱，如「上越新幹線」「江之電」 */
  label: string;
  /** 起訖 stop id（可跨日引用其他天的 stop） */
  from: string;
  to: string;
  /** 選填：路徑塑形用的中繼座標。鐵路段以真實沿線車站描繪走廊，使線條貼合實際鐵道走向。 */
  viaCoords?: GeoPoint[];
  /** 選填：預估移動時間（分鐘），顯示於兩景點之間的轉乘標示。 */
  durationMin?: number;
}

export interface TimelineEntry {
  /** 如 '05:05'、'18:30'；純敘述時可省略 */
  time?: string;
  text: string;
}

export interface CostEntry {
  label: string;
  /** 日圓金額；無明確金額的項目可省略並寫進 note */
  amountJpy?: number;
  coveredByPass?: boolean;
  note?: string;
}

export interface LinkEntry {
  label: string;
  /** 尚未確定網址時可省略，前端渲染為純文字 */
  url?: string;
}

/** 照片欄位：src 未填時渲染 placeholder 框 */
export interface PhotoSlot {
  id: string;
  caption?: string;
  src?: string;
  alt?: string;
}

export interface TripDay {
  /** 行程天數編號（本篇從 Day 2 開始） */
  day: number;
  /** 如「橫濱與鎌倉海岸線」 */
  title: string;
  /** 地區標籤，如「關東」「山陽・瀨戶內」 */
  regionLabel?: string;
  /** 有序停靠點；地圖捲動至該日時 fitBounds / flyTo 這些點 */
  stops: TripStop[];
  /** 選填：覆寫該日地圖鏡頭 */
  camera?: {
    center?: GeoPoint;
    zoom?: number;
    pitch?: number;
    bearing?: number;
  };
  /** 交通段（怎麼去） */
  segments?: TransportSegment[];
  /** 去做什麼 */
  activities: string[];
  /** 時間節點 */
  timeline?: TimelineEntry[];
  /** 費用紀錄 */
  costs?: CostEntry[];
  /** 容易忽略的 */
  tips?: string[];
  /** 實用連結 */
  links?: LinkEntry[];
  /** 照片預留位 */
  photos?: PhotoSlot[];
}

/** 核心票券與實用工具 */
export interface TripEssential {
  title: string;
  desc?: string;
  links?: LinkEntry[];
}

export interface TripReport {
  /** URL slug，如 'japan-jr-pass-2026' */
  slug: string;
  title: string;
  subtitle?: string;
  country: string;
  year: number;
  /** 行程總天數（含未詳列的 Day 1） */
  durationDays: number;
  /** 列表頁與 meta description 用摘要 */
  summary: string;
  essentials: TripEssential[];
  days: TripDay[];
  /** 未捲入任何一天時的預設鏡頭（通常涵蓋全行程範圍） */
  mapDefault: { center: GeoPoint; zoom: number };
  /** 頁面呈現風格；未填時預設 'magazine'（現有雙欄雜誌版型）。
   *  'immersive' 為全螢幕地圖 + 浮動 HUD 的沈浸式捲動敘事版型。 */
  presentation?: 'magazine' | 'immersive';
}
