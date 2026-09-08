import type { Lang } from './types';
import type { DayLabels } from '../data/trips/types';

/** 兩種行程報告版型共用的介面字串（沈浸式與一般版）。 */
export interface TripReportLabels extends DayLabels {
  reportTag: string;
  essentials: string;
  back: string;
  statDays: string;
  statStops: string;
  statCost: string;
  dayNavAria: string;
  mapTitle: string;
  tileNote: string;
  lightboxClose: string;
  lightboxPrev: string;
  lightboxNext: string;
  /** 統計列：已列出的額外費用合計 */
  statCostLogged: string;
  /** 條列串接時的分隔符（中文用全形分號） */
  listSep: string;
}

/** 僅沈浸式版型用到的字串，含需要傳給客戶端腳本的動態訊息。 */
export interface ImmersiveLabels {
  detailLabel: string;
  routeNavAria: string;
  routePrev: string;
  routeNext: string;
  resumeTitle: string;
  resumeContinue: string;
  resumeDismiss: string;
  focusOn: string;
  focusOff: string;
  focusOnStatus: string;
  focusOffStatus: string;
  shareScene: string;
  shareOk: string;
  shareFail: string;
  resumeDone: string;
  restartDone: string;
  boardStops: string;
  boardMoving: string;
  boardWindow: string;
  boardCost: string;
  routeArrive: string;
  routeDepart: string;
  passExtra: string;
  /** 核心票券錨點的標籤（比頁面標題短） */
  essentialsTag: string;
}

const KIND_ZH: DayLabels['kindLabels'] = {
  airport: '機場',
  station: '車站',
  sight: '名勝',
  shrine: '神社',
  castle: '城郭',
  garden: '庭園',
  viewpoint: '展望',
  facility: '設施',
  area: '地區',
};
const KIND_EN: DayLabels['kindLabels'] = {
  airport: 'Airport',
  station: 'Station',
  sight: 'Landmark',
  shrine: 'Shrine',
  castle: 'Castle',
  garden: 'Garden',
  viewpoint: 'Viewpoint',
  facility: 'Facility',
  area: 'Area',
};
const KIND_JA: DayLabels['kindLabels'] = {
  airport: '空港',
  station: '駅',
  sight: '名所',
  shrine: '神社',
  castle: '城郭',
  garden: '庭園',
  viewpoint: '展望',
  facility: '施設',
  area: 'エリア',
};

export const TRIP_REPORT_LABELS: Record<Lang, TripReportLabels> = {
  zh: {
    reportTag: '旅行報告書',
    essentials: '核心票券與工具',
    back: '← 返回報告書列表',
    statDays: '天數',
    statStops: '停靠點',
    statCost: '費用合計',
    dayNavAria: '每日行程導覽',
    mapTitle: '行程地圖',
    tileNote: '地圖圖磚載入受阻（正式環境正常）',
    lightboxClose: '關閉',
    lightboxPrev: '上一張',
    lightboxNext: '下一張',
    statCostLogged: '已列額外費用',
    listSep: '；',
    dayWord: 'Day',
    timeline: '時間節點',
    activities: '行程',
    costs: '費用紀錄',
    tips: '容易忽略的',
    links: '實用連結',
    photos: '影像',
    passBadge: 'PASS',
    stopsHeading: '沿途景點',
    dossier: '行程手記',
    kindLabels: KIND_ZH,
  },
  en: {
    reportTag: 'Trip Report',
    essentials: 'Essential Passes & Tools',
    back: '← Back to all reports',
    statDays: 'Days',
    statStops: 'Stops',
    statCost: 'Total cost',
    dayNavAria: 'Daily itinerary navigation',
    mapTitle: 'Itinerary map',
    tileNote: 'Map tiles blocked here (fine in production)',
    lightboxClose: 'Close',
    lightboxPrev: 'Previous',
    lightboxNext: 'Next',
    statCostLogged: 'Logged extra cost',
    listSep: '; ',
    dayWord: 'Day',
    timeline: 'Timeline',
    activities: 'What to do',
    costs: 'Costs',
    tips: 'Easy to miss',
    links: 'Useful links',
    photos: 'Photos',
    passBadge: 'PASS',
    stopsHeading: 'Along the way',
    dossier: 'Field notes',
    kindLabels: KIND_EN,
  },
  ja: {
    reportTag: '旅行レポート',
    essentials: '主なパスとツール',
    back: '← レポート一覧へ戻る',
    statDays: '日数',
    statStops: '立ち寄り地',
    statCost: '費用合計',
    dayNavAria: '日程ナビゲーション',
    mapTitle: '行程マップ',
    tileNote: '地図タイルの読み込みがブロックされています（本番環境では正常）',
    lightboxClose: '閉じる',
    lightboxPrev: '前の写真',
    lightboxNext: '次の写真',
    statCostLogged: '記載の追加費用',
    listSep: '、',
    dayWord: 'Day',
    timeline: 'タイムライン',
    activities: '行程',
    costs: '費用の記録',
    tips: '見落としやすい点',
    links: '便利なリンク',
    photos: '写真',
    passBadge: 'PASS',
    stopsHeading: '沿線の見どころ',
    dossier: '旅のメモ',
    kindLabels: KIND_JA,
  },
};

export const IMMERSIVE_LABELS: Record<Lang, ImmersiveLabels> = {
  zh: {
    detailLabel: '詳細行程資料',
    routeNavAria: '行程停靠點導覽',
    routePrev: '上一個行程場景',
    routeNext: '下一個行程場景',
    resumeTitle: '繼續上次的閱讀進度？',
    resumeContinue: '繼續閱讀',
    resumeDismiss: '從頭開始',
    focusOn: '開啟專注閱讀模式',
    focusOff: '關閉專注閱讀模式',
    focusOnStatus: '專注閱讀模式已開啟',
    focusOffStatus: '專注閱讀模式已關閉',
    shareScene: '複製目前場景連結',
    shareOk: '已複製目前場景連結',
    shareFail: '無法複製，請手動複製網址',
    resumeDone: '已回到上次閱讀的場景',
    restartDone: '已從行程總覽開始',
    boardStops: '停靠點',
    boardMoving: '移動時間',
    boardWindow: '時間窗',
    boardCost: '已列費用',
    routeArrive: '抵達路徑',
    routeDepart: '接下來的路徑',
    passExtra: '另付費',
    essentialsTag: '核心票券',
  },
  en: {
    detailLabel: 'Full itinerary',
    routeNavAria: 'Itinerary stop navigation',
    routePrev: 'Previous scene',
    routeNext: 'Next scene',
    resumeTitle: 'Pick up where you left off?',
    resumeContinue: 'Continue',
    resumeDismiss: 'Start over',
    focusOn: 'Enter focus mode',
    focusOff: 'Exit focus mode',
    focusOnStatus: 'Focus mode on',
    focusOffStatus: 'Focus mode off',
    shareScene: 'Copy link to this scene',
    shareOk: 'Scene link copied',
    shareFail: 'Copy failed — please copy the URL manually',
    resumeDone: 'Returned to your last scene',
    restartDone: 'Started from the overview',
    boardStops: 'Stops',
    boardMoving: 'Travel time',
    boardWindow: 'Time window',
    boardCost: 'Logged cost',
    routeArrive: 'Arrival leg',
    routeDepart: 'Next leg',
    passExtra: 'Not covered',
    essentialsTag: 'Key passes',
  },
  ja: {
    detailLabel: '詳細行程データ',
    routeNavAria: '立ち寄り地ナビゲーション',
    routePrev: '前のシーン',
    routeNext: '次のシーン',
    resumeTitle: '前回の続きから読みますか？',
    resumeContinue: '続きから',
    resumeDismiss: '最初から',
    focusOn: '集中読書モードを開く',
    focusOff: '集中読書モードを閉じる',
    focusOnStatus: '集中読書モードをオンにしました',
    focusOffStatus: '集中読書モードをオフにしました',
    shareScene: '現在のシーンのリンクをコピー',
    shareOk: '現在のシーンのリンクをコピーしました',
    shareFail: 'コピーできません。URL を手動でコピーしてください',
    resumeDone: '前回のシーンに戻りました',
    restartDone: '行程の概要から始めました',
    boardStops: '立ち寄り地',
    boardMoving: '移動時間',
    boardWindow: '時間帯',
    boardCost: '記載の費用',
    routeArrive: '到着ルート',
    routeDepart: '次のルート',
    passExtra: '別料金',
    essentialsTag: '主なパス',
  },
};

/** 移動時間格式：兩種版型與 DaySection 共用，避免各自寫死語系。 */
export function formatDuration(lang: Lang, min?: number): string {
  if (!min || min <= 0) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (lang === 'en') {
    if (min < 60) return `~${min} min`;
    return m ? `~${h} h ${m} min` : `~${h} h`;
  }
  if (lang === 'ja') {
    if (min < 60) return `約 ${min} 分`;
    return m ? `約 ${h} 時間 ${m} 分` : `約 ${h} 時間`;
  }
  if (min < 60) return `約 ${min} 分`;
  return m ? `約 ${h} 小時 ${m} 分` : `約 ${h} 小時`;
}
