import type { Lang } from './types';

const STRINGS: Record<
  Lang,
  {
    metaTitlePlatform: string;
    metaDescPlatform: string;
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
      /** 首頁創作空間列表：BLOG / LUMIVEIL / TRAVEL 的簡介與計數單位 */
      blogTagline: string;
      lumiveilTagline: string;
      travelTagline: string;
      blogCountUnit: string;
      cardsCountUnit: string;
    };
    blog: {
      /** 文章頁側欄目錄 */
      tocAria: string;
      tocCollapse: string;
      tocExpand: string;
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
      annualFeeWaivable: string;
      annualFeeNotWaivable: string;
      supplementaryCard: string;
      supplementaryCardFree: string;
      signUpBonus: string;
      renewalBonus: string;
      insuranceTravel: string;
      insuranceOverseas: string;
      insuranceFlightDelay: string;
      insuranceBaggageDelay: string;
      insuranceBaggageLost: string;
      insuranceTripCancel: string;
      guestPolicy: string;
      requirePhysicalCard: string;
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
      membershipTiers: string;
      includedBenefits: string;
      tierGranted: string;
      /** Travel 首頁：統計數字單位 */
      statCardsLabel: string;
      statBanksLabel: string;
      statAirlinesLabel: string;
      statLoungesLabel: string;
      /** Travel 首頁：區塊跳轉 nav aria */
      jumpSectionAria: string;
      /** Travel 首頁：卡片搜尋/排序/篩選 */
      searchCardPlaceholder: string;
      searchCardAria: string;
      sortLabel: string;
      sortDefault: string;
      sortFeeAsc: string;
      sortFeeDesc: string;
      sortNameAsc: string;
      sortMostBenefits: string;
      bankFilterLabel: string;
      benefitFilterLabel: string;
      feeRangeLabel: string;
      feeUnlimited: string;
      feeMinAria: string;
      feeMaxAria: string;
      feeFree: string;
      feeUnlimitedShort: string;
      clearAllLabel: string;
      noCardsMatch: string;
      clearFiltersLabel: string;
      searchLoungePlaceholder: string;
      searchLoungeAria: string;
      /** 信用卡詳情頁：相關連結區塊 */
      relatedSectionTitle: string;
      relatedAirlinesGroupLabel: string;
      relatedLoungesGroupLabel: string;
      relatedProgramsGroupLabel: string;
      addToCompareLabel: string;
      noAnnualFeeJsonLd: string;
      supplementaryCardMax: (n: number) => string;
      officialCardPage: (bank: string) => string;
      largeAmountUnit: string;
      colonSeparator: string;
      /** 貴賓室詳情頁 */
      locationLabel: string;
      /** 比較 Modal */
      compareModalTitle: string;
      compareClearAllAria: string;
      compareCopyLinkAria: string;
      compareShareLabel: string;
      compareEmptyHint: string;
      /** 貴賓室卡片 */
      airlineLoungeLabel: string;
      /** 信用卡卡面 */
      viewDetailsCta: string;
    };
  }
> = {
  en: {
    metaTitlePlatform: 'Milifix — Studio & creator spaces',
    metaDescPlatform: 'Milifix — a studio of creator spaces, travel intelligence, and long-form notes on credit cards, lounges, airlines, and mileage.',
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
      blogTagline: 'Travel data archive, indexes, and long-form notes',
      lumiveilTagline: 'Reveal every step you have ever taken',
      travelTagline: 'Taiwan credit card airline & lounge benefits',
      blogCountUnit: 'Posts',
      cardsCountUnit: 'Cards',
    },
    blog: {
      tocAria: 'On this page',
      tocCollapse: 'Collapse',
      tocExpand: 'Expand',
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
      annualFeeWaivable: 'Waivable',
      annualFeeNotWaivable: 'Not waivable',
      supplementaryCard: 'Supplementary card',
      supplementaryCardFree: 'Free',
      signUpBonus: 'Sign-up bonus',
      renewalBonus: 'Renewal bonus',
      insuranceTravel: 'Travel accident',
      insuranceOverseas: 'Overseas accident',
      insuranceFlightDelay: 'Flight delay',
      insuranceBaggageDelay: 'Baggage delay',
      insuranceBaggageLost: 'Baggage lost',
      insuranceTripCancel: 'Trip cancel/shorten',
      guestPolicy: 'Guest policy',
      requirePhysicalCard: 'Physical card required',
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
      programs: 'Hotels & Alliances',
      programsDesc: 'Membership tiers and services across hotel programs and airline alliances.',
      programTypeNames: {
        'lounge-network': 'Lounge Networks',
        'hotel-program': 'Hotel Programs',
        'airline-alliance': 'Airline Alliances',
      },
      highlights: 'Highlights',
      website: 'Official website',
      membershipTiers: 'Membership tiers',
      includedBenefits: 'Included benefits',
      tierGranted: 'Card-granted',
      statCardsLabel: 'Cards',
      statBanksLabel: 'Banks',
      statAirlinesLabel: 'Airlines',
      statLoungesLabel: 'Lounges',
      jumpSectionAria: 'Jump to section',
      searchCardPlaceholder: 'Search card or bank…',
      searchCardAria: 'Search credit cards',
      sortLabel: 'Sort',
      sortDefault: 'Default',
      sortFeeAsc: 'Fee low→high',
      sortFeeDesc: 'Fee high→low',
      sortNameAsc: 'Name A→Z',
      sortMostBenefits: 'Most benefits',
      bankFilterLabel: 'Bank',
      benefitFilterLabel: 'Benefits',
      feeRangeLabel: 'Annual fee',
      feeUnlimited: 'All',
      feeMinAria: 'Minimum annual fee',
      feeMaxAria: 'Maximum annual fee',
      feeFree: 'Free',
      feeUnlimitedShort: '∞',
      clearAllLabel: 'Clear all',
      noCardsMatch: 'No cards match your filters',
      clearFiltersLabel: 'Clear filters',
      searchLoungePlaceholder: 'Search lounge, airport or code…',
      searchLoungeAria: 'Search lounges',
      relatedSectionTitle: 'Related',
      relatedAirlinesGroupLabel: 'Airlines',
      relatedLoungesGroupLabel: 'Lounges',
      relatedProgramsGroupLabel: 'Programs',
      addToCompareLabel: 'Add to compare',
      noAnnualFeeJsonLd: 'No annual fee',
      supplementaryCardMax: (n) => ` (max ${n})`,
      officialCardPage: () => 'Official card page',
      largeAmountUnit: 'M',
      colonSeparator: ': ',
      locationLabel: 'Location',
      compareModalTitle: 'Compare Cards',
      compareClearAllAria: 'Clear all cards',
      compareCopyLinkAria: 'Copy compare link',
      compareShareLabel: 'Share',
      compareEmptyHint: 'Tap + on cards to compare (up to 4)',
      airlineLoungeLabel: 'Airline Lounge',
      viewDetailsCta: 'View details →',
    },
  },
  zh: {
    metaTitlePlatform: 'Milifix — 工作室與創作空間',
    metaDescPlatform: 'Milifix — 匯集創作空間、旅行資訊與長文筆記，涵蓋信用卡、貴賓室、航空與哩程指南。',
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
      blogTagline: '旅行資料、分類索引與長文筆記',
      lumiveilTagline: '揭開你走過的每一步',
      travelTagline: '台灣信用卡航空與貴賓室權益比較',
      blogCountUnit: '篇文章',
      cardsCountUnit: '張卡片',
    },
    blog: {
      tocAria: '本篇章節',
      tocCollapse: '收合',
      tocExpand: '展開',
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
      annualFeeWaivable: '可減免',
      annualFeeNotWaivable: '不可減免',
      supplementaryCard: '附卡',
      supplementaryCardFree: '免年費',
      signUpBonus: '首刷禮',
      renewalBonus: '續卡禮',
      insuranceTravel: '旅平險',
      insuranceOverseas: '海外意外險',
      insuranceFlightDelay: '班機延誤',
      insuranceBaggageDelay: '行李延誤',
      insuranceBaggageLost: '行李遺失',
      insuranceTripCancel: '行程取消/縮短',
      guestPolicy: '帶人規定',
      requirePhysicalCard: '需出示實體卡',
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
        upgrade: '升等',
        baggage: '行李',
        insurance: '保險',
        'airport-transfer': '接送',
        'airline-membership': '會員',
        'flight-discount': '機票折扣',
        'duty-free-discount': '免稅折扣',
        cashback: '回饋',
        hotel: '飯店',
        'airport-parking': '停車',
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
      programs: '飯店與航空聯盟',
      programsDesc: '飯店計畫與航空聯盟的會籍等級與服務完整介紹。',
      programTypeNames: {
        'lounge-network': '貴賓室網路',
        'hotel-program': '飯店計畫',
        'airline-alliance': '航空聯盟',
      },
      highlights: '重點特色',
      website: '官方網站',
      membershipTiers: '會籍等級',
      includedBenefits: '固定禮遇',
      tierGranted: '白金卡贈送',
      statCardsLabel: '張信用卡',
      statBanksLabel: '家銀行',
      statAirlinesLabel: '家航空',
      statLoungesLabel: '間貴賓室',
      jumpSectionAria: '區塊快速跳轉',
      searchCardPlaceholder: '搜尋卡名或銀行…',
      searchCardAria: '搜尋信用卡',
      sortLabel: '排序',
      sortDefault: '預設',
      sortFeeAsc: '年費 低→高',
      sortFeeDesc: '年費 高→低',
      sortNameAsc: '卡名 A→Z',
      sortMostBenefits: '權益最多',
      bankFilterLabel: '銀行',
      benefitFilterLabel: '卡片特點',
      feeRangeLabel: '年費區間',
      feeUnlimited: '不限',
      feeMinAria: '年費下限',
      feeMaxAria: '年費上限',
      feeFree: '免費',
      feeUnlimitedShort: '不限',
      clearAllLabel: '清除全部',
      noCardsMatch: '找不到符合條件的卡片',
      clearFiltersLabel: '清除篩選',
      searchLoungePlaceholder: '搜尋貴賓室、機場或代碼…',
      searchLoungeAria: '搜尋貴賓室',
      relatedSectionTitle: '相關連結',
      relatedAirlinesGroupLabel: '航空公司',
      relatedLoungesGroupLabel: '機場貴賓室',
      relatedProgramsGroupLabel: '旅遊計畫',
      addToCompareLabel: '加入比較',
      noAnnualFeeJsonLd: '免年費',
      supplementaryCardMax: (n) => `（最多 ${n} 張）`,
      officialCardPage: (bank) => `${bank}官方卡片介紹`,
      largeAmountUnit: '萬',
      colonSeparator: '：',
      locationLabel: '位置',
      compareModalTitle: '卡片比較',
      compareClearAllAria: '清除所有卡片',
      compareCopyLinkAria: '複製比較連結',
      compareShareLabel: '複製連結',
      compareEmptyHint: '點選卡片上的 ＋ 加入比較（最多 4 張）',
      airlineLoungeLabel: '航空公司貴賓室',
      viewDetailsCta: '查看詳情 →',
    },
  },
  ja: {
    metaTitlePlatform: 'Milifix — スタジオとクリエイタースペース',
    metaDescPlatform: 'Milifix — クリエイタースペース、旅行情報、そしてカード・ラウンジ・航空・マイルの長文ノートを集めたスタジオ。',
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
      blogTagline: '旅行データ、分類インデックス、長文ノート',
      lumiveilTagline: '歩いてきた道を、光で明かす',
      travelTagline: '台湾のクレジットカードによる航空・ラウンジ特典比較',
      blogCountUnit: '記事',
      cardsCountUnit: 'カード',
    },
    blog: {
      tocAria: 'このページの見出し',
      tocCollapse: '閉じる',
      tocExpand: '開く',
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
      annualFeeWaivable: 'Waivable',
      annualFeeNotWaivable: 'Not waivable',
      supplementaryCard: 'Supplementary card',
      supplementaryCardFree: 'Free',
      signUpBonus: 'Sign-up bonus',
      renewalBonus: 'Renewal bonus',
      insuranceTravel: 'Travel accident',
      insuranceOverseas: 'Overseas accident',
      insuranceFlightDelay: 'Flight delay',
      insuranceBaggageDelay: 'Baggage delay',
      insuranceBaggageLost: 'Baggage lost',
      insuranceTripCancel: 'Trip cancel/shorten',
      guestPolicy: 'Guest policy',
      requirePhysicalCard: 'Physical card required',
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
      membershipTiers: 'Membership tiers',
      includedBenefits: 'Included benefits',
      tierGranted: 'Card-granted',
      statCardsLabel: 'カード',
      statBanksLabel: '銀行',
      statAirlinesLabel: '航空会社',
      statLoungesLabel: 'ラウンジ',
      jumpSectionAria: 'セクションへ移動',
      searchCardPlaceholder: 'カード名や銀行で検索…',
      searchCardAria: 'クレジットカードを検索',
      sortLabel: '並び替え',
      sortDefault: '既定',
      sortFeeAsc: '年会費 安い→高い',
      sortFeeDesc: '年会費 高い→安い',
      sortNameAsc: 'カード名 A→Z',
      sortMostBenefits: '特典が多い順',
      bankFilterLabel: '銀行',
      benefitFilterLabel: 'カードの特徴',
      feeRangeLabel: '年会費の範囲',
      feeUnlimited: '指定なし',
      feeMinAria: '年会費の下限',
      feeMaxAria: '年会費の上限',
      feeFree: '無料',
      feeUnlimitedShort: '∞',
      clearAllLabel: 'すべてクリア',
      noCardsMatch: '条件に一致するカードが見つかりません',
      clearFiltersLabel: 'フィルターをクリア',
      searchLoungePlaceholder: 'ラウンジ・空港・コードで検索…',
      searchLoungeAria: 'ラウンジを検索',
      relatedSectionTitle: '関連情報',
      relatedAirlinesGroupLabel: '航空会社',
      relatedLoungesGroupLabel: '空港ラウンジ',
      relatedProgramsGroupLabel: 'プログラム',
      addToCompareLabel: '比較に追加',
      noAnnualFeeJsonLd: '年会費無料',
      supplementaryCardMax: (n) => `（最大 ${n} 枚）`,
      officialCardPage: (bank) => `${bank} 公式サイト`,
      largeAmountUnit: '万',
      colonSeparator: '：',
      locationLabel: '場所',
      compareModalTitle: 'カード比較',
      compareClearAllAria: 'すべてのカードをクリア',
      compareCopyLinkAria: '比較リンクをコピー',
      compareShareLabel: '共有',
      compareEmptyHint: 'カードの＋をタップして比較（最大4枚）',
      airlineLoungeLabel: '航空会社直営ラウンジ',
      viewDetailsCta: '詳細を見る →',
    },
  },
};

export function ui(lang: Lang) {
  return STRINGS[lang];
}
