import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://edition-atlantis.github.io',
  base: '/edition-atlantis',
  output: 'static',
  integrations: [
    tailwind(),
    react(),
    // sitemap(),
  ],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
