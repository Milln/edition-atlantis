import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';
import icon from 'astro-icon';

// https://astro.build/config
export default defineConfig({
  site: 'https://edition-atlantis.github.io',
  base: '/edition-atlantis',
  output: 'static',
  integrations: [
    tailwind(),
    react(),
    icon(),
  ],
  i18n: {
    defaultLocale: 'de',
    locales: ['de', 'en', 'fr'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
