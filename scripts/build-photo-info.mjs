/*
 * Camera data for every gallery photo (after mamuso.dev's per-photo sheet), read from the
 * original JPGs in originals/ with macOS Spotlight metadata (mdls) → src/data/photoInfo.json,
 * keyed by the photo's public path. Run `npm run photo-info` after adding photos (macOS only).
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';
import { projects } from '../src/data/projects.js';

const ROOT = 'originals/public/assets';
const KEYS = ['kMDItemAcquisitionModel', 'kMDItemLensModel', 'kMDItemFNumber', 'kMDItemExposureTimeSeconds', 'kMDItemISOSpeed', 'kMDItemFocalLength', 'kMDItemContentCreationDate'];

const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.jpe?g$/i.test(f) ? [p] : [];
  });

const stem = (p) => basename(p, extname(p));
const flat = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

const originals = {};
for (const file of walk(ROOT)) (originals[stem(file)] ??= []).push(file);

// Same file name in two folders (e.g. "foto portada 1"): take the one whose folder matches the photo's
function originalFor(src) {
  const candidates = originals[stem(src)] ?? [];
  const folder = flat(src.split('/')[2] ?? '');
  return candidates.find((c) => flat(c).includes(folder)) ?? candidates[0];
}

function read(file) {
  const raw = execFileSync('mdls', KEYS.flatMap((k) => ['-name', k]).concat(file), { encoding: 'utf8' });
  const v = Object.fromEntries(
    raw.split('\n').filter(Boolean).map((l) => {
      const [k, ...rest] = l.split('=');
      return [k.trim(), rest.join('=').trim().replace(/^"|"$/g, '')];
    }),
  );
  const has = (k) => v[k] && v[k] !== '(null)';
  if (!has('kMDItemAcquisitionModel')) return null;
  const t = Number(v.kMDItemExposureTimeSeconds);
  return {
    camera: v.kMDItemAcquisitionModel.replace('EOS R6m2', 'EOS R6 Mark II').replace(/^D-LUX/, 'Leica D-LUX'),
    lens: has('kMDItemLensModel') ? v.kMDItemLensModel : null,
    f: Number(v.kMDItemFNumber) || null,
    shutter: t ? (t >= 1 ? `${t}s` : `1/${Math.round(1 / t)}`) : null,
    iso: Number(v.kMDItemISOSpeed) || null,
    focal: Number(v.kMDItemFocalLength) || null,
    // the 2008 Leica's clock was never set (it says 2009), so dates that early are left out
    date: has('kMDItemContentCreationDate') && v.kMDItemContentCreationDate >= '2015' ? v.kMDItemContentCreationDate.slice(0, 10) : null,
  };
}

const out = {};
let missing = 0;
for (const p of projects) {
  for (const src of p.gridImages) {
    const file = originalFor(src);
    const info = file && read(file);
    if (info) out[src] = info;
    else missing++;
  }
}
writeFileSync('src/data/photoInfo.json', JSON.stringify(out));
console.log(`${Object.keys(out).length} photos with camera data, ${missing} without`);
