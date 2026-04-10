// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import rehypeSlug from 'rehype-slug';

// https://astro.build/config
export default defineConfig({
  vite: {
    plugins: [tailwindcss()]
  },

  // 預載入頁內連結，減少頁面切換延遲
  prefetch: true,

  build: {
    // 小於 4KB 的 CSS 自動內聯，減少額外請求
    inlineStylesheets: 'auto',
  },

  // 允許最佳化外部圖片網域
  image: {
    domains: ['images.unsplash.com'],
  },

  markdown: {
    rehypePlugins: [rehypeSlug],
  },

  // babel 設成函式可避免 @vitejs/plugin-react 在 configResolved 刪除 transform，
  // 進而繞過 Vite 外掛快取與動態刪除 hook 不同步的間歇性錯誤（vitejs/vite#21162）。
  integrations: [
    react({
      babel: () => ({ plugins: [] })
    })
  ]
});