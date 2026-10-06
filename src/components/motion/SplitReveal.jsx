import React from 'react';
import { motion } from 'framer-motion';
import { EASE, DUR } from './tokens';
import './SplitReveal.css';

/*
 * Signature headline reveal: each letter rises through its own mask, left → right,
 * 30 ms apart (the whole cascade stays under ~400 ms). Same "up through a mask" move as
 * the menu labels, so big type always arrives the same way.
 * Screen readers get the plain text; with reduced motion the letters simply fade in.
 */
const letter = {
  hidden: { y: '125%', opacity: 0 },
  visible: ({ i, delay }) => ({
    y: '0%',
    opacity: 1,
    transition: {
      y: { duration: DUR.slow, ease: EASE, delay: delay + i * 0.03 },
      opacity: { duration: DUR.quick, ease: EASE, delay: delay + i * 0.03 },
    },
  }),
};

export default function SplitReveal({ text, play = true, delay = 0, className = '' }) {
  let index = 0;
  return (
    <motion.span
      className={`split-reveal ${className}`}
      aria-label={text}
      initial="hidden"
      animate={play ? 'visible' : 'hidden'}
    >
      {text.split(' ').map((word, w) => (
        <React.Fragment key={w}>
          {w > 0 && ' '}
          <span className="split-reveal-word" aria-hidden="true">
            {[...word].map((char, c) => (
              <span className="split-reveal-mask" key={c}>
                <motion.span className="split-reveal-char" variants={letter} custom={{ i: index++, delay }}>
                  {char}
                </motion.span>
              </span>
            ))}
          </span>
        </React.Fragment>
      ))}
    </motion.span>
  );
}
