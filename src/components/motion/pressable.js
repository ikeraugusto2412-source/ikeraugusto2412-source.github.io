import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { EASE } from './tokens';

/*
 * Micro-interaction for primary buttons & links: lift 2 px + slight fade on hover,
 * press to 0.97 on tap. Spread onto any motion element: <motion.button {...pressable}>.
 * Hover/click sounds come from the global useUiSounds wiring, not from here.
 */
export const pressable = {
  whileHover: { y: -2, opacity: 0.78 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.25, ease: EASE },
};

/** Same lift + press, without the fade — for elements whose opacity/background
 *  already carries state (active toggles, the solid submit button). */
export const lift = {
  whileHover: { y: -2 },
  whileTap: { scale: 0.97 },
  transition: { duration: 0.25, ease: EASE },
};

export const MotionLink = motion.create(Link);
