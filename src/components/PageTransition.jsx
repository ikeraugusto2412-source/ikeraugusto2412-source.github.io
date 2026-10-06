import { motion, useReducedMotion } from 'framer-motion';
import React from 'react';
import { pageVariants, pageFadeVariants } from './motion/tokens';
import './PageTransition.css';

/**
 * PageTransition
 * Route enter/exit: fade + 16 px vertical drift, 400 ms.
 * With prefers-reduced-motion it becomes a plain cross-fade.
 */
export default function PageTransition({ children }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className="page-transition-container"
      variants={reduce ? pageFadeVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      {children}
    </motion.div>
  );
}
