/*
 * Gallery palettes (after jacobmckee.com's Colors page): the five dominant colours of each
 * gallery (k-means over tiny thumbnails) and, for every photo, the colour that covers most of it
 * → src/data/palettes.json. Run `npm run palette` after adding or changing photos.
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { projects } from '../src/data/projects.js';

const K = 5;
const dist = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

async function pixels(src) {
  const { data } = await sharp(path.join('public', src)).resize(24, 24, { fit: 'cover' }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const px = [];
  for (let i = 0; i < data.length; i += 3) px.push([data[i], data[i + 1], data[i + 2]]);
  return px;
}

function kmeans(px, k) {
  // spread the seeds by luminance so dark and light tones both get a centre
  const sorted = [...px].sort((a, b) => a[0] + a[1] + a[2] - (b[0] + b[1] + b[2]));
  let c = Array.from({ length: k }, (_, i) => sorted[Math.floor(((i + 0.5) / k) * sorted.length)]);
  for (let it = 0; it < 12; it++) {
    const sum = c.map(() => [0, 0, 0, 0]);
    for (const p of px) {
      let best = 0;
      for (let j = 1; j < k; j++) if (dist(p, c[j]) < dist(p, c[best])) best = j;
      sum[best][0] += p[0]; sum[best][1] += p[1]; sum[best][2] += p[2]; sum[best][3]++;
    }
    c = sum.map((s, j) => (s[3] ? [s[0] / s[3], s[1] / s[3], s[2] / s[3]] : c[j]));
  }
  return c.map((v) => v.map(Math.round));
}

const hex = (c) => '#' + c.map((v) => v.toString(16).padStart(2, '0')).join('');
const out = {};
for (const p of projects) {
  const photos = [];
  for (const src of p.gridImages) {
    if (!fs.existsSync(path.join('public', src))) continue;
    const px = await pixels(src);
    const avg = [0, 1, 2].map((i) => Math.round(px.reduce((s, q) => s + q[i], 0) / px.length));
    photos.push({ src, px, avg });
  }
  if (!photos.length) continue; // a gallery with no photos (e.g. a reel)
  const colours = kmeans(photos.flatMap((f) => f.px), K);
  const main = photos.map((f) => {
    // the colour that covers most of the photo
    const n = Array(K).fill(0);
    for (const q of f.px) {
      let b = 0;
      for (let j = 1; j < K; j++) if (dist(q, colours[j]) < dist(q, colours[b])) b = j;
      n[b]++;
    }
    return n.indexOf(Math.max(...n));
  });
  // drop colours no photo is mostly made of, so every swatch shows something
  const used = colours.map((_, j) => j).filter((j) => main.includes(j));
  out[p.id] = {
    colours: used.map((j) => hex(colours[j])),
    photos: Object.fromEntries(photos.map((f, i) => [f.src, used.indexOf(main[i])])),
  };
  console.log(p.id, out[p.id].colours.join(' '));
}
fs.writeFileSync('src/data/palettes.json', JSON.stringify(out));
