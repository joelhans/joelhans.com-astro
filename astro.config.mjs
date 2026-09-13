// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import remarkSmartypants from 'remark-smartypants';

import tailwindcss from '@tailwindcss/vite';

import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://joelhans.com',
  trailingSlash: 'always',
  redirects: {
    '/articles': '/blog',
    '/articles/[...slug]': '/blog/[...slug]',
  },
  markdown: {
    remarkPlugins: [remarkSmartypants],
  },
  integrations: [mdx(), sitemap(), icon()],

  vite: {
    plugins: [tailwindcss()],
  },
});