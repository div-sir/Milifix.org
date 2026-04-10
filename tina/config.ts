import { defineConfig } from 'tinacms';

export default defineConfig({
  clientId: process.env.TINA_CLIENT_ID ?? '',
  token: process.env.TINA_TOKEN ?? '',
  branch: process.env.TINA_BRANCH ?? process.env.VERCEL_GIT_COMMIT_REF ?? 'main',

  build: {
    outputFolder: 'admin',
    publicFolder: 'public',
  },

  media: {
    tina: {
      mediaRoot: 'uploads',
      publicFolder: 'public',
    },
  },

  schema: {
    collections: [
      // ─── Works ────────────────────────────────────────────────
      {
        name: 'works',
        label: 'Works',
        path: 'src/content/works',
        format: 'md',
        fields: [
          {
            name: 'title',
            label: 'Title',
            type: 'string',
            isTitle: true,
            required: true,
          },
          {
            name: 'space',
            label: 'Space',
            type: 'string',
            required: true,
            options: [
              { value: 'solilium', label: 'Solilium' },
              { value: 'voidlane', label: 'Voidlane' },
            ],
          },
          {
            name: 'date',
            label: 'Date (YYYY-MM)',
            type: 'string',
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'string',
            ui: { component: 'textarea' },
            required: true,
          },
          {
            name: 'cover',
            label: 'Cover Image URL',
            type: 'string',
            required: true,
          },
          {
            name: 'tags',
            label: 'Tags',
            type: 'string',
            list: true,
          },
          {
            name: 'cardVariant',
            label: 'Card Variant',
            type: 'string',
            options: [
              { value: 'standard', label: 'Standard (4 col)' },
              { value: 'featured', label: 'Featured (8 col)' },
              { value: 'compact', label: 'Compact (square)' },
              { value: 'cinema', label: 'Cinema (full width)' },
            ],
          },
          {
            name: 'pageVariant',
            label: 'Page Variant',
            type: 'string',
            options: [
              { value: 'classic', label: 'Classic' },
              { value: 'editorial', label: 'Editorial' },
              { value: 'immersive', label: 'Immersive' },
              { value: 'minimal', label: 'Minimal' },
            ],
          },
          {
            name: 'workType',
            label: 'Work Type',
            type: 'string',
            options: [
              { value: 'gallery', label: 'Gallery' },
              { value: 'article', label: 'Article' },
              { value: 'project', label: 'Project' },
            ],
          },
          {
            name: 'quote',
            label: 'Quote',
            type: 'string',
            ui: { component: 'textarea' },
          },
          {
            name: 'quoteAttribution',
            label: 'Quote Attribution',
            type: 'string',
          },
          {
            name: 'media',
            label: 'Media Gallery',
            type: 'object',
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.src ?? 'Media item' }),
            },
            fields: [
              {
                name: 'kind',
                label: 'Kind',
                type: 'string',
                required: true,
                options: [
                  { value: 'image', label: 'Image' },
                  { value: 'video', label: 'Video' },
                  { value: 'embed', label: 'Embed (YouTube/Vimeo)' },
                ],
              },
              {
                name: 'src',
                label: 'Source URL',
                type: 'string',
                required: true,
              },
              {
                name: 'alt',
                label: 'Alt Text',
                type: 'string',
              },
              {
                name: 'poster',
                label: 'Poster Image (video only)',
                type: 'string',
              },
              {
                name: 'title',
                label: 'Title (embed only)',
                type: 'string',
              },
              {
                name: 'caption',
                label: 'Caption',
                type: 'string',
              },
            ],
          },
          {
            name: 'body',
            label: 'Body',
            type: 'rich-text',
            isBody: true,
          },
        ],
      },

      // ─── Blog ─────────────────────────────────────────────────
      {
        name: 'blog',
        label: 'Blog',
        path: 'src/content/blog',
        format: 'md',
        fields: [
          {
            name: 'title',
            label: 'Title',
            type: 'string',
            isTitle: true,
            required: true,
          },
          {
            name: 'description',
            label: 'Description',
            type: 'string',
            ui: { component: 'textarea' },
            required: true,
          },
          {
            name: 'date',
            label: 'Date (YYYY-MM-DD)',
            type: 'string',
            required: true,
          },
          {
            name: 'draft',
            label: 'Draft',
            type: 'boolean',
          },
          {
            name: 'hideToc',
            label: 'Hide Table of Contents',
            type: 'boolean',
          },
          {
            name: 'hideInBlogIndex',
            label: 'Hide from Blog Index',
            type: 'boolean',
          },
          {
            name: 'body',
            label: 'Body',
            type: 'rich-text',
            isBody: true,
          },
        ],
      },
    ],
  },
});
