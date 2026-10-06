/**
 * SOUND MAP — the only place where UI sounds are configured.
 *
 * To replace a sound with your own:
 *   1. Drop the file into /public/audio (mp3 works everywhere; ogg/webm also fine).
 *   2. Change that sound's `src` below to '/audio/<your-file>'. Nothing else needs touching.
 *
 * Fields per sound:
 *   src     Path under /public (served from the site root).
 *   volume  0–1 playback gain. Keep it between 0.15 and 0.4 — the files are already
 *           normalised to a -14 dBFS peak, so these values stay subtle.
 *   rate    Optional playback speed (1 = original; <1 lower & slower, >1 higher & faster).
 *   vary    Optional random rate spread (0.03 = ±3%) so repeated sounds don't feel robotic.
 *
 * Sources and licences for every file are listed in /public/audio/CREDITS.md.
 */
export const soundMap = {
  hover:            { src: '/audio/hover.mp3',          volume: 0.15, vary: 0.03 },
  click:            { src: '/audio/click.mp3',          volume: 0.3,  vary: 0.03 },
  'toggle-on':      { src: '/audio/toggle-on.mp3',      volume: 0.3 },
  'toggle-off':     { src: '/audio/toggle-off.mp3',     volume: 0.3 },
  'menu-open':      { src: '/audio/menu-open.mp3',      volume: 0.25 },
  'menu-close':     { src: '/audio/menu-close.mp3',     volume: 0.22 },
  shutter:          { src: '/audio/shutter.mp3',        volume: 0.35 },
  page:             { src: '/audio/page.mp3',           volume: 0.18 },
  'preloader-tick': { src: '/audio/preloader-tick.mp3', volume: 0.15 },
};
