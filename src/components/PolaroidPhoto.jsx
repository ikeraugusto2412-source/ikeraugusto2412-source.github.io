import React, { useRef } from 'react';
import { motion,  useScroll, useTransform } from 'framer-motion';
import './PolaroidPhoto.css';

export default function PolaroidPhoto({ src, alt }) {
  const containerRef = useRef(null);

  // Parallax: image moves at ~60% of scroll speed
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  });
  const y = useTransform(scrollYProgress, [0, 1], [-40, 40]);

  return (
    <motion.div className="photo-parallax-outer" ref={containerRef}>
      <motion.div className="photo-parallax-inner" style={{ y }}>
        <motion.img
          src={src}
          alt={alt}
          className="about-photo-frameless"
          loading="lazy"
          decoding="async"
          initial={{ opacity: 0, scale: 1.04 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </motion.div>
    </motion.div>
  );
}
