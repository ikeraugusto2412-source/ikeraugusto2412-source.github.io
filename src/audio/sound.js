import { soundMap } from './soundMap';

/*
 * Tiny UI sound engine on top of Howler (Web Audio).
 *
 * iOS Safari only lets an AudioContext start inside a touchend/click handler, synchronously.
 * So Howler's module is prefetched while the browser is idle (no AudioContext yet), and on the
 * visitor's first gesture the sounds are created *inside* that handler and the context resumed.
 * Howler's own autoUnlock stays on as a second safety net.
 *
 * Web Audio follows the iPhone ring/silent switch, so sounds stay muted when the phone is on
 * silent — nothing to handle here. Failures are always silent: a broken file is just skipped.
 */

const howls = {};
const broken = new Set();
let mod = null; // the howler module once fetched
let fetching = null;
let created = false;

export function prefetchSounds() {
  if (!fetching) {
    fetching = import('howler')
      .then((m) => {
        mod = m;
        return m;
      })
      .catch(() => null);
  }
  return fetching;
}

function createHowls() {
  if (created || !mod) return;
  created = true;
  for (const [name, cfg] of Object.entries(soundMap)) {
    howls[name] = new mod.Howl({
      src: [cfg.src],
      volume: cfg.volume ?? 0.25,
      rate: cfg.rate ?? 1,
      preload: true,
      onloaderror: () => broken.add(name),
      onplayerror: () => {},
    });
  }
}

/** Call from inside a user gesture (touchend / click / keydown). */
export function unlockSounds() {
  if (mod) {
    createHowls();
    const ctx = mod.Howler.ctx;
    if (ctx && ctx.state !== 'running') ctx.resume().catch(() => {});
    return Promise.resolve();
  }
  // Module not fetched yet (very fast first tap): fetch now, Howler's autoUnlock finishes the job
  return prefetchSounds().then(() => createHowls());
}

export function playSound(name) {
  const howl = howls[name];
  const cfg = soundMap[name];
  if (!howl || !cfg || broken.has(name) || howl.state() !== 'loaded') return;
  // Never queue sounds while audio is still locked — they would all fire at once later
  const ctx = mod?.Howler?.ctx;
  if (ctx && ctx.state !== 'running') return;

  try {
    const id = howl.play();
    if (cfg.vary) {
      const base = cfg.rate ?? 1;
      howl.rate(base * (1 + (Math.random() * 2 - 1) * cfg.vary), id);
    }
  } catch {
    /* ignore playback errors */
  }
}
