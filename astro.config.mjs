import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
//
// PUBLIC_SITE_URL must be set explicitly in each Vercel environment:
//   Production:        PUBLIC_SITE_URL=https://aihubghana.org
//   Preview/staging:   set to the preview deployment URL, or leave unset
//                      (canonical and sitemap URLs are omitted when unset)
const site = process.env.PUBLIC_SITE_URL || undefined;

export default defineConfig({
  ...(site ? { site } : {}),
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
