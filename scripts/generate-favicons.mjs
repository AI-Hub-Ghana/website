/**
 * generate-favicons.mjs
 * Resizes the source favicon (star.jpeg) into the required icon set.
 *
 * Outputs:
 *   public/images/favicon/favicon-32.png   — browser tab icon
 *   public/images/favicon/favicon-48.png   — browser tab icon (Windows)
 *   public/images/favicon/apple-touch-icon-180.png  — iOS home screen
 *   public/images/favicon/site-icon-192.png          — PWA / Android
 *   public/images/favicon/site-icon-512.png          — PWA splash / store
 *
 * Run: node scripts/generate-favicons.mjs
 */

import sharp from 'sharp';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const src = path.join(root, 'public', 'images', 'favicon', 'star.jpeg');
const outDir = path.join(root, 'public', 'images', 'favicon');

const targets = [
  { name: 'favicon-32.png',           size: 32  },
  { name: 'favicon-48.png',           size: 48  },
  { name: 'apple-touch-icon-180.png', size: 180 },
  { name: 'site-icon-192.png',        size: 192 },
  { name: 'site-icon-512.png',        size: 512 },
];

for (const { name, size } of targets) {
  const dest = path.join(outDir, name);
  await sharp(src)
    .resize(size, size, { fit: 'contain', background: { r: 242, g: 242, b: 239, alpha: 1 } })
    .png()
    .toFile(dest);
  console.log(`✓  ${name}  (${size}×${size})`);
}

console.log('\nDone. Update site.webmanifest and BaseLayout.astro if you haven\'t already.');
