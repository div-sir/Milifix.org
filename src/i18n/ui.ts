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
      lab: string;
      dockLabTitle: string;
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
      /** 底部導覽：作品頁回到該創作者空間首頁 */
      dockBackToCreator: string;
      /** 底部導覽：本頁區塊導覽 aria 標籤 */
      dockOnPage: string;
      dockPfTitle: string;
      dockSpaceTitle: string;
      dockSpaceHero: string;
      dockSpaceWorks: string;
      dockSpaceAbout: string;
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
      lab: 'Lab',
      dockLabTitle: 'UI lab — components preview',
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
      dockBackToCreator: 'Creator',
      dockOnPage: 'On this page',
      dockPfTitle: 'Milifix home',
      dockSpaceTitle: 'Studio home',
      dockSpaceHero: 'Intro',
      dockSpaceWorks: 'Works',
      dockSpaceAbout: 'About',
      langShort: { en: 'EN', zh: '中', ja: '日' },
      langNames: {
        en: 'English',
        zh: 'Traditional Chinese',
        ja: 'Japanese',
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
      dockIntro: 'Intro',
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
      lab: '實驗室',
      dockLabTitle: '元件實驗室',
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
      dockBackToCreator: '回創作者',
      dockOnPage: '本頁區塊',
      dockPfTitle: 'Milifix 首頁',
      dockSpaceTitle: '創作者首頁',
      dockSpaceHero: '開場',
      dockSpaceWorks: '作品',
      dockSpaceAbout: '關於',
      langShort: { en: 'EN', zh: '中', ja: '日' },
      langNames: { en: '英文', zh: '繁體中文', ja: '日文' },
    },
    platform: {
      heroTag: '創作工作室',
      heroTitle: 'Milifix',
      heroDesc:
        'Milifix 策展獨立創作空間——各自作品集、語系與節奏。從這裡出發，走進最對味的那一間。',
      quoteBand:
        '作品集不是獎盃櫃——是節奏。若第一眼與最後一捲都像同一雙手，工作室就盡責了。',
      quoteBandAttr: 'Milifix',
      sectionCreators: '創作空間',
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
      dockIntro: '開場',
      dockBuild: '方法',
      dockSpaces: '空間',
    },
    work: {
      prev: '← 上一則',
      next: '下一則 →',
      junctionAria: '相鄰作品',
      dockHero: '開場',
      dockStory: '案例',
      dockMedia: '圖庫',
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
      lab: 'ラボ',
      dockLabTitle: 'UIラボ・コンポーネント',
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
      dockBackToCreator: 'クリエイター',
      dockOnPage: 'このページ',
      dockPfTitle: 'Milifix ホーム',
      dockSpaceTitle: 'スタジオのトップ',
      dockSpaceHero: 'イントロ',
      dockSpaceWorks: '作品',
      dockSpaceAbout: '概要',
      langShort: { en: 'EN', zh: '中', ja: '日' },
      langNames: { en: '英語', zh: '繁体字中国語', ja: '日本語' },
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
      dockIntro: 'イントロ',
      dockBuild: '進め方',
      dockSpaces: 'スペース',
    },
    work: {
      prev: '← 前へ',
      next: '次へ →',
      junctionAria: '隣接する作品',
      dockHero: 'ヒーロー',
      dockStory: 'ケース',
      dockMedia: 'ギャラリー',
    },
  },
};

export function ui(lang: Lang) {
  return STRINGS[lang];
}
