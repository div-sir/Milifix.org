// @ts-check
import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import astro from 'eslint-plugin-astro';
import globals from 'globals';

// tseslint.config(...) 本身已標記 deprecated（改推薦 ESLint 核心的
// defineConfig）；typescript-eslint 匯出的個別 config 物件（recommended
// 等）本身沒問題，只是外層包裝函式換成 defineConfig。
export default defineConfig(
  {
    ignores: [
      'dist/**',
      '.astro/**',
      'node_modules/**',
      'payload-reference/**',
      // Meridiel 的第三方 vendor（npm pack 下載的 production 檔）與
      // scripts/build-meridiel.mjs 產生的編譯輸出，皆非手寫原始碼。
      'public/meridiel/vendor/**',
      'public/meridiel/app/compiled/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...astro.configs['flat/recommended'],

  // 全站共用的規則調整：這個 repo 在導入 ESLint 之前就存在大量既有風格
  // （var、短路求值當陳述式、靜默吞錯的空 catch），規則設定以「現況能
  // 全綠、不為了規則大改業務碼」為準，只挑真正的問題（unused-escape、
  // prefer-const 等）修，其餘用選項放行既有慣用寫法。
  {
    rules: {
      // 全站散落大量 <script is:inline> 與舊式 vanilla JS 慣用 var（含
      // meridiel 的全域腳本架構），非本輪要處理的範圍，逐一改寫風險
      // 大於收益。
      'no-var': 'off',
      // `cond && fn()`／三元運算式當陳述式使用，是站內 inline script 常見
      // 的簡短寫法（含 JSX `{cond && <El/>}` 條件渲染）。
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true, allowTernary: true },
      ],
      // 空 catch block 是站內慣用的「靜默吞錯」寫法（多半有註解說明原因）
      'no-empty': ['error', { allowEmptyCatch: true }],
      // catch (e) 綁定但不使用是常見的忽略錯誤寫法，不視為問題
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
    },
  },

  // src/**：一般 TS/TSX/JS 原始碼
  {
    files: ['src/**/*.{ts,tsx,js,jsx}', 'test/**/*.ts'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.es2021 },
    },
    rules: {
      // 站內大量用 any 銜接 Payload CMS 的鬆散型別（見 src/lib/cms.ts、
      // lexical.ts），全面禁用會需要大改業務碼，非本輪目標。
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },

  // scripts/**、api/**：Node.js 環境的一次性腳本／serverless function
  {
    files: ['scripts/**/*.{mjs,js,ts}', 'api/**/*.js', '*.config.{mjs,js,ts}'],
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },

  // public/meridiel/app/*.jsx|js：舊式「classic script + 全域變數」架構
  // （見 scripts/build-meridiel.mjs 開頭註解）。React/gsap/globe.gl/
  // html2canvas 由 vendor UMD 掛在 window 上，各檔案再互相用 window.X
  // 溝通，非 ES module，不做型別檢查（tsconfig 也排除了編譯後的版本；
  // 這裡對照的是手寫原始碼）。
  {
    files: ['public/meridiel/app/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        React: 'readonly',
        ReactDOM: 'readonly',
        Globe: 'readonly',
      },
    },
    rules: {
      // 全域腳本架構下大量 `window.X = ...` 匯出、`window.Y` 消費，
      // ESLint 看不到跨檔案關聯，no-undef 在這裡誤報過多；tsconfig 對
      // 這批檔案的 JSX/流程檢查已能抓到真正的型別問題。
      'no-undef': 'off',
    },
  },
);
