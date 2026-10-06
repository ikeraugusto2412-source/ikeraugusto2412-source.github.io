import { useSyncExternalStore } from 'react';

/*
 * Intro gate: tells the page when the preloader curtain starts lifting, so first-screen
 * entrances play in view instead of finishing unseen behind it.
 * Ready from the start when the preloader is skipped (already seen this session).
 */
const SEEN_KEY = 'ik-preloader-seen';

/** Only play the intro once per browser session */
export function hasSeenPreloader() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export function markPreloaderSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* storage unavailable: intro simply plays again next time */
  }
}

let ready = hasSeenPreloader();
const listeners = new Set();

export function markIntroReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((l) => l());
}

function subscribe(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** True once the first screen is (becoming) visible. */
export default function useIntroReady() {
  return useSyncExternalStore(subscribe, () => ready, () => true);
}
