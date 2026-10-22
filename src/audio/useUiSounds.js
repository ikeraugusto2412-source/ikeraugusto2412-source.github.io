import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { prefetchSounds, unlockSounds, playSound } from './sound';
import { splitLang } from '../lib/i18nPath';

/*
 * Site-wide sound wiring, mounted once in <App>.
 *
 * - hover: mouse entering any link/button (or an element with `data-sound-hover`)
 * - click: clicking any link/button. An element can override it with
 *   `data-sound="<name>"` (e.g. data-sound="shutter") or silence it with data-sound="none".
 * - page:  every route change after the first render.
 */
const HOVER_TARGETS = 'a[href], button:not(:disabled), [role="button"], [data-sound-hover]';
const CLICK_TARGETS = 'a[href], button:not(:disabled), [role="button"], [data-sound]';

export default function useUiSounds() {
  // Ignore the /es prefix: switching language is not a page change
  const { path: pathname } = splitLang(useLocation().pathname);
  const firstPath = useRef(true);

  useEffect(() => {
    // Fetch Howler while idle (no AudioContext yet), so the first gesture can start audio synchronously
    const idle = window.requestIdleCallback ?? ((cb) => setTimeout(cb, 1500));
    idle(() => prefetchSounds());

    // touchend/click/keydown are the events iOS accepts as permission to start audio
    const UNLOCK_EVENTS = ['touchend', 'click', 'keydown'];
    const unlock = () => {
      unlockSounds();
      UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock, true));
    };
    UNLOCK_EVENTS.forEach((ev) => window.addEventListener(ev, unlock, true));

    let hovered = null;
    const onPointerOver = (e) => {
      if (e.pointerType !== 'mouse') return;
      const el = e.target.closest?.(HOVER_TARGETS) ?? null;
      if (el && el !== hovered) playSound('hover');
      hovered = el;
    };

    const onClick = (e) => {
      const el = e.target.closest?.(CLICK_TARGETS);
      if (!el) return;
      const custom = el.dataset.sound;
      if (custom === 'none') return;
      playSound(custom || 'click');
    };

    document.addEventListener('pointerover', onPointerOver);
    document.addEventListener('click', onClick);
    return () => {
      UNLOCK_EVENTS.forEach((ev) => window.removeEventListener(ev, unlock, true));
      document.removeEventListener('pointerover', onPointerOver);
      document.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    if (firstPath.current) {
      firstPath.current = false;
      return;
    }
    playSound('page');
  }, [pathname]);
}
