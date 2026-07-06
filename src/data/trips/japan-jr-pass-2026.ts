import type { TripReport } from './types';

/**
 * 日本 JR Pass 七日：本州・四國縱走
 * Day 2 ~ Day 8（Day 1 為出發日，未詳列）
 */
export const japanJrPass2026: TripReport = {
  slug: 'japan-jr-pass-2026',
  title: '日本 JR Pass 七日：本州・四國縱走',
  subtitle: '橫濱鎌倉海岸線、上越新幹線、埼玉地下神殿、廣島宮島與四國金刀比羅宮',
  country: '日本',
  year: 2026,
  durationDays: 8,
  summary:
    '以 7 日 JR Pass 縱走本州與四國：橫濱鎌倉海岸線、上越新幹線疾馳、埼玉地下神殿、廣島宮島歷史風光、四國金刀比羅宮千階石梯，並善用 Sunrise 寢台特急夜車節省時間與住宿。',
  mapDefault: {
    center: { lat: 35.2, lng: 136.5 },
    zoom: 5.5,
  },
  essentials: [
    {
      title: '日本鐵路通票（JR Pass）',
      desc: '7 天期，預估票價 50,000¥，為全程本州・四國移動的核心票券。',
      links: [{ label: 'JR Pass 官方網站', url: 'https://www.japanrailpass.net/' }],
    },
    {
      title: '寢台特急列車（Sunrise Express）',
      desc: '往返東京與岡山／四國地區的夜行列車，可省下一晚住宿並直接銜接隔日行程。',
      links: [{ label: 'JR-Odekake 寢台特急資訊', url: 'https://www.jr-odekake.net/' }],
    },
    {
      title: '乘換查詢與寄物櫃',
      desc: 'Jorudan 乘換案內查詢精確月台與班次；Coin Locker Navi 查詢車站大型寄物櫃空位。',
      links: [
        { label: 'Jorudan 乘換案內', url: 'https://www.jorudan.co.jp/' },
        { label: 'Coin Locker Navi' },
      ],
    },
  ],
  days: [
    {
      day: 2,
      title: '橫濱與鎌倉海岸線',
      regionLabel: '關東',
      stops: [
        { id: 'hnd-airport', name: '東京羽田機場（HND）', coords: { lat: 35.5494, lng: 139.7798 }, kind: 'airport' },
        { id: 'yokohama-sta', name: '橫濱站', coords: { lat: 35.466, lng: 139.622 }, kind: 'station', note: '兌換並啟用 JR Pass 7 日券' },
        { id: 'kamakura-sta', name: '鎌倉站', coords: { lat: 35.3192, lng: 139.5503 }, kind: 'station' },
        { id: 'enoshima', name: '江之島', coords: { lat: 35.3, lng: 139.4805 }, kind: 'area' },
      ],
      segments: [
        { mode: 'train', label: '東急線', from: 'hnd-airport', to: 'yokohama-sta' },
        { mode: 'tram', label: '江之電（江ノ島電鐵）', from: 'yokohama-sta', to: 'kamakura-sta' },
        { mode: 'tram', label: '江之電（江ノ島電鐵）', from: 'kamakura-sta', to: 'enoshima' },
        { mode: 'monorail', label: '湘南單軌電車', from: 'enoshima', to: 'yokohama-sta' },
      ],
      activities: [
        'HND 辦理入境手續',
        '於橫濱驛兌換並啟用 JR Pass 7 日券',
        '搭乘江之電沿途遊覽海岸線景點',
        '遊覽橫濱市區',
      ],
      timeline: [{ time: '05:05', text: '抵達東京羽田機場（HND）。' }],
      tips: ['江之電班次密集但車廂較小，尖峰時段建議避開主要通勤與放學人潮。'],
      links: [{ label: '江之電官方網站（繁體中文）', url: 'https://www.enoden.co.jp/' }],
      photos: [
        { id: 'day2-photo-1', caption: '江之電與湘南海岸' },
        { id: 'day2-photo-2', caption: '橫濱港未來區景色' },
        { id: 'day2-photo-3', caption: '鎌倉海岸線車窗風景' },
      ],
    },
    {
      day: 3,
      title: '新潟新幹線疾馳',
      regionLabel: '關東・上越',
      stops: [
        { id: 'yokohama-sta', name: '橫濱站', coords: { lat: 35.466, lng: 139.622 }, kind: 'station' },
        { id: 'ueno-sta', name: '上野站', coords: { lat: 35.7141, lng: 139.7774 }, kind: 'station', note: '18:30 於此搭乘上越新幹線' },
        { id: 'akihabara', name: '秋葉原', coords: { lat: 35.6984, lng: 139.7731 }, kind: 'area', note: '短暫停留約 5 分鐘' },
        { id: 'tsubame-sanjo-sta', name: '燕三條站', coords: { lat: 37.6415, lng: 138.9182 }, kind: 'station' },
      ],
      segments: [
        { mode: 'train', label: 'JR 上野東京線', from: 'yokohama-sta', to: 'ueno-sta' },
        { mode: 'train', label: 'JR 山手線', from: 'ueno-sta', to: 'akihabara' },
        { mode: 'train', label: 'JR 山手線', from: 'akihabara', to: 'ueno-sta' },
        { mode: 'shinkansen', label: '上越新幹線', from: 'ueno-sta', to: 'tsubame-sanjo-sta' },
      ],
      activities: ['橫濱前往上野', '秋葉原短暫停留', '上野搭乘上越新幹線前往燕三條'],
      timeline: [
        { time: '約 5 分鐘', text: '秋葉原短暫停留。' },
        { time: '18:30', text: '於上野站搭乘上越新幹線。' },
        { time: '20:06', text: '抵達燕三條站。' },
      ],
      costs: [
        { label: '上野 → 燕三條 新幹線（參考票價一）', amountJpy: 9250, coveredByPass: true },
        { label: '上野 → 燕三條 新幹線（參考票價二）', amountJpy: 8700, coveredByPass: true },
      ],
      tips: ['秋葉原至上野轉乘新幹線的時間極短，需事前查好上野站的新幹線月台編號與動線。'],
      links: [{ label: 'JR 東日本 - 上越新幹線路線與時刻', url: 'https://www.jreast.co.jp/' }],
      photos: [
        { id: 'day3-photo-1', caption: '秋葉原電器街街景' },
        { id: 'day3-photo-2', caption: '上野站新幹線月台' },
        { id: 'day3-photo-3', caption: '上越新幹線列車車廂' },
      ],
    },
    {
      day: 4,
      title: '埼玉地下神殿與夜車',
      regionLabel: '關東・埼玉',
      stops: [
        { id: 'ueno-sta', name: '上野站', coords: { lat: 35.7141, lng: 139.7774 }, kind: 'station' },
        { id: 'omiya-sta', name: '大宮站', coords: { lat: 35.9064, lng: 139.6238 }, kind: 'station' },
        { id: 'minami-sakurai-sta', name: '南櫻井站', coords: { lat: 35.985, lng: 139.8129 }, kind: 'station' },
        { id: 'underground-temple', name: '首都圈外郭放水路（埼玉地下神殿）', coords: { lat: 35.983, lng: 139.8087 }, kind: 'facility' },
        { id: 'tokyo-sta', name: '東京站', coords: { lat: 35.6812, lng: 139.7671 }, kind: 'station', note: '轉搭 Sunrise 特急夜車' },
      ],
      segments: [
        { mode: 'shinkansen', label: '新幹線', from: 'ueno-sta', to: 'omiya-sta' },
        { mode: 'train', label: '東武城市公園線', from: 'omiya-sta', to: 'minami-sakurai-sta' },
        { mode: 'bus', label: '接駁巴士', from: 'minami-sakurai-sta', to: 'underground-temple' },
        { mode: 'train', label: '東武線・JR 線', from: 'underground-temple', to: 'tokyo-sta' },
        { mode: 'night-train', label: 'Sunrise 寢台特急', from: 'tokyo-sta', to: 'okayama-sta' },
      ],
      activities: [
        '自上野搭新幹線往大宮（約 20 分鐘）',
        '轉東武城市公園線到南櫻井',
        '參觀首都圈外郭放水路（埼玉地下神殿）',
        '返回東京，於東京轉搭 Sunrise 特急夜車',
      ],
      timeline: [
        { time: '13:30 / 13:41', text: '搭新幹線出發前往大宮。' },
        { time: '15:00–17:00', text: '於首都圈外郭放水路（埼玉地下神殿）參觀活動。' },
        { time: '17:00–21:50', text: '自由活動並返回東京，於東京轉搭 Sunrise 特急夜車。' },
      ],
      costs: [
        { label: 'Sunrise 寢台特急 個室指定席券', amountJpy: 21000, note: '單人房（solo）房型' },
        { label: '車內洗澡券', amountJpy: 3000, note: '單人房（solo）房型適用' },
      ],
      tips: ['前往地下神殿的接駁巴士班次較少，若錯過可能導致無法趕上預約的參觀場次。'],
      links: [{ label: '首都圈外郭放水路（地下神殿）預約官網', url: 'https://www.gaikaku.jp/' }],
      photos: [
        { id: 'day4-photo-1', caption: '首都圈外郭放水路地下神殿巨柱' },
        { id: 'day4-photo-2', caption: '南櫻井周邊田園風光' },
        { id: 'day4-photo-3', caption: 'Sunrise 寢台特急外觀' },
      ],
    },
    {
      day: 5,
      title: '廣島歷史與瀨戶內海',
      regionLabel: '山陽・瀨戶內',
      stops: [
        { id: 'okayama-sta', name: '岡山站', coords: { lat: 34.6664, lng: 133.9183 }, kind: 'station', note: 'Sunrise 寢台特急抵達，轉山陽新幹線' },
        { id: 'hiroshima-sta', name: '廣島站', coords: { lat: 34.3978, lng: 132.4754 }, kind: 'station' },
        { id: 'genbaku-dome', name: '原爆圓頂', coords: { lat: 34.3955, lng: 132.4536 }, kind: 'sight' },
        { id: 'hiroshima-castle', name: '廣島城', coords: { lat: 34.4026, lng: 132.4593 }, kind: 'castle' },
        { id: 'miyajimaguchi', name: '宮島口', coords: { lat: 34.312, lng: 132.303 }, kind: 'station' },
        { id: 'itsukushima-jinja', name: '嚴島神社', coords: { lat: 34.2959, lng: 132.3197 }, kind: 'shrine', note: '海上大鳥居，受潮汐影響' },
      ],
      segments: [
        { mode: 'shinkansen', label: '山陽新幹線', from: 'okayama-sta', to: 'hiroshima-sta' },
        { mode: 'tram', label: '廣島電鐵路面電車', from: 'hiroshima-sta', to: 'genbaku-dome' },
        { mode: 'walk', label: '步行', from: 'genbaku-dome', to: 'hiroshima-castle' },
        { mode: 'train', label: 'JR 山陽本線', from: 'hiroshima-castle', to: 'miyajimaguchi' },
        { mode: 'ferry', label: 'JR 宮島渡輪', from: 'miyajimaguchi', to: 'itsukushima-jinja' },
        { mode: 'shinkansen', label: '山陽新幹線', from: 'itsukushima-jinja', to: 'okayama-sta' },
      ],
      activities: [
        '上午廣島市區參觀原爆圓頂與廣島城',
        '下午前往宮島參訪嚴島神社與海上大鳥居',
        '晚上新幹線返回岡山住宿',
      ],
      tips: [
        '嚴島神社海上鳥居受潮汐影響極大，退潮可走近鳥居、滿潮鳥居才浮在海面上，務必提前查潮汐表。',
        '廣島路面電車速度較慢，需掌控傍晚返回岡山的新幹線班次時間。',
      ],
      links: [
        { label: '宮島觀光協會 - 每日潮汐表', url: 'https://www.miyajima.or.jp/' },
        { label: '廣島電鐵路線圖', url: 'https://www.hiroden.co.jp/' },
      ],
      photos: [
        { id: 'day5-photo-1', caption: '原爆圓頂' },
        { id: 'day5-photo-2', caption: '嚴島神社海上大鳥居' },
        { id: 'day5-photo-3', caption: '廣島電鐵路面電車' },
        { id: 'day5-photo-4', caption: '廣島城天守閣' },
      ],
    },
    {
      day: 6,
      title: '岡山名園與四國金刀比羅宮',
      regionLabel: '山陽・四國',
      stops: [
        { id: 'okayama-sta', name: '岡山站', coords: { lat: 34.6664, lng: 133.9183 }, kind: 'station' },
        { id: 'okayama-castle', name: '岡山城', coords: { lat: 34.6648, lng: 133.936 }, kind: 'castle' },
        { id: 'korakuen', name: '岡山後樂園', coords: { lat: 34.6672, lng: 133.935 }, kind: 'garden' },
        { id: 'marugame-sta', name: '丸龜站／丸龜城', coords: { lat: 34.29, lng: 133.8 }, kind: 'castle' },
        { id: 'kotohira-sta', name: '琴平站', coords: { lat: 34.1904, lng: 133.8221 }, kind: 'station' },
        { id: 'konpira-shrine-honmiya', name: '金刀比羅宮本宮', coords: { lat: 34.1841, lng: 133.809 }, kind: 'shrine', note: '本宮 785 階、奧社 1,368 階' },
        { id: 'okayama-sta', name: '岡山站', coords: { lat: 34.6664, lng: 133.9183 }, kind: 'station', note: '接 Sunrise 寢台特急往東京' },
      ],
      segments: [
        { mode: 'tram', label: '岡山電鐵路面電車（或步行）', from: 'okayama-sta', to: 'okayama-castle' },
        { mode: 'walk', label: '步行', from: 'okayama-castle', to: 'korakuen' },
        { mode: 'train', label: 'JR 瀨戶大橋線', from: 'korakuen', to: 'marugame-sta' },
        { mode: 'train', label: 'JR 土讚線', from: 'marugame-sta', to: 'kotohira-sta' },
        { mode: 'walk', label: '表參道石階步行', from: 'kotohira-sta', to: 'konpira-shrine-honmiya' },
        { mode: 'train', label: 'JR 土讚線・瀨戶大橋線', from: 'konpira-shrine-honmiya', to: 'okayama-sta' },
        { mode: 'night-train', label: 'Sunrise 寢台特急', from: 'okayama-sta', to: 'tokyo-sta' },
      ],
      activities: [
        '上午參觀岡山城與後樂園',
        '下午跨瀨戶大橋前往四國，參觀丸龜城',
        '前往琴平參拜金刀比羅宮',
        '晚上返回岡山站接 Sunrise 寢台特急往東京',
      ],
      tips: [
        '金刀比羅宮至本宮 785 階、奧社 1,368 階，極耗體力，務必穿舒適運動鞋並預留至少 2.5 小時。',
        '強烈建議大件行李寄放岡山車站置物櫃，輕裝移動。',
      ],
      links: [
        { label: '岡山後樂園官方網站（繁體中文）', url: 'https://okayama-korakuen.jp/' },
        { label: '丸龜城觀光指南' },
        { label: '金刀比羅宮官方網站', url: 'https://www.konpira.or.jp/' },
      ],
      photos: [
        { id: 'day6-photo-1', caption: '岡山後樂園' },
        { id: 'day6-photo-2', caption: '岡山城烏城' },
        { id: 'day6-photo-3', caption: '金刀比羅宮石階參道' },
        { id: 'day6-photo-4', caption: '瀨戶大橋車窗景色' },
      ],
    },
    {
      day: 7,
      title: '東京市區探索',
      regionLabel: '關東・東京',
      stops: [
        { id: 'tokyo-sta', name: '東京站', coords: { lat: 35.6812, lng: 139.7671 }, kind: 'station', note: 'Sunrise 寢台特急抵達' },
        { id: 'shibuya-sky', name: '澀谷 Shibuya Sky', coords: { lat: 35.6585, lng: 139.7013 }, kind: 'viewpoint' },
        { id: 'akihabara', name: '秋葉原', coords: { lat: 35.6984, lng: 139.7731 }, kind: 'area' },
      ],
      segments: [
        { mode: 'train', label: 'JR 山手線', from: 'tokyo-sta', to: 'shibuya-sky' },
        { mode: 'train', label: 'JR 山手線', from: 'shibuya-sky', to: 'akihabara' },
      ],
      activities: ['前一夜 Sunrise 列車返回東京', '登上 Shibuya Sky 觀景台', '逛秋葉原商圈'],
      costs: [
        { label: 'Sunrise 寢台特急返回東京 個室指定席券', amountJpy: 21000 },
        { label: '寢台特急相關費用', amountJpy: 6600 },
      ],
      tips: ['Shibuya Sky 熱門時段（如日落前）門票極易售罄，務必提前網路預約購票。'],
      links: [{ label: 'Shibuya Sky 線上售票系統', url: 'https://www.shibuya-scramble-square.com/sky/' }],
      photos: [
        { id: 'day7-photo-1', caption: 'Shibuya Sky 觀景台夕陽' },
        { id: 'day7-photo-2', caption: '秋葉原商圈街景' },
      ],
    },
    {
      day: 8,
      title: '離境與機場交通',
      regionLabel: '關東・成田',
      stops: [
        { id: 'tokyo-sta', name: '東京站', coords: { lat: 35.6812, lng: 139.7671 }, kind: 'station' },
        { id: 'narita-airport', name: '成田國際機場（NRT）', coords: { lat: 35.7719, lng: 140.3928 }, kind: 'airport' },
      ],
      segments: [{ mode: 'train', label: "N'EX 成田特快", from: 'tokyo-sta', to: 'narita-airport' }],
      activities: ['自東京站搭乘 NEX 成田特快前往成田國際機場', '辦理離境手續'],
      tips: ['NEX 全車指定席，不能只憑 JR Pass 上車，必須提早在車站綠色售票機劃位。'],
      links: [{ label: "N'EX 成田特快劃位與時刻表資訊", url: 'https://www.jreast.co.jp/e/nex/' }],
      photos: [
        { id: 'day8-photo-1', caption: "N'EX 成田特快車廂" },
        { id: 'day8-photo-2', caption: '成田機場出境大廳' },
      ],
    },
  ],
};
