// 飯店計畫 / 航空聯盟的「整個計畫 + 各等級會籍與服務」參考資料。
// 以 CMS program slug 為 key，在 Astro 端覆寫顯示（CMS 記錄不動、URL 保持穩定）。
// 資料屬相對穩定的參考性質；若計畫改版請於此更新。

import type { Lang } from '../i18n/types';

export interface ProgramTier {
  /** 等級名稱，如「金卡 Gold」 */
  name: string;
  /** 如何達成，如「年度 40 晚 或 20 次住宿」 */
  qualify?: string;
  /** 此等級由 AMEX 白金卡（或對應信用卡）自動贈送 */
  granted?: boolean;
  /** 該等級提供的服務 */
  services: string[];
}

export interface ProgramTierInfo {
  /** 整個計畫的顯示名稱（覆寫 CMS 的分等級名稱） */
  displayName: string;
  /** 整個計畫的概述 */
  intro: string;
  /** 補充說明（贈送等級／聯盟狀態來源等） */
  note?: string;
  /** 各會籍等級（飯店計畫、航空聯盟） */
  tiers?: ProgramTier[];
  /** 非分級計畫的固定禮遇（如 AMEX FHR） */
  perks?: string[];
}

type ProgramTierMap = Record<string, ProgramTierInfo>;

const zh: ProgramTierMap = {
  'hilton-honors': {
    displayName: '希爾頓榮譽客會（Hilton Honors）',
    intro:
      '希爾頓榮譽客會是希爾頓旗下橫跨全球 8,000+ 間、22 個品牌（含 Waldorf Astoria、Conrad、DoubleTree 等）的常客計畫。以住宿與消費累積積分，並依年度住宿晚數／次數升等會籍，等級越高禮遇越多。',
    note: 'AMEX 台灣白金卡持卡人自動獲得「金卡（Gold）」等級，免累積住宿。',
    tiers: [
      {
        name: '會員 Member',
        qualify: '註冊即得',
        services: ['會員專屬房價', '免費 Wi-Fi', 'App 數位入住與選房', '入住與消費累積 10X 基本積分'],
      },
      {
        name: '銀卡 Silver',
        qualify: '年度 10 晚 或 4 次住宿',
        services: ['積分 20% 加成', '獎勵兌換連住第 5 晚免費', '每次住宿兩瓶礦泉水', '訂房積分不到期'],
      },
      {
        name: '金卡 Gold',
        qualify: '年度 40 晚 或 20 次住宿',
        granted: true,
        services: [
          '積分 80% 加成',
          '免費房型升等（至行政樓層，不含套房）',
          '每日免費早餐或餐飲抵用金',
          '獎勵兌換連住第 5 晚免費',
        ],
      },
      {
        name: '鑽石卡 Diamond',
        qualify: '年度 60 晚 或 30 次住宿',
        services: ['積分 100% 加成', '升等範圍含套房', '行政酒廊使用權', '48 小時房間保證', '專屬禮賓服務'],
      },
    ],
  },
  'marriott-bonvoy': {
    displayName: '萬豪旅享家（Marriott Bonvoy）',
    intro:
      '萬豪旅享家是萬豪國際旗下橫跨全球 9,000+ 間、30+ 個品牌（含 Ritz-Carlton、St. Regis、W、Sheraton 等）的會員計畫。依年度住宿晚數升等，等級提供延遲退房、房型升等、行政酒廊等禮遇。',
    note: 'AMEX 台灣白金卡持卡人自動獲得「金卡（Gold Elite）」等級。',
    tiers: [
      {
        name: '會員 Member',
        qualify: '註冊即得',
        services: ['會員專屬房價', '免費 Wi-Fi', '行動入住與行動鑰匙'],
      },
      {
        name: '銀卡 Silver Elite',
        qualify: '年度 10 晚',
        services: ['積分 10% 加成', '優先較晚退房（視供應）', '專屬 Elite 客服'],
      },
      {
        name: '金卡 Gold Elite',
        qualify: '年度 25 晚',
        granted: true,
        services: [
          '積分 25% 加成',
          '下午 2 點延遲退房',
          '房型升等（含較高樓層／景觀房，視供應）',
          '每次住宿 250–500 迎賓積分',
        ],
      },
      {
        name: '白金卡 Platinum Elite',
        qualify: '年度 50 晚',
        services: [
          '積分 50% 加成',
          '下午 4 點延遲退房',
          '套房升等（視供應）',
          '行政酒廊使用權',
          '迎賓禮（積分／早餐／點數三選一）',
        ],
      },
      {
        name: '鈦金卡 Titanium Elite',
        qualify: '年度 75 晚',
        services: ['積分 75% 加成', '48 小時房間保證', '聯合航空 MileagePlus 銀卡等聯合禮遇'],
      },
      {
        name: '大使卡 Ambassador Elite',
        qualify: '年度 100 晚 + US$23,000 消費',
        services: ['專屬個人大使服務', 'Your24 自選 24 小時入住時段'],
      },
    ],
  },
  'amex-fhr': {
    displayName: 'AMEX Fine Hotels & Resorts (FHR)',
    intro:
      'Fine Hotels & Resorts 是 AMEX 白金卡（及以上）專屬的頂級飯店預訂平台，精選全球 1,800+ 間豪華酒店與度假村。透過 FHR 訂房，每次入住皆享固定頂級禮遇，不需累積會籍。',
    note: '需透過 AMEX FHR 平台訂房並以指定白金卡付款方可享有。',
    perks: [
      '兩人免費早餐',
      '房型升等（視供應）',
      '下午 4 點延遲退房',
      '中午 12 點提前入住（視供應）',
      '免費 Wi-Fi',
      '每次住宿約 US$100 等值飯店抵用金（餐飲／SPA 等）',
    ],
  },
  'star-alliance': {
    displayName: '星空聯盟（Star Alliance）',
    intro:
      '星空聯盟是全球最大的航空聯盟，26 家成員航空。聯盟本身不發行會籍——你的聯盟等級來自任一成員航空常客計畫的精英會籍（台灣代表：長榮航空 Infinity MileageLands）。',
    note: '聯盟等級分為 Silver 與 Gold，由成員航空的精英等級對應。',
    tiers: [
      {
        name: 'Star Alliance Silver',
        qualify: '成員航空中階精英（如長榮金卡）',
        services: ['訂位候補優先', '機場候補優先'],
      },
      {
        name: 'Star Alliance Gold',
        qualify: '成員航空高階精英（如長榮鑽石卡）',
        services: [
          '全球 Star Alliance 貴賓室使用',
          '優先報到／登機／行李',
          '額外托運行李額度',
          '劃位與候補優先',
        ],
      },
    ],
  },
  oneworld: {
    displayName: '寰宇一家（oneworld）',
    intro:
      '寰宇一家是全球第三大航空聯盟，13 家成員航空（重要夥伴：國泰航空、日本航空）。聯盟等級來自成員航空常客計畫的精英會籍。',
    note: '等級由低至高分為 Ruby、Sapphire、Emerald 三級。',
    tiers: [
      {
        name: 'oneworld Ruby',
        qualify: '成員航空初階精英',
        services: ['商務艙報到櫃檯', '機場候補優先', '訂位候補優先'],
      },
      {
        name: 'oneworld Sapphire',
        qualify: '成員航空中階精英',
        services: ['商務艙貴賓室使用', '優先登機', '額外托運行李', '優先劃位'],
      },
      {
        name: 'oneworld Emerald',
        qualify: '成員航空高階精英',
        services: ['頭等艙貴賓室使用', '部分機場快速安檢／通關', '最高階優先禮遇', '額外托運行李'],
      },
    ],
  },
  skyteam: {
    displayName: '天合聯盟（SkyTeam）',
    intro:
      '天合聯盟是全球第二大航空聯盟，19 家成員航空（台灣代表：中華航空 華夏哩程會員）。聯盟等級來自成員航空常客計畫的精英會籍。',
    note: '等級分為 Elite 與 Elite Plus 兩級。',
    tiers: [
      {
        name: 'SkyTeam Elite',
        qualify: '成員航空中階精英',
        services: ['優先報到', '機場候補優先', '部分額外行李禮遇'],
      },
      {
        name: 'SkyTeam Elite Plus',
        qualify: '成員航空高階精英',
        services: [
          '全球 SkyTeam 貴賓室使用',
          '優先報到／登機／行李',
          '保證經濟艙訂位（部分航班）',
          '額外托運行李',
        ],
      },
    ],
  },
};

const en: ProgramTierMap = {
  'hilton-honors': {
    displayName: 'Hilton Honors',
    intro:
      "Hilton Honors is Hilton's loyalty program spanning 8,000+ properties across 22 brands (Waldorf Astoria, Conrad, DoubleTree and more). Earn points on stays and spend, and unlock higher tiers by annual nights/stays — the higher the tier, the richer the perks.",
    note: 'AMEX Platinum cardholders (Taiwan) automatically receive Gold status — no stays required.',
    tiers: [
      {
        name: 'Member',
        qualify: 'On sign-up',
        services: ['Member rates', 'Free Wi-Fi', 'Digital check-in & room selection', '10X base points on stays & spend'],
      },
      {
        name: 'Silver',
        qualify: '10 nights or 4 stays / year',
        services: ['20% bonus points', '5th award night free', 'Two bottled waters per stay', 'Points never expire'],
      },
      {
        name: 'Gold',
        qualify: '40 nights or 20 stays / year',
        granted: true,
        services: [
          '80% bonus points',
          'Free room upgrade (up to executive floor, excl. suites)',
          'Daily free breakfast or dining credit',
          '5th award night free',
        ],
      },
      {
        name: 'Diamond',
        qualify: '60 nights or 30 stays / year',
        services: ['100% bonus points', 'Upgrades incl. suites', 'Executive lounge access', '48-hour room guarantee', 'Diamond concierge'],
      },
    ],
  },
  'marriott-bonvoy': {
    displayName: 'Marriott Bonvoy',
    intro:
      "Marriott Bonvoy is Marriott International's program spanning 9,000+ properties across 30+ brands (Ritz-Carlton, St. Regis, W, Sheraton and more). Tiers unlock by annual nights, offering late checkout, upgrades and executive lounge access.",
    note: 'AMEX Platinum cardholders (Taiwan) automatically receive Gold Elite status.',
    tiers: [
      {
        name: 'Member',
        qualify: 'On sign-up',
        services: ['Member rates', 'Free Wi-Fi', 'Mobile check-in & mobile key'],
      },
      {
        name: 'Silver Elite',
        qualify: '10 nights / year',
        services: ['10% bonus points', 'Priority late checkout (subject to availability)', 'Dedicated Elite support'],
      },
      {
        name: 'Gold Elite',
        qualify: '25 nights / year',
        granted: true,
        services: [
          '25% bonus points',
          '2 PM late checkout',
          'Enhanced room upgrade (subject to availability)',
          '250–500 welcome points per stay',
        ],
      },
      {
        name: 'Platinum Elite',
        qualify: '50 nights / year',
        services: [
          '50% bonus points',
          '4 PM late checkout',
          'Suite upgrade (subject to availability)',
          'Executive lounge access',
          'Welcome gift (points / breakfast / amenity)',
        ],
      },
      {
        name: 'Titanium Elite',
        qualify: '75 nights / year',
        services: ['75% bonus points', '48-hour room guarantee', 'United MileagePlus Silver & other partner perks'],
      },
      {
        name: 'Ambassador Elite',
        qualify: '100 nights + US$23,000 spend / year',
        services: ['Dedicated personal Ambassador service', 'Your24 — choose your 24-hour stay window'],
      },
    ],
  },
  'amex-fhr': {
    displayName: 'AMEX Fine Hotels & Resorts (FHR)',
    intro:
      'Fine Hotels & Resorts is the luxury hotel booking platform exclusive to AMEX Platinum (and above), featuring 1,800+ hand-picked hotels and resorts worldwide. Every FHR booking includes a fixed set of premium benefits — no membership tier required.',
    note: 'Benefits apply when you book through the AMEX FHR platform and pay with an eligible Platinum card.',
    perks: [
      'Free breakfast for two',
      'Room upgrade (subject to availability)',
      '4 PM late checkout',
      'Noon early check-in (subject to availability)',
      'Free Wi-Fi',
      '~US$100 hotel credit per stay (dining / spa, etc.)',
    ],
  },
  'star-alliance': {
    displayName: 'Star Alliance',
    intro:
      "Star Alliance is the world's largest airline alliance with 26 member airlines. The alliance issues no membership itself — your alliance status comes from elite tiers in any member airline's frequent-flyer program (Taiwan: EVA Air Infinity MileageLands).",
    note: 'Alliance status has two levels, Silver and Gold, mapped from member-airline elite tiers.',
    tiers: [
      {
        name: 'Star Alliance Silver',
        qualify: 'Mid-tier member-airline elite (e.g. EVA Gold)',
        services: ['Priority reservations waitlist', 'Airport standby priority'],
      },
      {
        name: 'Star Alliance Gold',
        qualify: 'Top-tier member-airline elite (e.g. EVA Diamond)',
        services: [
          'Star Alliance lounge access worldwide',
          'Priority check-in / boarding / baggage',
          'Extra baggage allowance',
          'Seat selection & waitlist priority',
        ],
      },
    ],
  },
  oneworld: {
    displayName: 'oneworld',
    intro:
      "oneworld is the world's third-largest airline alliance with 13 members (key partners: Cathay Pacific, Japan Airlines). Alliance status comes from elite tiers in member-airline frequent-flyer programs.",
    note: 'Three levels, low to high: Ruby, Sapphire, Emerald.',
    tiers: [
      {
        name: 'oneworld Ruby',
        qualify: 'Entry-level member-airline elite',
        services: ['Business-class check-in desks', 'Airport standby priority', 'Reservations waitlist priority'],
      },
      {
        name: 'oneworld Sapphire',
        qualify: 'Mid-tier member-airline elite',
        services: ['Business-class lounge access', 'Priority boarding', 'Extra baggage allowance', 'Preferred seating'],
      },
      {
        name: 'oneworld Emerald',
        qualify: 'Top-tier member-airline elite',
        services: ['First-class lounge access', 'Fast-track security/immigration (select airports)', 'Highest priority perks', 'Extra baggage allowance'],
      },
    ],
  },
  skyteam: {
    displayName: 'SkyTeam',
    intro:
      "SkyTeam is the world's second-largest airline alliance with 19 members (Taiwan: China Airlines Dynasty Flyer). Alliance status comes from elite tiers in member-airline frequent-flyer programs.",
    note: 'Two levels: Elite and Elite Plus.',
    tiers: [
      {
        name: 'SkyTeam Elite',
        qualify: 'Mid-tier member-airline elite',
        services: ['Priority check-in', 'Airport standby priority', 'Some extra baggage perks'],
      },
      {
        name: 'SkyTeam Elite Plus',
        qualify: 'Top-tier member-airline elite',
        services: [
          'SkyTeam lounge access worldwide',
          'Priority check-in / boarding / baggage',
          'Guaranteed economy reservations (select flights)',
          'Extra baggage allowance',
        ],
      },
    ],
  },
};

const BY_LANG: Record<Lang, ProgramTierMap> = { en, zh, ja: en };

export function getProgramTierInfo(lang: Lang, slug: string): ProgramTierInfo | undefined {
  return (BY_LANG[lang] ?? en)[slug];
}
