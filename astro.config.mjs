import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
//
const isVercelPreview = process.env.VERCEL_ENV === 'preview';
const site = isVercelPreview
  ? undefined
  : process.env.VERCEL_ENV === 'production'
    ? 'https://aihubghana.org'
    : process.env.PUBLIC_SITE_URL || undefined;

export default defineConfig({
  ...(site ? { site } : {}),
  output: 'static',
  integrations: site ? [sitemap()] : [],
  vite: {
    plugins: [tailwindcss()],
  },
});
