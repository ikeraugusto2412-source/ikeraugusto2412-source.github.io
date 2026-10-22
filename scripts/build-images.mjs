/**
 * Generates the copies the site serves for every photo, plus a manifest (src/data/imageMeta.json)
 * with each photo's real size and a ThumbHash (a ~25-byte blurred preview shown while it loads).
 *
 *   /assets/ny/1.webp  →  /assets/ny/_w/1-640.webp   /assets/ny/_w/1-1280.webp      (srcset)
 *                         /assets/ny/_w/1-640.avif   /assets/ny/_w/1-1280.avif
 *                         /assets/ny/_w/1-full.avif                                  (lightbox)
 *
 * AVIF is ~20–30 % lighter than WebP; browsers without it fall back to the WebP files.
 * Originals are never modified. Existing copies are skipped, so it is cheap to re-run
 * after adding photos:  npm run images
 */
import sharp from 'sharp';
import { rgbaToThumbHash } from 'thumbhash';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const MANIFEST = path.join(ROOT, 'src/data/imageMeta.json');

// Folders whose .webp photos the site shows
const DIRS = [
  'assets/ny',
  'assets/london/webp',
  'assets/Noruega/webp',
  'assets/tour-de-france',
  'assets/hugo-bravo',
  'assets/salomon',
  'assets/the-weeknd',
  'assets/profile',
];
// Keep in sync with VARIANT_WIDTHS in src/lib/images.js
const WIDTHS = [640, 1280];
const VARIANT_DIR = '_w';

async function listWebp(dir) {
  const out = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== VARIANT_DIR) out.push(...(await listWebp(full)));
    } else if (entry.name.toLowerCase().endsWith('.webp')) {
      out.push(full);
    }
  }
  return out;
}

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function thumbHash(file) {
  // ThumbHash wants at most 100×100 px
  const { data, info } = await sharp(file)
    .resize(100, 100, { fit: 'inside' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  return Buffer.from(rgbaToThumbHash(info.width, info.height, data)).toString('base64');
}

const files = (await Promise.all(DIRS.map((d) => listWebp(path.join(PUBLIC, d))))).flat();
const manifest = {};
let written = 0;

async function processFile(file) {
  const meta = await sharp(file).metadata();
  const url = '/' + path.relative(PUBLIC, file).split(path.sep).join('/');
  manifest[url] = [meta.width, meta.height, await thumbHash(file)];

  const base = path.basename(file, path.extname(file));
  const outDir = path.join(path.dirname(file), VARIANT_DIR);
  await fs.mkdir(outDir, { recursive: true });

  const jobs = [];
  for (const w of WIDTHS) {
    if (meta.width <= w) continue; // never upscale: the original is served instead
    jobs.push([`${base}-${w}.webp`, (s) => s.resize({ width: w }).webp({ quality: 78, effort: 5 })]);
    jobs.push([`${base}-${w}.avif`, (s) => s.resize({ width: w }).avif({ quality: 52, effort: 4 })]);
  }
  jobs.push([`${base}-full.avif`, (s) => s.avif({ quality: 55, effort: 4 })]);

  for (const [name, encode] of jobs) {
    const out = path.join(outDir, name);
    if (await exists(out)) continue;
    await encode(sharp(file)).toFile(out);
    written += 1;
  }
}

// Small worker pool
const queue = [...files];
const workers = Array.from({ length: Math.max(2, os.cpus().length - 2) }, async () => {
  while (queue.length) await processFile(queue.shift());
});
await Promise.all(workers);

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await fs.writeFile(MANIFEST, JSON.stringify(sorted) + '\n');
console.log(`${files.length} photos indexed, ${written} new copies written → ${path.relative(ROOT, MANIFEST)}`);
