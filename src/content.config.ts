import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

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
  }),
});

export const collections = { works, blog };
