import { SPACES, type SpaceDef, type SpaceId } from '../data/spaces';
import type { Lang } from './types';

type PartialSpace = Partial<Omit<SpaceDef, 'id'>>;

const ZH: Record<SpaceId, PartialSpace> = {
  solilium: {
    tagline: '攝影與視覺創作',
    heroKicker: '在 SOLILIUM，<strong>先對齊視線</strong>，再讓畫面說話。',
    heroTag: '視覺作品集',
    heroDesc: '攝影與視覺創作。<br />幾何、光線，以及其間的留白。',
    aboutLead:
      '視覺創作者，專注於幾何與光影之間的張力。透過攝影閱讀城市中的秩序與混沌。',
    aboutSecond: '每一個畫面，都是對空間的一次重新定義。',
    quoteBand:
      '光線落在邊角的那一刻，建築才開始說話；鏡頭所做的，只是把那句話放慢。',
    quoteBandAttr: '觀看筆記',
  },
  voidlane: {
    tagline: '實驗動態與數位紋理',
    heroKicker: 'VOID LANE 以<strong>噪點與殘影</strong>作為敘事材質。',
    heroTag: '動態實驗室',
    heroDesc: '數位瑕疵、掃描線與節奏。<br />訊號斷裂之處，故事才開始。',
    aboutLead:
      '聚焦動態影像與實驗紋理，把「失真」當成語氣，讓錯誤美學變成可閱讀的節奏。',
    aboutSecond: '在雜訊裡找秩序，在斷訊裡找情緒。',
    quoteBand: '畫面不必完美，而是在對的瞬間輕輕顫一下。',
    quoteBandAttr: '訊號筆記',
  },
};

const JA: Record<SpaceId, PartialSpace> = {
  solilium: {
    tagline: '写真とビジュアル制作',
    heroKicker: 'SOLILIUM では、<strong>まず視線を揃え</strong>、そのあとで画面に語らせる。',
    heroTag: 'ビジュアル・ポートフォリオ',
    heroDesc: '写真とビジュアル制作。<br />幾何学、光、そしてそのあいだの余白。',
    aboutLead:
      '幾何と光の緊張に焦点を当て、都市の秩序と混沌を写真で読み解く視覚プラクティス。',
    aboutSecond: '各イメージは、静かな空間の再定義です。',
    quoteBand:
      '光が角に触れた瞬間に建築は語り始める—レンズはその一文を遅らせるだけ。',
    quoteBandAttr: '視線のノート',
  },
  voidlane: {
    tagline: '実験的モーションとデジタル質感',
    heroKicker: 'VOID LANE は<strong>ノイズと残像</strong>を物語の素材にする。',
    heroTag: 'モーションラボ',
    heroDesc: 'デジタルのアーティファクト、スキャン線、リズム。<br />信号が切れる場所に物語がある。',
    aboutLead:
      '実験的な質感とモーション—ゆがみをトーンとして、「エラー美学」を読めるリズムに。',
    aboutSecond: 'ノイズの中の秩序と、ドロップアウトの中の感情を探す。',
    quoteBand: '完璧さより、正しい瞬間のわずかな震え。',
    quoteBandAttr: '信号ノート',
  },
};

export function getLocalizedSpace(id: SpaceId, lang: Lang): SpaceDef {
  const base = SPACES[id];
  if (lang === 'en') return base;
  const patch = lang === 'zh' ? ZH[id] : JA[id];
  return { ...base, ...patch };
}
