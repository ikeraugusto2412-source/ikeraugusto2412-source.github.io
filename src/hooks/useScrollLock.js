import { useEffect } from 'react';

/*
 * Shared page scroll lock (menu overlay, lightboxes, the fixed Home stage).
 * Locks are counted, so closing the menu can't release a lock the Home page still holds,
 * and every lock is released on unmount — the page can never stay frozen.
 * App listens for 'scrolllockchange' to pause/resume Lenis's smooth wheel scrolling.
 */
let locks = 0;

function update(delta) {
  locks = Math.max(0, locks + delta);
  const locked = locks > 0;
  document.documentElement.classList.toggle('scroll-locked', locked);
  window.dispatchEvent(new CustomEvent('scrolllockchange', { detail: { locked } }));
}

export default function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined;
    update(1);
    return () => update(-1);
  }, [active]);
}
