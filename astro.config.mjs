import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// PUBLIC_SITE_URL overrides the domain for preview / staging deployments.
const site = process.env.PUBLIC_SITE_URL || 'https://aihubghana.org';

export default defineConfig({
  site,
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
