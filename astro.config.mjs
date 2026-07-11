// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';

import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import rehypeSlug from 'rehype-slug';

// https://astro.build/config
export default defineConfig({
  site: 'https://milifix.com',

  vite: {
    plugins: [tailwindcss()]
  },

  // 預載入頁內連結，減少頁面切換延遲
  prefetch: true,

  build: {
    // 小於 4KB 的 CSS 自動內聯，減少額外請求
    inlineStylesheets: 'auto',
  },

  // 允許最佳化外部圖片網域（domains 為舊式白名單；remotePatterns 涵蓋
  // UploadThing 的兩個網域，為後續全面轉 astro:assets <Image> 鋪路）
  image: {
    domains: ['images.unsplash.com'],
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: '*.ufs.sh' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },

  markdown: {
    rehypePlugins: [rehypeSlug],
  },

  // babel 設成函式可避免 @vitejs/plugin-react 在 configResolved 刪除 transform，
  // 進而繞過 Vite 外掛快取與動態刪除 hook 不同步的間歇性錯誤（vitejs/vite#21162）。
  integrations: [
    react({
      babel: () => ({ plugins: [] })
    }),
    sitemap({
      // linktree 為 noindex 頁，不納入 sitemap
      filter: (page) => !/\/linktree\/?$/.test(page),
    })
  ]
});