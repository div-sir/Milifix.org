import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const workMediaItemSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('image'),
    src: z.string(),
    alt: z.string().optional(),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal('video'),
    /** 影片檔網址（mp4 / webm 等，用原生 <video>） */
    src: z.string(),
    poster: z.string().optional(),
    caption: z.string().optional(),
  }),
  z.object({
    kind: z.literal('embed'),
    /** 嵌入網址（YouTube/Vimeo 的 embed URL） */
    src: z.string(),
    title: z.string().optional(),
    caption: z.string().optional(),
  }),
]);

const works = defineCollection({
  loader: glob({ base: './src/content/works', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    slug: z.string().optional(),
    /** 所屬創作者空間，對應網址 /{space}/… */
    space: z.enum(['solilium', 'voidlane', 'lumenlab']),
    tags: z.array(z.string()),
    cover: z.string(),
    date: z.string(),
    description: z.string(),
    quote: z.string().optional(),
    quoteAttribution: z.string().optional(),
    /** 列表頁卡片版型 */
    cardVariant: z.enum(['standard', 'featured', 'compact', 'cinema']).default('standard'),
    /** 作品內頁版型與特效基調 */
    pageVariant: z.enum(['classic', 'editorial', 'immersive', 'minimal']).default('classic'),
    /** 作品分類（用於空間首頁分區顯示；沒填時會用推斷） */
    workType: z.enum(['gallery', 'article', 'project']).optional(),
    /** 內文後方的圖庫／影片列（可選） */
    media: z.array(workMediaItemSchema).optional(),
  }),
});

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/*.md' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.string(),
    /** 設為 true 則不產生靜態頁 */
    draft: z.boolean().default(false),
    /** 為 true 時不顯示文章側邊浮動目錄 */
    hideToc: z.boolean().optional(),
  }),
});

export const collections = { works, blog };
