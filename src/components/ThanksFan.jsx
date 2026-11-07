import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { projects } from '../data/projects';
import { sizedSrc } from '../lib/images';
import './ThanksFan.css';

/*
 * A small fan of photos, one from each of a few galleries (after mikes.cv's "Thank you for
 * flying"), shown once a message has been sent. It deals itself open when it appears and
 * spreads a little more on hover or tap.
 */
const PICKS = [
  ['norway', 3],
  ['the-weeknd', 4],
  ['london', 6],
  ['huck-knife-pro', 2],
  ['new-york', 20],
];

export default function ThanksFan({ caption }) {
  const [dealt, setDealt] = useState(false);
  const [wide, setWide] = useState(false);
  const photos = PICKS.map(([id, i]) => projects.find((p) => p.id === id)?.gridImages[i]).filter(Boolean);
  const mid = (photos.length - 1) / 2;

  useEffect(() => {
    const t = setTimeout(() => setDealt(true), 250);
    return () => clearTimeout(t);
  }, []);

  const spread = !dealt ? 0 : wide ? 1 : 0.7;

  return (
    <figure className="thanks-fan" onPointerEnter={() => setWide(true)} onPointerLeave={() => setWide(false)} onClick={() => setWide((v) => !v)}>
      <div className="thanks-fan-cards" aria-hidden="true">
        {photos.map((src, k) => (
          <motion.img
            key={src}
            src={sizedSrc(src, 320)}
            alt=""
            initial={{ y: 24, opacity: 0 }}
            animate={{ x: (k - mid) * 58 * spread, rotate: (k - mid) * 7 * spread, y: Math.abs(k - mid) * 6 * spread, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: dealt ? 0 : k * 0.05 }}
            style={{ zIndex: k }}
          />
        ))}
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
