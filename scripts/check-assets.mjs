/**
 * Fails if the code points at a photo, video or sound that does not exist in public/.
 * Checks every quoted "/assets/…" or "/audio/…" path in src/ (file names with spaces included)
 * plus everything listed in src/data/projects.js (including generated lists).
 *   npm run check:assets
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { projects } from '../src/data/projects.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = path.join(ROOT, 'public');
const refs = new Map(); // url → first file that mentions it

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(jsx?|css)$/.test(entry.name)) {
      const text = fs.readFileSync(full, 'utf8');
      for (const [, url] of text.matchAll(/['"`(](\/(?:assets|audio)\/[^'"`)\n]+?)['"`)]/g)) {
        if (/\$\{|<|→|…|, \//.test(url)) continue; // template, placeholder or prose in a comment
        if (!refs.has(url)) refs.set(url, path.relative(ROOT, full));
      }
    }
  }
}
walk(path.join(ROOT, 'src'));

for (const p of projects) {
  const urls = [p.coverImage, p.videoUrl, ...(p.gridImages ?? []), ...(p.videoSources ?? []).map((s) => s.src)];
  urls.filter(Boolean).forEach((url) => refs.has(url) || refs.set(url, `src/data/projects.js (${p.id})`));
}

const missing = [...refs].filter(([url]) => !fs.existsSync(path.join(PUBLIC, decodeURI(url))));
if (missing.length) {
  console.error(`✗ ${missing.length} missing file(s) in public/:`);
  missing.forEach(([url, from]) => console.error(`  ${url}   ← ${from}`));
  process.exit(1);
}
console.log(`✓ all ${refs.size} referenced files exist in public/`);
