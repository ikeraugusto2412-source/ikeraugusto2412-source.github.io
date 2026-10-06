import React from 'react';
import { motion } from 'framer-motion';
import { EASE } from './tokens';

/*
 * Section reveal: children fade + rise a few px when the block enters the viewport,
 * staggered 70 ms, once. With reduced motion, MotionConfig (App) drops the transform
 * and leaves a plain fade.
 */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
};

export function Reveal({ as = 'div', children, className, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-10% 0px' }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({ as = 'div', children, className, ...rest }) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={item} {...rest}>
      {children}
    </Tag>
  );
}
