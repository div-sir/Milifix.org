import type { Lang } from './types';

const STRINGS: Record<
  Lang,
  {
    metaTitlePlatform: string;
    nav: {
      ariaNav: string;
      skip: string;
      menuOpen: string;
      menuClose: string;
      menuHidden: string;
      browseCreators: string;
      /** 平台首頁 Logo 文字 */
      logoPlatform: string;
      platform: string;
      works: string;
      about: string;
      contact: string;
      allWorks: string;
      themeToDark: string;
      themeToLight: string;
      langSwitcher: string;
      langMenuHint: string;
      navShowNav: string;
      navControlCluster: string;
      worksMenuAria: string;
      dockAria: string;
      /** 底部導覽：回到網站首頁 */
      dockHome: string;
      /** 底部導覽：捲動到頁面頂端 */
      dockScrollTop: string;
      /** 底部導覽：作品頁回到該創作者空間首頁 */
      dockBackToCreator: string;
      /** 底部導覽：本頁區塊導覽 aria 標籤 */
      dockOnPage: string;
      dockPfTitle: string;
      dockSpaceTitle: string;
      dockSpaceHero: string;
      dockSpaceWorks: string;
      dockSpaceAbout: string;
      /** 作品分區：圖庫 / 文章 / 專案 */
      workGalleryTitle: string;
      workArticleTitle: string;
      workProjectTitle: string;
      langShort: { en: string; zh: string; ja: string };
      langNames: { en: string; zh: string; ja: string };
    };
    platform: {
      heroTag: string;
      heroTitle: string;
      heroDesc: string;
      quoteBand: string;
      quoteBandAttr: string;
      sectionCreators: string;
      worksUnit: string;
      enter: string;
      footer: string;
      /** 首頁跑馬燈關鍵字 */
      marqueeItems: readonly string[];
      dockIntro: string;
      dockBuild: string;
      dockSpaces: string;
    };
    work: {
      prev: string;
      next: string;
      junctionAria: string;
      dockHero: string;
      dockStory: string;
      dockMedia: string;
    };
    travel: {
      navLabel: string;
      metaTitle: string;
      heroTag: string;
      heroTitle: string;
      heroDesc: string;
      sectionCards: string;
      sectionLounges: string;
      sectionAirlines: string;
      viewAll: string;
      cardListTitle: string;
      cardListDesc: string;
      loungeListTitle: string;
      loungeListDesc: string;
      airlineListTitle: string;
      airlineListDesc: string;
      annualFee: string;
      annualFeeWaived: string;
      bank: string;
      benefits: string;
      conditions: string;
      airport: string;
      terminal: string;
      openingHours: string;
      network: string;
      alliance: string;
      iataCode: string;
      relatedCards: string;
      relatedLounges: string;
      relatedAirlines: string;
      noResults: string;
      filterByBank: string;
      filterByAirport: string;
      filterByAlliance: string;
      allBanks: string;
      allAirports: string;
      allAlliances: string;
      benefitTypes: Record<string, string>;
      allianceNames: Record<string, string>;
      backToTravel: string;
      matrix: string;
      programs: string;
      programsDesc: string;
      programTypeNames: Record<string, string>;
      highlights: string;
      website: string;
    };
  }
> = {
  en: {
    metaTitlePlatform: 'Milifix — Studio & creator spaces',
    nav: {
      ariaNav: 'Main navigation',
      skip: 'Skip to main content',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      menuHidden: 'Menu',
      browseCreators: 'Browse spaces',
      logoPlatform: 'Milifix',
      platform: 'Milifix',
      works: 'Works',
      about: 'About',
      contact: 'Contact',
      allWorks: 'All works',
      themeToDark: 'Switch to dark theme',
      themeToLight: 'Switch to light theme',
      langSwitcher: 'Language',
      langMenuHint: 'Choose site language',
      navShowNav: 'Show navigation bar',
      navControlCluster: 'Language & theme',
      worksMenuAria: 'Jump to a work',
      dockAria: 'Quick dock',
      dockHome: 'Home',
      dockScrollTop: 'Back to top',
      dockBackToCreator: 'Creator',
      dockOnPage: 'On this page',
      dockPfTitle: 'Milifix home',
      dockSpaceTitle: 'Studio home',
      dockSpaceHero: 'Cover',
      dockSpaceWorks: 'Works',
      dockSpaceAbout: 'About',
      workGalleryTitle: 'Gallery',
      workArticleTitle: 'Articles',
      workProjectTitle: 'Projects',
      langShort: { en: 'EN', zh: '中', ja: 'JP' },
      langNames: {
        en: 'English',
        zh: '繁體中文',
        ja: '日本語',
      },
    },
    platform: {
      heroTag: 'Creative studio',
      heroTitle: 'Milifix',
      heroDesc:
        'Milifix curates independent creator spaces—each with its own portfolio, language, and rhythm. Start here, then step into a room that fits the work.',
      quoteBand:
        'A portfolio is not a trophy shelf—it is tempo. If the first screen and the last scroll feel like the same hand, the studio did its job.',
      quoteBandAttr: 'Milifix',
      sectionCreators: 'Creator spaces',
      worksUnit: 'works',
      enter: 'Enter →',
      footer: '© 2026 Milifix',
      marqueeItems: [
        'Milifix',
        'Spatial',
        'Typography',
        'Motion',
        'i18n',
        'Astro',
        'Static',
        'Light & dark',
      ],
      dockIntro: 'Cover',
      dockBuild: 'Approach',
      dockSpaces: 'Spaces',
    },
    work: {
      prev: '← Previous',
      next: 'Next →',
      junctionAria: 'Adjacent works',
      dockHero: 'Cover',
      dockStory: 'Case',
      dockMedia: 'Gallery',
    },
    travel: {
      navLabel: 'Travel',
      metaTitle: 'Travel — Credit Card Benefits',
      heroTag: 'Travel Benefits',
      heroTitle: 'Card × Travel',
      heroDesc: 'Compare Taiwan credit card benefits for airlines and airport lounges.',
      sectionCards: 'Credit Cards',
      sectionLounges: 'Lounges',
      sectionAirlines: 'Airlines',
      viewAll: 'View all →',
      cardListTitle: 'Credit Cards',
      cardListDesc: 'Browse all credit cards and their travel benefits.',
      loungeListTitle: 'Airport Lounges',
      loungeListDesc: 'Airport lounges accessible with credit cards.',
      airlineListTitle: 'Airlines',
      airlineListDesc: 'Airlines with credit card partnership benefits.',
      annualFee: 'Annual fee',
      annualFeeWaived: 'Waived',
      bank: 'Bank',
      benefits: 'Benefits',
      conditions: 'Conditions',
      airport: 'Airport',
      terminal: 'Terminal',
      openingHours: 'Hours',
      network: 'Network',
      alliance: 'Alliance',
      iataCode: 'IATA',
      relatedCards: 'Cards with this benefit',
      relatedLounges: 'Available lounges',
      relatedAirlines: 'Airline benefits',
      noResults: 'No results found.',
      filterByBank: 'Filter by bank',
      filterByAirport: 'Filter by airport',
      filterByAlliance: 'Filter by alliance',
      allBanks: 'All banks',
      allAirports: 'All airports',
      allAlliances: 'All alliances',
      benefitTypes: {
        lounge: 'Lounge',
        miles: 'Miles',
        'priority-boarding': 'Priority boarding',
        upgrade: 'Upgrade',
        baggage: 'Extra baggage',
        insurance: 'Travel insurance',
        'airport-transfer': 'Airport transfer',
        'airline-membership': 'Airline membership',
        'flight-discount': 'Flight discount',
        'duty-free-discount': 'Duty-free discount',
        cashback: 'Cashback',
        hotel: 'Hotel perks',
        'airport-parking': 'Airport parking',
        other: 'Other',
      },
      allianceNames: {
        'star-alliance': 'Star Alliance',
        oneworld: 'oneworld',
        skyteam: 'SkyTeam',
        none: 'Independent',
      },
      backToTravel: '← Travel',
      matrix: 'Matrix',
      programs: 'Programs',
      programsDesc: 'Lounge networks, hotel programs, and airline alliances.',
      programTypeNames: {
        'lounge-network': 'Lounge Networks',
        'hotel-program': 'Hotel Programs',
        'airline-alliance': 'Airline Alliances',
      },
      highlights: 'Highlights',
      website: 'Official website',
    },
  },
  zh: {
    metaTitlePlatform: 'Milifix — 工作室與創作空間',
    nav: {
      ariaNav: '主要導覽',
      skip: '略過導覽列',
      menuOpen: '開啟選單',
      menuClose: '關閉選單',
      menuHidden: '選單',
      browseCreators: '空間一覽',
      logoPlatform: 'Milifix',
      platform: 'Milifix',
      works: '作品',
      about: '關於',
      contact: '聯絡',
      allWorks: '全部作品',
      themeToDark: '切換深色',
      themeToLight: '切換淺色',
      langSwitcher: '語言',
      langMenuHint: '選擇網站語言',
      navShowNav: '顯示導覽列',
      navControlCluster: '語言與主題',
      worksMenuAria: '前往作品',
      dockAria: '快捷導覽',
      dockHome: '首頁',
      dockScrollTop: '回頂部',
      dockBackToCreator: '回創作者',
      dockOnPage: '本頁區塊',
      dockPfTitle: 'Milifix 首頁',
      dockSpaceTitle: '創作者首頁',
      dockSpaceHero: '封面',
      dockSpaceWorks: '作品',
      dockSpaceAbout: '關於',
      workGalleryTitle: '圖庫',
      workArticleTitle: '文章',
      workProjectTitle: '專案',
      langShort: { en: 'EN', zh: '中', ja: 'JP' },
      langNames: { en: 'English', zh: '繁體中文', ja: '日本語' },
    },
    platform: {
      heroTag: '創作工作室',
      heroTitle: 'Milifix',
      heroDesc:
        'Milifix 策展獨立創作空間——各自作品集、語系與節奏。從這裡出發，走進最對味的那一間。',
      quoteBand:
        '作品集不是獎盃櫃——是節奏。若第一眼與最後一捲都像同一雙手，工作室就盡責了。',
      quoteBandAttr: 'Milifix',
      sectionCreators: '創作者',
      worksUnit: '件作品',
      enter: '進入 →',
      footer: '© 2026 Milifix',
      marqueeItems: [
        'Milifix',
        '空間',
        '字體',
        '動效',
        '多語系',
        'Astro',
        '靜態',
        '深／淺色',
      ],
      dockIntro: '封面',
      dockBuild: '方法',
      dockSpaces: '空間',
    },
    work: {
      prev: '← 上一則',
      next: '下一則 →',
      junctionAria: '相鄰作品',
      dockHero: '封面',
      dockStory: '案例',
      dockMedia: '圖庫',
    },
    travel: {
      navLabel: '旅遊',
      metaTitle: '旅遊 — 信用卡權益比較',
      heroTag: '旅遊權益',
      heroTitle: '卡片 × 旅遊',
      heroDesc: '比較台灣信用卡的航空與機場貴賓室權益。',
      sectionCards: '信用卡',
      sectionLounges: '貴賓室',
      sectionAirlines: '航空公司',
      viewAll: '查看全部 →',
      cardListTitle: '信用卡一覽',
      cardListDesc: '瀏覽所有信用卡及其旅遊權益。',
      loungeListTitle: '機場貴賓室',
      loungeListDesc: '可用信用卡進入的機場貴賓室。',
      airlineListTitle: '航空公司',
      airlineListDesc: '與信用卡合作的航空公司權益。',
      annualFee: '年費',
      annualFeeWaived: '免年費',
      bank: '發卡銀行',
      benefits: '權益',
      conditions: '使用條件',
      airport: '機場',
      terminal: '航廈',
      openingHours: '營業時間',
      network: '聯盟網路',
      alliance: '航空聯盟',
      iataCode: 'IATA 代碼',
      relatedCards: '可使用的信用卡',
      relatedLounges: '可進入的貴賓室',
      relatedAirlines: '航空公司權益',
      noResults: '查無結果。',
      filterByBank: '依銀行篩選',
      filterByAirport: '依機場篩選',
      filterByAlliance: '依聯盟篩選',
      allBanks: '所有銀行',
      allAirports: '所有機場',
      allAlliances: '所有聯盟',
      benefitTypes: {
        lounge: '貴賓室',
        miles: '哩程',
        'priority-boarding': '優先登機',
        upgrade: '艙等升等',
        baggage: '額外行李',
        insurance: '旅遊保險',
        'airport-transfer': '機場接送',
        'airline-membership': '航空會員',
        'flight-discount': '機票折扣',
        'duty-free-discount': '免稅品折扣',
        cashback: '現金回饋',
        hotel: '飯店禮遇',
        'airport-parking': '機場停車',
        other: '其他',
      },
      allianceNames: {
        'star-alliance': '星空聯盟',
        oneworld: '寰宇一家',
        skyteam: '天合聯盟',
        none: '非聯盟',
      },
      backToTravel: '← 旅遊',
      matrix: '對照表',
      programs: '計畫與網路',
      programsDesc: '貴賓室網路、飯店計畫、航空聯盟的完整介紹。',
      programTypeNames: {
        'lounge-network': '貴賓室網路',
        'hotel-program': '飯店計畫',
        'airline-alliance': '航空聯盟',
      },
      highlights: '重點特色',
      website: '官方網站',
    },
  },
  ja: {
    metaTitlePlatform: 'Milifix — スタジオとクリエイタースペース',
    nav: {
      ariaNav: 'メインナビゲーション',
      skip: '本文へスキップ',
      menuOpen: 'メニューを開く',
      menuClose: 'メニューを閉じる',
      menuHidden: 'メニュー',
      browseCreators: 'スペース一覧',
      logoPlatform: 'Milifix',
      platform: 'Milifix',
      works: '作品',
      about: '概要',
      contact: '連絡',
      allWorks: 'すべての作品',
      themeToDark: 'ダークテーマへ',
      themeToLight: 'ライトテーマへ',
      langSwitcher: '言語',
      langMenuHint: '表示言語を選ぶ',
      navShowNav: 'ナビゲーションを表示',
      navControlCluster: '言語とテーマ',
      worksMenuAria: '作品へ移動',
      dockAria: 'クイックドック',
      dockHome: 'ホーム',
      dockScrollTop: 'トップへ',
      dockBackToCreator: 'クリエイター',
      dockOnPage: 'このページ',
      dockPfTitle: 'Milifix ホーム',
      dockSpaceTitle: 'スタジオのトップ',
      dockSpaceHero: 'カバー',
      dockSpaceWorks: '作品',
      dockSpaceAbout: '概要',
      workGalleryTitle: 'ギャラリー',
      workArticleTitle: '記事',
      workProjectTitle: 'プロジェクト',
      langShort: { en: 'EN', zh: '中', ja: 'JP' },
      langNames: { en: 'English', zh: '繁體中文', ja: '日本語' },
    },
    platform: {
      heroTag: 'クリエイティブスタジオ',
      heroTitle: 'Milifix',
      heroDesc:
        'Milifix は独立したクリエイタースペースをキュレーション—それぞれにポートフォリオ、言語、リズムがあります。ここから一歩入ってください。',
      quoteBand:
        'ポートフォリオはトロフィー棚ではない—テンポだ。最初の一瞥と最後のスクロールが同じ手の温度なら、スタジオは役目を果たした。',
      quoteBandAttr: 'Milifix',
      sectionCreators: 'クリエイタースペース',
      worksUnit: '作品',
      enter: '入る →',
      footer: '© 2026 Milifix',
      marqueeItems: [
        'Milifix',
        'Spatial',
        'Typography',
        'Motion',
        'i18n',
        'Astro',
        'Static',
        'Light / Dark',
      ],
      dockIntro: 'カバー',
      dockBuild: '進め方',
      dockSpaces: 'スペース',
    },
    work: {
      prev: '← 前へ',
      next: '次へ →',
      junctionAria: '隣接する作品',
      dockHero: 'カバー',
      dockStory: 'ケース',
      dockMedia: 'ギャラリー',
    },
    travel: {
      navLabel: 'Travel',
      metaTitle: 'Travel — Credit Card Benefits',
      heroTag: 'Travel Benefits',
      heroTitle: 'Card × Travel',
      heroDesc: 'Compare Taiwan credit card benefits for airlines and airport lounges.',
      sectionCards: 'Credit Cards',
      sectionLounges: 'Lounges',
      sectionAirlines: 'Airlines',
      viewAll: 'View all →',
      cardListTitle: 'Credit Cards',
      cardListDesc: 'Browse all credit cards and their travel benefits.',
      loungeListTitle: 'Airport Lounges',
      loungeListDesc: 'Airport lounges accessible with credit cards.',
      airlineListTitle: 'Airlines',
      airlineListDesc: 'Airlines with credit card partnership benefits.',
      annualFee: 'Annual fee',
      annualFeeWaived: 'Waived',
      bank: 'Bank',
      benefits: 'Benefits',
      conditions: 'Conditions',
      airport: 'Airport',
      terminal: 'Terminal',
      openingHours: 'Hours',
      network: 'Network',
      alliance: 'Alliance',
      iataCode: 'IATA',
      relatedCards: 'Cards with this benefit',
      relatedLounges: 'Available lounges',
      relatedAirlines: 'Airline benefits',
      noResults: 'No results found.',
      filterByBank: 'Filter by bank',
      filterByAirport: 'Filter by airport',
      filterByAlliance: 'Filter by alliance',
      allBanks: 'All banks',
      allAirports: 'All airports',
      allAlliances: 'All alliances',
      benefitTypes: {
        lounge: 'Lounge',
        miles: 'Miles',
        'priority-boarding': 'Priority boarding',
        upgrade: 'Upgrade',
        baggage: 'Extra baggage',
        insurance: 'Travel insurance',
        'airport-transfer': 'Airport transfer',
        'airline-membership': 'Airline membership',
        'flight-discount': 'Flight discount',
        'duty-free-discount': 'Duty-free discount',
        cashback: 'Cashback',
        hotel: 'Hotel perks',
        'airport-parking': 'Airport parking',
        other: 'Other',
      },
      allianceNames: {
        'star-alliance': 'Star Alliance',
        oneworld: 'oneworld',
        skyteam: 'SkyTeam',
        none: 'Independent',
      },
      backToTravel: '← Travel',
      matrix: 'Matrix',
      programs: 'Programs',
      programsDesc: 'Lounge networks, hotel programs, and airline alliances.',
      programTypeNames: {
        'lounge-network': 'Lounge Networks',
        'hotel-program': 'Hotel Programs',
        'airline-alliance': 'Airline Alliances',
      },
      highlights: 'Highlights',
      website: 'Official website',
    },
  },
};

export function ui(lang: Lang) {
  return STRINGS[lang];
}
