/** Shared easing for page transitions and micro-interactions (soft ease-out). */
export const EASE = [0.22, 1, 0.36, 1];

/** Route enter/exit: fade + 16 px vertical drift, ~400 ms. */
export const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: EASE } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.35, ease: EASE } },
};

/** Reduced-motion version: plain cross-fade, no drift at all. */
export const pageFadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.25 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};
