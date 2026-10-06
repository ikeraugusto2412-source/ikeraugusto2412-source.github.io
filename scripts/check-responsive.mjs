#!/usr/bin/env node
/**
 * Responsive check — runs the site through a matrix of iPhone / Android / tablet / desktop
 * viewports (portrait + landscape), every main route, in ES and EN, and reports:
 *   - real horizontal scroll (tries to scroll sideways)
 *   - visible elements sticking out of the viewport (unless an ancestor clips them)
 *   - clipped text (content wider than its overflow-hidden box)
 *   - tap targets smaller than 44×44 px (warning)
 *   - console errors / warnings / page errors
 * Screenshots go to screenshots-responsive/ (git-ignored).
 *
 * iPhones and the tablet run in WebKit (closest to iOS Safari); Android and desktop in Chromium.
 *
 * Usage:
 *   npm run check:responsive                 full matrix
 *   npm run check:responsive -- --quick      key iPhones, portrait, ES only
 *   npm run check:responsive -- --size=375x667 --route=/about --lang=es --full
 *   flags: --size=WxH[,WxH]  --route=/a[,/b]  --lang=es|en  --portrait  --no-shots  --full (full-page shots)
 *          --prod (build + serve the production bundle: much faster for the full matrix)  --jobs=N
 *          --url=http://localhost:5173 (reuse a running server instead of starting one)
 */
import { webkit, chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Messages that come from the embedded Instagram iframe, the headless GPU or emulator timing — not from the site
const THIRD_PARTY_NOISE =
  /Permissions-Policy header|upgrade-insecure-requests' is ignored when delivered in a report-only policy|GL Driver Message|was preloaded using link preload but not used/;

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'screenshots-responsive');
const PORT = 5317;

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const IPAD_UA =
  'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';

const MATRIX = [
  { name: 'iPhone SE / 8', w: 375, h: 667, engine: 'webkit', dpr: 2, ua: IOS_UA, key: true },
  { name: 'iPhone X/11 Pro/12-13 mini', w: 375, h: 812, engine: 'webkit', dpr: 3, ua: IOS_UA, key: true },
  { name: 'iPhone 12/13/14', w: 390, h: 844, engine: 'webkit', dpr: 3, ua: IOS_UA },
  { name: 'iPhone 14 Pro/15/16', w: 393, h: 852, engine: 'webkit', dpr: 3, ua: IOS_UA },
  { name: 'iPhone 16 Pro/17/17 Pro', w: 402, h: 874, engine: 'webkit', dpr: 3, ua: IOS_UA },
  { name: 'iPhone 11/XR/11 Pro Max', w: 414, h: 896, engine: 'webkit', dpr: 2, ua: IOS_UA, key: true },
  { name: 'iPhone Air', w: 420, h: 912, engine: 'webkit', dpr: 3, ua: IOS_UA },
  { name: 'iPhone 12-13 Pro Max/14 Plus', w: 428, h: 926, engine: 'webkit', dpr: 3, ua: IOS_UA },
  { name: 'iPhone 14 Pro Max/15-16 Plus', w: 430, h: 932, engine: 'webkit', dpr: 3, ua: IOS_UA },
  { name: 'iPhone 16-18 Pro Max', w: 440, h: 956, engine: 'webkit', dpr: 3, ua: IOS_UA, key: true },
  { name: 'Android 360', w: 360, h: 800, engine: 'chromium', dpr: 3, ua: ANDROID_UA },
  { name: 'Android 412', w: 412, h: 915, engine: 'chromium', dpr: 2.625, ua: ANDROID_UA },
  { name: 'Tablet portrait', w: 768, h: 1024, engine: 'webkit', dpr: 2, ua: IPAD_UA },
  { name: 'Desktop', w: 1440, h: 900, engine: 'chromium', dpr: 1, desktop: true },
];

const ROUTES = [
  '/',
  '/works',
  '/about',
  '/contact',
  '/project/new-york',
  '/project/london',
  '/project/norway',
  '/project/huck-knife-pro',
  '/project/tour-de-france',
];

// ─── CLI ──────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v ?? true];
  }),
);
let matrix = MATRIX;
if (args.quick) matrix = MATRIX.filter((m) => m.key);
if (args.size) {
  const sizes = String(args.size).split(',');
  matrix = MATRIX.filter((m) => sizes.includes(`${m.w}x${m.h}`));
}
const routes = args.route ? String(args.route).split(',') : ROUTES;
const langs = args.lang ? [String(args.lang)] : args.quick ? ['es'] : ['es', 'en'];
const orientations = args.portrait || args.quick ? ['portrait'] : ['portrait', 'landscape'];
const takeShots = !args['no-shots'];
const fullPage = Boolean(args.full);
const CONCURRENCY = Number(args.jobs || 4);

// ─── Dev server ───────────────────────────────────────────────
async function waitFor(url, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  throw new Error(`Server did not start at ${url}`);
}

let server = null;
let BASE = args.url ? String(args.url).replace(/\/$/, '') : `http://localhost:${PORT}`;
if (!args.url) {
  const vite = path.join(ROOT, 'node_modules/vite/bin/vite.js');
  if (args.prod) {
    // --prod: build once and serve the bundle — much faster than the dev server for 400+ pages
    console.log('Building production bundle…');
    await new Promise((resolve, reject) =>
      spawn(process.execPath, [vite, 'build'], { cwd: ROOT, stdio: 'ignore' }).on('exit', (code) =>
        code === 0 ? resolve() : reject(new Error('vite build failed')),
      ),
    );
  }
  // Run Vite's binary directly (not through npx) so killing it really stops the server
  server = spawn(process.execPath, [vite, ...(args.prod ? ['preview'] : []), '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  await waitFor(BASE);
}

// ─── In-page checks ───────────────────────────────────────────
function pageChecks() {
  const vw = document.documentElement.clientWidth;
  const out = { hScroll: false, offscreen: [], clippedText: [], smallTargets: [] };

  // Real horizontal scroll: try to move sideways
  const y = window.scrollY;
  window.scrollTo(200, y);
  out.hScroll = window.scrollX > 0;
  window.scrollTo(0, y);

  const visible = (el, cs) =>
    cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0.01;
  const describe = (el) => {
    const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : '';
    const txt = (el.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 30);
    return `${el.tagName.toLowerCase()}${cls ? '.' + cls : ''}${txt ? ` "${txt}"` : ''}`;
  };
  // An element sticking out is fine if some ancestor *inside the viewport* clips it.
  // html/body don't count: overflow-x on them only hides the scrollbar, the page is still wider.
  const clippedByAncestor = (el) => {
    for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (/(hidden|clip|auto|scroll)/.test(cs.overflowX) || cs.clipPath !== 'none') {
        const pr = p.getBoundingClientRect();
        if (pr.left >= -1 && pr.right <= vw + 1) return true;
      }
    }
    return false;
  };

  const reported = new Set();
  for (const el of document.body.querySelectorAll('*')) {
    if (el.closest('[aria-hidden="true"], svg, canvas, script, style')) continue;
    const cs = getComputedStyle(el);
    if (!visible(el, cs)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;

    // Out of viewport horizontally
    if ((r.right > vw + 1 || r.left < -1) && !clippedByAncestor(el)) {
      if (![...reported].some((p) => p.contains(el))) {
        reported.add(el);
        out.offscreen.push(`${describe(el)} [${Math.round(r.left)}→${Math.round(r.right)} of ${vw}]`);
      }
    }

    // Clipped text: element with its own text whose content is wider than its clipping box
    const ownText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    // text-overflow: ellipsis is a deliberate truncation (e.g. the YouTube-style video title), not a bug
    if (ownText && /(hidden|clip)/.test(cs.overflowX) && cs.textOverflow !== 'ellipsis' && el.scrollWidth > el.clientWidth + 2) {
      out.clippedText.push(`${describe(el)} (${el.scrollWidth}>${el.clientWidth})`);
    }

    // Tap targets (inline links inside running text are exempt, per WCAG 2.5.8)
    // 44 px is a touch rule: only enforced where the primary pointer is coarse
    if (matchMedia('(pointer: coarse)').matches && el.matches('a[href], button, [role="button"], input, select, textarea, [role="switch"]')) {
      const inline = cs.display === 'inline' && el.parentElement && /^(P|LI|SPAN)$/.test(el.parentElement.tagName);
      const onScreen = r.bottom > 0 && r.top < window.innerHeight * 4;
      // hit area can be enlarged by an absolutely positioned ::before/::after with negative insets
      let hitW = r.width;
      let hitH = r.height;
      for (const pseudo of ['::before', '::after']) {
        const ps = getComputedStyle(el, pseudo);
        if (ps.content === 'none' || ps.position !== 'absolute') continue;
        const out = (v) => Math.max(0, -parseFloat(v) || 0);
        hitW = Math.max(hitW, r.width + out(ps.left) + out(ps.right));
        hitH = Math.max(hitH, r.height + out(ps.top) + out(ps.bottom));
      }
      if (!inline && onScreen && (hitW < 44 || hitH < 44) && el.getAttribute('tabindex') !== '-1') {
        out.smallTargets.push(`${describe(el)} ${Math.round(hitW)}×${Math.round(hitH)}`);
      }
    }
  }
  out.offscreen = out.offscreen.slice(0, 15);
  out.clippedText = out.clippedText.slice(0, 15);
  out.smallTargets = [...new Set(out.smallTargets)].slice(0, 20);
  return out;
}

// ─── Runner ───────────────────────────────────────────────────
const jobs = [];
for (const m of matrix) {
  for (const orient of m.desktop ? ['landscape'] : orientations) {
    const [w, h] = orient === 'landscape' && !m.desktop ? [m.h, m.w] : [m.w, m.h];
    for (const lang of langs) for (const route of routes) jobs.push({ m, orient, w, h, lang, route });
  }
}

const browsers = {};
const getBrowser = async (engine) => (browsers[engine] ??= await (engine === 'webkit' ? webkit : chromium).launch());

fs.mkdirSync(OUT, { recursive: true });
const results = [];
let done = 0;

async function runJob({ m, orient, w, h, lang, route }) {
  const browser = await getBrowser(m.engine);
  const ctx = await browser.newContext({
    viewport: { width: w, height: h },
    deviceScaleFactor: m.dpr,
    isMobile: !m.desktop,
    hasTouch: !m.desktop,
    userAgent: m.ua,
  });
  await ctx.addInitScript((lang) => {
    try {
      localStorage.setItem('language', lang);
      sessionStorage.setItem('ik-preloader-seen', '1');
    } catch {
      /* ignore */
    }
    // Desktop WebKit/Chromium draw a 12–15 px classic scrollbar that phones don't have (iOS/Android
    // use overlay scrollbars). It narrows the visual viewport and fakes a sideways scroll, so hide it.
    document.addEventListener('DOMContentLoaded', () => {
      const s = document.createElement('style');
      s.textContent = 'html::-webkit-scrollbar,body::-webkit-scrollbar{display:none}html{scrollbar-width:none}';
      document.head.appendChild(s);
    });
  }, lang);
  const page = await ctx.newPage();
  const consoleMsgs = [];
  page.on('console', (msg) => {
    if (['error', 'warning'].includes(msg.type()) && !THIRD_PARTY_NOISE.test(msg.text())) consoleMsgs.push(`${msg.type()}: ${msg.text().slice(0, 160)}`);
  });
  page.on('pageerror', (e) => consoleMsgs.push(`pageerror: ${e.message.slice(0, 160)}`));

  let checks = null;
  let error = null;
  try {
    await page.goto(BASE + route, { waitUntil: 'load', timeout: 45000 });
    // project pages open with a ~3 s intro overlay
    await page
      .waitForFunction(() => !document.querySelector('.gallery-intro-overlay'), null, { timeout: 7000 })
      .catch(() => {});
    await page.waitForTimeout(900);
    // scroll through the page so in-view reveals and lazy images settle, then back to top
    await page.evaluate(async () => {
      const step = window.innerHeight * 0.8;
      const max = document.documentElement.scrollHeight;
      for (let y = 0; y < max; y += step) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 90));
      }
      await new Promise((r) => setTimeout(r, 500));
    });
    checks = await page.evaluate(pageChecks);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    if (takeShots) {
      const dir = path.join(OUT, `${w}x${h}-${m.engine}`);
      fs.mkdirSync(dir, { recursive: true });
      const file = `${lang}${route === '/' ? '-home' : route.replace(/\//g, '-')}.png`;
      await page.screenshot({ path: path.join(dir, file), fullPage, scale: 'css' });
    }
  } catch (e) {
    error = e.message.split('\n')[0];
  }
  await ctx.close();
  done += 1;
  process.stdout.write(`\r  ${done}/${jobs.length} pages checked`);
  results.push({ name: m.name, engine: m.engine, size: `${w}x${h}`, orient, lang, route, checks, console: consoleMsgs, error });
}

console.log(`Checking ${jobs.length} pages (${matrix.length} devices × ${orientations.length} orientations × ${langs.length} langs × ${routes.length} routes) on ${BASE}`);
const queue = [...jobs];
await Promise.all(
  Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) await runJob(queue.shift());
  }),
);
process.stdout.write('\n');

for (const b of Object.values(browsers)) await b.close();
server?.kill();

// ─── Report ───────────────────────────────────────────────────
fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(results, null, 2));
const bySize = {};
for (const r of results) {
  const k = `${r.size.padEnd(9)} ${r.engine.padEnd(8)} ${r.name}`;
  bySize[k] ??= { pages: 0, hScroll: 0, offscreen: 0, clipped: 0, small: 0, console: 0, errors: 0 };
  const s = bySize[k];
  s.pages += 1;
  if (r.error) s.errors += 1;
  if (r.checks?.hScroll) s.hScroll += 1;
  if (r.checks?.offscreen.length) s.offscreen += 1;
  if (r.checks?.clippedText.length) s.clipped += 1;
  if (r.checks?.smallTargets.length) s.small += 1;
  if (r.console.length) s.console += 1;
}
console.log('\nPages with issues per viewport  (hScroll · offscreen · clippedText · console · load errors | small tap targets = warning)');
for (const [k, s] of Object.entries(bySize)) {
  const bad = s.hScroll + s.offscreen + s.clipped + s.console + s.errors;
  console.log(
    `${bad ? '✗' : '✓'} ${k.padEnd(48)} ${s.pages} pages · ${s.hScroll} · ${s.offscreen} · ${s.clipped} · ${s.console} · ${s.errors} | ${s.small}`,
  );
}

const problems = results.filter(
  (r) => r.error || r.console.length || r.checks?.hScroll || r.checks?.offscreen.length || r.checks?.clippedText.length,
);
if (problems.length) {
  console.log('\nDetails (first 40):');
  for (const r of problems.slice(0, 40)) {
    console.log(`\n• ${r.size} ${r.orient} ${r.lang} ${r.route}`);
    if (r.error) console.log('   load error:', r.error);
    if (r.checks?.hScroll) console.log('   horizontal scroll');
    r.checks?.offscreen.forEach((o) => console.log('   offscreen:', o));
    r.checks?.clippedText.forEach((o) => console.log('   clipped text:', o));
    r.console.forEach((c) => console.log('   console:', c));
  }
}
const small = new Map();
results.forEach((r) => r.checks?.smallTargets.forEach((t) => small.set(t.replace(/ \d+×\d+$/, ''), t)));
if (small.size) {
  console.log(`\nSmall tap targets (<44 px), unique: ${small.size}`);
  [...small.values()].slice(0, 30).forEach((t) => console.log('   ', t));
}
console.log(`\nScreenshots + report.json in ${path.relative(ROOT, OUT)}/`);
process.exit(problems.length ? 1 : 0);
