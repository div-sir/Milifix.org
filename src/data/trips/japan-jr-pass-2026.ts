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
        { id: 'hnd-airport', name: '東京羽田機場（HND）', coords: { lat: 35.5494, lng: 139.7798 }, desc: '東京都心南側的國際門戶，清晨抵達即可無縫銜接關東近郊行程。', kind: 'airport' },
        { id: 'yokohama-sta', name: '橫濱站', coords: { lat: 35.466, lng: 139.622 }, desc: '神奈川的玄關大站，站體連通港未來與海濱，是啟用 JR Pass 的第一站。', kind: 'station', note: '兌換並啟用 JR Pass 7 日券' },
        { id: 'kamakura-sta', name: '鎌倉站', coords: { lat: 35.3192, lng: 139.5503 }, desc: '古都鎌倉的入口，JR 與江之電在此交會，通往大佛與湘南海岸。', kind: 'station' },
        { id: 'enoshima', name: '江之島', coords: { lat: 35.3, lng: 139.4805 }, desc: '湘南海岸的地標小島，燈塔展望、海蝕洞與海鮮名物匯聚一身。', kind: 'area' },
      ],
      segments: [
        { mode: 'train', label: '京急線・東急線', from: 'hnd-airport', to: 'yokohama-sta', durationMin: 30 },
        { mode: 'train', label: 'JR 橫須賀線 → 江之電', from: 'yokohama-sta', to: 'kamakura-sta', durationMin: 27 },
        { mode: 'tram', label: '江之電（江ノ島電鐵）', from: 'kamakura-sta', to: 'enoshima', durationMin: 24, viaCoords: [{ lat: 35.32753, lng: 139.48521 }, { lat: 35.33326, lng: 139.4858 }, { lat: 35.31076, lng: 139.5325 }, { lat: 35.31116, lng: 139.53573 }, { lat: 35.30612, lng: 139.50975 }, { lat: 35.31527, lng: 139.48319 }, { lat: 35.30936, lng: 139.52879 }, { lat: 35.31527, lng: 139.48319 }, { lat: 35.31716, lng: 139.48184 }, { lat: 35.31963, lng: 139.48322 }, { lat: 35.30429, lng: 139.52305 }, { lat: 35.30899, lng: 139.52838 }, { lat: 35.31128, lng: 139.4871 }, { lat: 35.31504, lng: 139.4835 }, { lat: 35.32188, lng: 139.48286 }, { lat: 35.32753, lng: 139.48521 }, { lat: 35.30544, lng: 139.5116 }, { lat: 35.30405, lng: 139.51582 }, { lat: 35.30401, lng: 139.52021 }, { lat: 35.31305, lng: 139.54243 }, { lat: 35.33407, lng: 139.48601 }, { lat: 35.33682, lng: 139.48702 }, { lat: 35.31305, lng: 139.54243 }, { lat: 35.31366, lng: 139.5451 }, { lat: 35.30936, lng: 139.52879 }, { lat: 35.31142, lng: 139.53678 }, { lat: 35.31772, lng: 139.5502 }, { lat: 35.30671, lng: 139.50017 }, { lat: 35.30667, lng: 139.49557 }, { lat: 35.31128, lng: 139.4871 }, { lat: 35.3108, lng: 139.48797 }] },
        { mode: 'monorail', label: '湘南單軌電車', from: 'enoshima', to: 'yokohama-sta', durationMin: 40 },
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
        { id: 'yokohama-sta', name: '橫濱站', coords: { lat: 35.466, lng: 139.622 }, desc: '神奈川的玄關大站，站體連通港未來與海濱，是啟用 JR Pass 的第一站。', kind: 'station' },
        { id: 'ueno-sta', name: '上野站', coords: { lat: 35.7141, lng: 139.7774 }, desc: '關東北向新幹線的樞紐，緊鄰上野公園與博物館群。', kind: 'station', note: '18:30 於此搭乘上越新幹線' },
        { id: 'akihabara', name: '秋葉原', coords: { lat: 35.6984, lng: 139.7731 }, desc: '電器街與動漫次文化聖地，山手線轉乘途中的短停點。', kind: 'area', note: '短暫停留約 5 分鐘' },
        { id: 'tsubame-sanjo-sta', name: '燕三條站', coords: { lat: 37.6415, lng: 138.9182 }, desc: '新潟金屬工藝之鄉，上越新幹線與在來線在此交會。', kind: 'station' },
      ],
      segments: [
        { mode: 'train', label: 'JR 上野東京線', from: 'yokohama-sta', to: 'ueno-sta', durationMin: 35, viaCoords: [{ lat: 35.6812, lng: 139.7671 }] },
        { mode: 'train', label: 'JR 山手線', from: 'ueno-sta', to: 'akihabara', durationMin: 5 },
        { mode: 'train', label: 'JR 山手線', from: 'akihabara', to: 'ueno-sta', durationMin: 5 },
        { mode: 'shinkansen', label: '上越新幹線', from: 'ueno-sta', to: 'tsubame-sanjo-sta', durationMin: 100, viaCoords: [{ lat: 35.71846, lng: 139.78063 }, { lat: 35.72055, lng: 139.78081 }, { lat: 35.72772, lng: 139.771 }, { lat: 37.90699, lng: 139.04708 }, { lat: 37.89807, lng: 139.03603 }, { lat: 37.88363, lng: 139.02344 }, { lat: 37.64381, lng: 138.93674 }, { lat: 37.61699, lng: 138.92371 }, { lat: 37.4956, lng: 138.87283 }] },
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
        { id: 'ueno-sta', name: '上野站', coords: { lat: 35.7141, lng: 139.7774 }, desc: '關東北向新幹線的樞紐，緊鄰上野公園與博物館群。', kind: 'station' },
        { id: 'omiya-sta', name: '大宮站', coords: { lat: 35.9064, lng: 139.6238 }, desc: '埼玉最大的鐵道結點，鐵道博物館所在，新幹線分歧要衝。', kind: 'station' },
        { id: 'minami-sakurai-sta', name: '南櫻井站', coords: { lat: 35.985, lng: 139.8129 }, desc: '東武野田線的鄉間小站，是前往地下神殿接駁的起點。', kind: 'station' },
        { id: 'underground-temple', name: '首都圈外郭放水路（埼玉地下神殿）', coords: { lat: 35.983, lng: 139.8087 }, desc: '世界最大級的地下排水設施，五十九根巨柱撐起的「地下神殿」。', kind: 'facility' },
        { id: 'tokyo-sta', name: '東京站', coords: { lat: 35.6812, lng: 139.7671 }, desc: '紅磚站舎的中央車站，也是 Sunrise 寢台特急的發抵點。', kind: 'station', note: '轉搭 Sunrise 特急夜車' },
      ],
      segments: [
        { mode: 'shinkansen', label: '上越新幹線（清晨返回東京）', from: 'tsubame-sanjo-sta', to: 'ueno-sta', durationMin: 100, viaCoords: [{ lat: 37.4956, lng: 138.87283 }, { lat: 37.61699, lng: 138.92371 }, { lat: 37.64381, lng: 138.93674 }, { lat: 37.88363, lng: 139.02344 }, { lat: 37.89807, lng: 139.03603 }, { lat: 37.90699, lng: 139.04708 }, { lat: 35.72772, lng: 139.771 }, { lat: 35.72055, lng: 139.78081 }, { lat: 35.71846, lng: 139.78063 }] },
        { mode: 'shinkansen', label: '上越新幹線', from: 'ueno-sta', to: 'omiya-sta', durationMin: 20 },
        { mode: 'train', label: '東武城市公園線', from: 'omiya-sta', to: 'minami-sakurai-sta', durationMin: 40 },
        { mode: 'bus', label: '接駁巴士', from: 'minami-sakurai-sta', to: 'underground-temple', durationMin: 15 },
        { mode: 'train', label: '東武線・JR 線', from: 'underground-temple', to: 'tokyo-sta', durationMin: 70, viaCoords: [{ lat: 35.9064, lng: 139.6238 }] },
        { mode: 'night-train', label: 'Sunrise 寢台特急', from: 'tokyo-sta', to: 'okayama-sta', durationMin: 430, viaCoords: [{ lat: 35.4660, lng: 139.6220 }, { lat: 35.0960, lng: 139.0780 }, { lat: 34.7030, lng: 137.7350 }, { lat: 35.1700, lng: 136.8820 }, { lat: 34.9860, lng: 135.7580 }, { lat: 34.7330, lng: 135.5000 }, { lat: 34.8270, lng: 134.6900 }] },
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
        { id: 'okayama-sta', name: '岡山站', coords: { lat: 34.6664, lng: 133.9183 }, desc: '山陽新幹線與四國聯絡線的樞紐，Sunrise 夜車於清晨抵達。', kind: 'station', note: 'Sunrise 寢台特急抵達，轉山陽新幹線' },
        { id: 'hiroshima-sta', name: '廣島站', coords: { lat: 34.3978, lng: 132.4754 }, desc: '山陽新幹線大站，通往和平紀念公園與宮島的起點。', kind: 'station' },
        { id: 'genbaku-dome', name: '原爆圓頂', coords: { lat: 34.3955, lng: 132.4536 }, desc: '見證原爆的世界遺產，靜立於和平紀念公園的核心。', kind: 'sight' },
        { id: 'hiroshima-castle', name: '廣島城', coords: { lat: 34.4026, lng: 132.4593 }, desc: '人稱「鯉城」的平城，天守閣於戰後重建，護城河環抱。', kind: 'castle' },
        { id: 'miyajimaguchi', name: '宮島口', coords: { lat: 34.312, lng: 132.303 }, desc: '前往宮島的渡輪口，JR 山陽本線與宮島渡輪的轉乘點。', kind: 'station' },
        { id: 'itsukushima-jinja', name: '嚴島神社', coords: { lat: 34.2959, lng: 132.3197 }, desc: '立於海上的世界遺產，朱紅大鳥居隨潮汐浮沉。', kind: 'shrine', note: '海上大鳥居，受潮汐影響' },
      ],
      segments: [
        { mode: 'shinkansen', label: '山陽新幹線', from: 'okayama-sta', to: 'hiroshima-sta', durationMin: 40, viaCoords: [{ lat: 34.4890, lng: 133.3620 }, { lat: 34.4270, lng: 132.7430 }] },
        { mode: 'tram', label: '廣島電鐵路面電車', from: 'hiroshima-sta', to: 'genbaku-dome', durationMin: 15 },
        { mode: 'walk', label: '步行', from: 'genbaku-dome', to: 'hiroshima-castle', durationMin: 15 },
        { mode: 'train', label: 'JR 山陽本線', from: 'hiroshima-castle', to: 'miyajimaguchi', durationMin: 30, viaCoords: [{ lat: 34.3978, lng: 132.4754 }] },
        { mode: 'ferry', label: 'JR 宮島渡輪', from: 'miyajimaguchi', to: 'itsukushima-jinja', durationMin: 10 },
        { mode: 'shinkansen', label: 'JR 山陽本線・山陽新幹線', from: 'itsukushima-jinja', to: 'okayama-sta', durationMin: 75, viaCoords: [{ lat: 34.3978, lng: 132.4754 }, { lat: 34.4270, lng: 132.7430 }, { lat: 34.4890, lng: 133.3620 }] },
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
        { id: 'okayama-sta', name: '岡山站', coords: { lat: 34.6664, lng: 133.9183 }, desc: '山陽新幹線與四國聯絡線的樞紐，Sunrise 夜車於清晨抵達。', kind: 'station' },
        { id: 'okayama-castle', name: '岡山城', coords: { lat: 34.6648, lng: 133.936 }, desc: '黑色外觀人稱「烏城」，與後樂園隔旭川相望。', kind: 'castle' },
        { id: 'korakuen', name: '岡山後樂園', coords: { lat: 34.6672, lng: 133.935 }, desc: '日本三名園之一，借景岡山城的迴遊式大名庭園。', kind: 'garden' },
        { id: 'marugame-sta', name: '丸龜站／丸龜城', coords: { lat: 34.29, lng: 133.8 }, desc: '保有現存木造天守的名城，高聳石垣為四國名勝。', kind: 'castle' },
        { id: 'kotohira-sta', name: '琴平站', coords: { lat: 34.1904, lng: 133.8221 }, desc: '金刀比羅宮參拜的門戶小鎮，門前町土產街熱鬧。', kind: 'station' },
        { id: 'konpira-shrine-honmiya', name: '金刀比羅宮本宮', coords: { lat: 34.1841, lng: 133.809 }, desc: '鎮座象頭山的海之守護神社，登上本宮需踏過七百餘階。', kind: 'shrine', note: '本宮 785 階、奧社 1,368 階' },
        { id: 'okayama-sta', name: '岡山站', coords: { lat: 34.6664, lng: 133.9183 }, desc: '山陽新幹線與四國聯絡線的樞紐，Sunrise 夜車於清晨抵達。', kind: 'station', note: '接 Sunrise 寢台特急往東京' },
      ],
      segments: [
        { mode: 'tram', label: '岡山電鐵路面電車（或步行）', from: 'okayama-sta', to: 'okayama-castle', durationMin: 10, viaCoords: [{ lat: 34.66551, lng: 133.91961 }, { lat: 34.66566, lng: 133.92984 }, { lat: 34.66551, lng: 133.92049 }, { lat: 34.66562, lng: 133.92598 }, { lat: 34.65779, lng: 133.93557 }, { lat: 34.65814, lng: 133.93235 }, { lat: 34.65772, lng: 133.93603 }, { lat: 34.65828, lng: 133.93068 }, { lat: 34.65625, lng: 133.94267 }, { lat: 34.65831, lng: 133.93068 }, { lat: 34.66551, lng: 133.91998 }, { lat: 34.65622, lng: 133.94268 }, { lat: 34.65621, lng: 133.93832 }] },
        { mode: 'walk', label: '步行', from: 'okayama-castle', to: 'korakuen', durationMin: 5 },
        { mode: 'train', label: 'JR 瀨戶大橋線', from: 'korakuen', to: 'marugame-sta', durationMin: 55, viaCoords: [{ lat: 34.6664, lng: 133.9183 }, { lat: 34.4640, lng: 133.8070 }, { lat: 34.3120, lng: 133.8600 }] },
        { mode: 'train', label: 'JR 土讚線', from: 'marugame-sta', to: 'kotohira-sta', durationMin: 25 },
        { mode: 'walk', label: '表參道石階步行', from: 'kotohira-sta', to: 'konpira-shrine-honmiya', durationMin: 50 },
        { mode: 'train', label: 'JR 土讚線・瀨戶大橋線', from: 'konpira-shrine-honmiya', to: 'okayama-sta', durationMin: 80, viaCoords: [{ lat: 34.3120, lng: 133.8600 }, { lat: 34.4640, lng: 133.8070 }] },
        { mode: 'night-train', label: 'Sunrise 寢台特急', from: 'okayama-sta', to: 'tokyo-sta', durationMin: 430, viaCoords: [{ lat: 34.8270, lng: 134.6900 }, { lat: 34.7330, lng: 135.5000 }, { lat: 34.9860, lng: 135.7580 }, { lat: 35.1700, lng: 136.8820 }, { lat: 34.7030, lng: 137.7350 }, { lat: 35.0960, lng: 139.0780 }, { lat: 35.4660, lng: 139.6220 }] },
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
        { id: 'tokyo-sta', name: '東京站', coords: { lat: 35.6812, lng: 139.7671 }, desc: '紅磚站舎的中央車站，也是 Sunrise 寢台特急的發抵點。', kind: 'station', note: 'Sunrise 寢台特急抵達' },
        { id: 'shibuya-sky', name: '澀谷 Shibuya Sky', coords: { lat: 35.6585, lng: 139.7013 }, desc: '澀谷 Scramble Square 頂樓的露天展望台，三百六十度俯瞰東京。', kind: 'viewpoint' },
        { id: 'akihabara', name: '秋葉原', coords: { lat: 35.6984, lng: 139.7731 }, desc: '電器街與動漫次文化聖地，山手線轉乘途中的短停點。', kind: 'area' },
      ],
      segments: [
        { mode: 'train', label: 'JR 山手線', from: 'tokyo-sta', to: 'shibuya-sky', durationMin: 25 },
        { mode: 'train', label: 'JR 山手線', from: 'shibuya-sky', to: 'akihabara', durationMin: 20 },
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
        { id: 'tokyo-sta', name: '東京站', coords: { lat: 35.6812, lng: 139.7671 }, desc: '紅磚站舎的中央車站，也是 Sunrise 寢台特急的發抵點。', kind: 'station' },
        { id: 'narita-airport', name: '成田國際機場（NRT）', coords: { lat: 35.7719, lng: 140.3928 }, desc: '東京主要的國際機場，NEX 成田特快可直達。', kind: 'airport' },
      ],
      segments: [
        { mode: 'train', label: 'JR 山手線（承前日）', from: 'akihabara', to: 'tokyo-sta', durationMin: 5 },
        { mode: 'train', label: "N'EX 成田特快", from: 'tokyo-sta', to: 'narita-airport', durationMin: 60, viaCoords: [{ lat: 35.6070, lng: 140.1060 }] },
      ],
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
