import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import useScrollLock from '../hooks/useScrollLock';
import { sizedSrc } from '../lib/images';
import './PhotoBook.css';

/*
 * A project's photos as a book (inspired by howtotalktowhitekidsaboutracism.com): it opens on
 * the cover and scrolling turns the pages in 3D. It is an extra way to look at a gallery —
 * the overlay scrolls on its own, so closing it leaves the gallery exactly where it was.
 * Only the pages around the open spread load their photo.
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const NEAR = 2; // leaves either side of the open spread that load their photos

function Leaf({ progress, index, count, front, back }) {
  const rotateY = useTransform(progress, (p) => -180 * clamp(p * count - index, 0, 1));
  const zIndex = useTransform(rotateY, (r) => (r < -90 ? index + 1 : count - index));
  const shade = useTransform(rotateY, (r) => Math.sin((-r * Math.PI) / 180) * 0.4);
  return (
    <motion.div className="photobook-leaf" style={{ rotateY, zIndex }}>
      <div className="photobook-face photobook-front">
        {front}
        <motion.span className="photobook-shade" style={{ opacity: shade }} />
      </div>
      <div className="photobook-face photobook-back">
        {back}
        <motion.span className="photobook-shade" style={{ opacity: shade }} />
      </div>
    </motion.div>
  );
}

export default function PhotoBook({ project, onClose }) {
  const { dict } = useLanguage();
  const scrollRef = useRef(null);
  const closeRef = useRef(null);
  const photos = project.gridImages.filter((src) => src !== project.coverImage);
  const leaves = Math.ceil((photos.length + 2) / 2);

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  // The closed book sits centred; once it opens, the spread is centred
  const x = useTransform(progress, [0, 1 / leaves], ['-25%', '0%']);
  const [spread, setSpread] = useState(0);
  useEffect(() => progress.on('change', (p) => setSpread(Math.min(leaves, Math.round(p * leaves)))), [progress, leaves]);

  useScrollLock(true);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      const el = scrollRef.current;
      if (!dir || !el) return;
      e.preventDefault();
      el.scrollBy({ top: (dir * (el.scrollHeight - el.clientHeight)) / leaves, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, leaves]);

  const page = (src, near) => (
    <div className="photobook-photo">{near && <img src={sizedSrc(src, 640)} alt="" decoding="async" />}</div>
  );
  const cover = (
    <div className="photobook-cover">
      <img src={sizedSrc(project.coverImage, 640)} alt="" style={{ objectPosition: project.coverPosition }} />
      <div className="photobook-cover-title">
        <span>{project.year}</span>
        <strong>{project.title}</strong>
        {project.subtitle && <em>{project.subtitle}</em>}
      </div>
    </div>
  );
  const end = <div className="photobook-end">Ik.</div>;

  const faceAt = (n, near) => {
    if (n === 0) return cover;
    if (n <= photos.length) return page(photos[n - 1], near);
    return n === photos.length + 1 ? end : <div className="photobook-blank" />;
  };

  return (
    <motion.div
      className="photobook"
      role="dialog"
      aria-modal="true"
      aria-label={`${dict.projectDetail.bookLabel} — ${project.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <div ref={scrollRef} className="photobook-scroll" data-lenis-prevent>
        <div className="photobook-track" style={{ height: `${(leaves + 1) * 70}svh` }}>
          <div className="photobook-stage">
            <motion.div
              className="photobook-book"
              style={{ x }}
              initial={{ scale: 0.9, rotateX: 18 }}
              animate={{ scale: 1, rotateX: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              {Array.from({ length: leaves }, (_, i) => {
                const near = Math.abs(i - spread) <= NEAR;
                return (
                  <Leaf
                    key={i}
                    progress={progress}
                    index={i}
                    count={leaves}
                    front={faceAt(i * 2, near)}
                    back={faceAt(i * 2 + 1, near)}
                  />
                );
              })}
            </motion.div>
            <p className="photobook-hint">
              {dict.projectDetail.bookHint} · {String(spread).padStart(2, '0')} / {String(leaves).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
      <button ref={closeRef} type="button" className="photobook-close" onClick={onClose}>
        {dict.projectDetail.close}
      </button>
    </motion.div>
  );
}
