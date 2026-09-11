import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
const site = process.env.PUBLIC_SITE_URL;

export default defineConfig({
  ...(site ? { site } : {}),
  output: 'static',
  vite: {
    plugins: [tailwindcss()],
  },
});
