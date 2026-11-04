import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { sizedSrc } from '../lib/images';
import { pressable } from './motion/pressable';
import './PhotoBookTeaser.css';

/*
 * Invitation to open the photobook: a small closed book with the project's cover. Its cover
 * opens on hover, and it peeks open once by itself when it first scrolls into view.
 */
export default function PhotoBookTeaser({ project, count, label, onOpen }) {
  const { dict } = useLanguage();
  const ref = useRef(null);
  const [peek, setPeek] = useState(false);
  const firstPhoto = project.gridImages.find((src) => src !== project.coverImage);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setPeek(true);
        io.disconnect();
      },
      { threshold: 0.8 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <motion.button ref={ref} type="button" className={`book-teaser ${peek ? 'is-peek' : ''}`} onClick={onOpen} {...pressable}>
      <span className="book-teaser-book" aria-hidden="true">
        <span className="book-teaser-page">
          {firstPhoto && <img src={sizedSrc(firstPhoto, 240)} alt="" loading="lazy" />}
        </span>
        <span className="book-teaser-cover">
          <img src={sizedSrc(project.coverImage, 240)} alt="" loading="lazy" style={{ objectPosition: project.coverPosition }} />
          <span className="book-teaser-cover-title">{project.title}</span>
        </span>
      </span>
      <span className="book-teaser-text">
        <strong>{label}</strong>
        <small>{dict.projectDetail.bookTeaser.replace('{count}', count)}</small>
      </span>
      <span className="book-teaser-arrow" aria-hidden="true">→</span>
    </motion.button>
  );
}
