import { useSyncExternalStore } from 'react';
import { isMuted, setMuted, subscribeMuted, playSound } from './sound';

/** [enabled, toggle] for the site's UI sounds. Turning them on plays a confirmation tick. */
export default function useSoundEnabled() {
  const enabled = !useSyncExternalStore(subscribeMuted, isMuted, () => false);
  const toggle = () => {
    setMuted(enabled);
    if (!enabled) playSound('toggle-on');
  };
  return [enabled, toggle];
}
