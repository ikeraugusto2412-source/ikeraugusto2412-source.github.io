/*
 * Motion identity — "Premium" archetype: slow, controlled, no overshoot.
 * Three constants shared by every animation (mirrored as CSS vars in index.css):
 * one signature curve per direction, a three-step duration palette, one entrance pattern.
 */

/** Entrances and reveals: fast start, long gentle landing. The signature curve. */
export const EASE = [0.16, 1, 0.3, 1];
/** Exits: gentle start, fast departure. */
export const EASE_EXIT = [0.7, 0, 1, 1];
/** On-screen state changes (hover, toggles): smooth at both ends. */
export const EASE_STATE = [0.4, 0, 0.2, 1];

/** Duration palette, in seconds. */
export const DUR = { quick: 0.35, standard: 0.5, slow: 0.8 };

/** Entrance pattern: fade + short rise. Used by the hero, grids and section reveals. */
export const RISE = 16;

/** Route enter/exit: fade + short vertical drift. The exit is ~65% of the entrance
 *  and accelerates away, so the eye is handed to the incoming page. */
export const pageVariants = {
  initial: { opacity: 0, y: RISE },
  animate: { opacity: 1, y: 0, transition: { duration: DUR.standard, ease: EASE } },
  exit: { opacity: 0, y: -RISE / 2, transition: { duration: 0.32, ease: EASE_EXIT } },
};

/** Reduced-motion version: plain cross-fade, no drift at all. */
export const pageFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
