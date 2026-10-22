/**
 * Renders the site icons (browser tab, iPhone home screen, Android) from the navbar
 * wordmark "Ik." in Space Mono, white on the site's black. Run once: node scripts/build-icons.mjs
 */
import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PUBLIC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public');
const ICONS = [
  { file: 'favicon-48.png', size: 48, radius: 0.22 },
  { file: 'apple-touch-icon.png', size: 180, radius: 0 }, // iOS rounds the corners itself
  { file: 'icon-192.png', size: 192, radius: 0.22 },
  { file: 'icon-512.png', size: 512, radius: 0.22 },
];

const browser = await chromium.launch();
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const { file, size, radius } of ICONS) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<!doctype html><html><head>
    <link href="https://fonts.googleapis.com/css2?family=Space+Mono&display=block" rel="stylesheet">
    <style>
      html,body{margin:0;background:transparent}
      div{width:${size}px;height:${size}px;background:#050505;border-radius:${radius * size}px;
          display:flex;align-items:center;justify-content:center;
          font-family:'Space Mono',monospace;color:#fff;font-size:${size * 0.36}px;letter-spacing:-0.04em}
    </style></head><body><div>Ik.</div></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(PUBLIC, file), omitBackground: true });
  console.log('wrote', file);
}
await browser.close();
