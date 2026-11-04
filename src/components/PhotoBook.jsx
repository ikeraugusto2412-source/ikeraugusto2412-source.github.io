import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, animate, motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import useScrollLock from '../hooks/useScrollLock';
import { placeholderUrl, sizedSrc } from '../lib/images';
import { playSound } from '../audio/sound';
import './PhotoBook.css';

/*
 * A project's photos as a book (inspired by howtotalktowhitekidsaboutracism.com): it opens on
 * the cover and scrolling — or tapping either half — turns the pages in 3D. It is an extra way
 * to look at a gallery: the overlay scrolls on its own, so closing it leaves the gallery
 * exactly where it was.
 *
 * Pages: cover · endpaper · title page · the photos · colophon · back cover.
 * Only the leaves around the open spread load their photo, at the size the page really needs.
 * The backdrop takes the colours of the open photo (its ThumbHash preview, already blurred).
 */
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const NEAR = 2; // leaves either side of the open spread that load their photos
const STACK_PX = 9; // page-block thickness of a whole book

function Leaf({ progress, peek, index, count, front, back }) {
  const rotateY = useTransform([progress, peek], ([p, k]) => -180 * clamp(p * count - index, 0, 1) - (index === 0 ? k : 0));
  const zIndex = useTransform(rotateY, (r) => (r < -90 ? index + 1 : count - index));
  const shade = useTransform(rotateY, (r) => Math.sin((-r * Math.PI) / 180) * 0.45);
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
  const t = dict.projectDetail;
  const scrollRef = useRef(null);
  const closeRef = useRef(null);
  const bookRef = useRef(null);
  const photos = project.gridImages.filter((src) => src !== project.coverImage);

  // Faces in reading order; padded so the back cover is always the last left-hand page
  const faces = [{ type: 'cover' }, { type: 'endpaper' }, { type: 'title' }, ...photos.map((src) => ({ type: 'photo', src }))];
  if ((faces.length + 2) % 2) faces.push({ type: 'blank' });
  faces.push({ type: 'colophon' }, { type: 'back' });
  const leaves = faces.length / 2;

  const { scrollYProgress } = useScroll({ container: scrollRef });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  // The closed book sits centred (and again once closed at the back); open, the spread is centred
  const x = useTransform(progress, [0, 1 / leaves, 1 - 1 / leaves, 1], ['-25%', '0%', '0%', '25%']);
  const stackLeft = useTransform(progress, (p) => `${p * STACK_PX}px`);
  const stackRight = useTransform(progress, (p) => `${(1 - p) * STACK_PX}px`);
  const peek = useMotionValue(0);
  const [spread, setSpread] = useState(0);
  const [pagePx, setPagePx] = useState(800);

  useScrollLock(true);

  useEffect(
    () =>
      progress.on('change', (p) => {
        const next = Math.min(leaves, Math.round(p * leaves));
        setSpread((prev) => {
          if (prev !== next) playSound('page');
          return next;
        });
      }),
    [progress, leaves],
  );

  // Photos at the pixel size of a page on this screen (retina included)
  useEffect(() => {
    const book = bookRef.current;
    if (!book) return undefined;
    const ro = new ResizeObserver(() => setPagePx((book.offsetWidth / 2) * (window.devicePixelRatio || 1)));
    ro.observe(book);
    return () => ro.disconnect();
  }, []);

  // The cover lifts a little once, as an invitation to open the book
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = setTimeout(() => {
      animate(peek, [0, 28, 0], { duration: 1.3, ease: [0.45, 0, 0.2, 1], times: [0, 0.45, 1] });
    }, 900);
    return () => clearTimeout(timer);
  }, [peek]);

  const turn = (dir) => {
    const el = scrollRef.current;
    if (!el) return;
    const step = (el.scrollHeight - el.clientHeight) / leaves;
    el.scrollTo({ top: Math.round(el.scrollTop / step + dir) * step, behavior: 'smooth' });
  };

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
      if (!dir) return;
      e.preventDefault();
      turn(dir);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const header = <span className="photobook-runhead">Iker Augusto — {project.title}</span>;
  const renderFace = (face, n, near) => {
    const folio = <span className={`photobook-folio ${n % 2 ? 'is-left' : ''}`}>{n}</span>;
    switch (face.type) {
      case 'cover':
        return (
          <div className="photobook-cover">
            <img src={sizedSrc(project.coverImage, pagePx * 1.4)} alt="" style={{ objectPosition: project.coverPosition }} />
            <div className="photobook-cover-title">
              <span>{project.year}</span>
              <strong>{project.title}</strong>
              {project.subtitle && <em>{project.subtitle}</em>}
            </div>
            <span className="photobook-cover-mark">Ik.</span>
          </div>
        );
      case 'endpaper':
        return <div className="photobook-endpaper"><span>Ik.</span></div>;
      case 'title':
        return (
          <div className="photobook-paper photobook-titlepage">
            <span className="photobook-titlepage-kicker">{t.bookBy}</span>
            <strong>{project.title}</strong>
            {project.subtitle && <em>{project.subtitle}</em>}
            <span className="photobook-titlepage-meta">
              {photos.length} {t.photographs} · {project.location} · {project.year}
            </span>
          </div>
        );
      case 'photo':
        return (
          <div className="photobook-paper">
            {header}
            <div className="photobook-photo">{near && <img src={sizedSrc(face.src, pagePx * 0.84)} alt="" decoding="async" />}</div>
            {folio}
          </div>
        );
      case 'colophon':
        return (
          <div className="photobook-paper photobook-colophon">
            <span>Ik.</span>
            <em>{t.bookBy}</em>
            <small>{project.location} · {project.year}</small>
          </div>
        );
      case 'back':
        return <div className="photobook-endpaper photobook-backcover"><span>Ik.</span></div>;
      default:
        return <div className="photobook-paper" />;
    }
  };

  // Open spread = back of leaf (spread - 1) on the left, front of leaf (spread) on the right
  const openPhoto = [faces[spread * 2], faces[spread * 2 - 1]].find((f) => f?.type === 'photo')?.src ?? project.coverImage;
  const ambient = placeholderUrl(openPhoto);

  return (
    <motion.div
      className="photobook"
      role="dialog"
      aria-modal="true"
      aria-label={`${t.bookLabel} — ${project.title}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.35 }}
    >
      <AnimatePresence initial={false}>
        {ambient && (
          <motion.div
            key={ambient}
            className="photobook-ambient"
            style={{ backgroundImage: `url(${ambient})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.9 }}
          />
        )}
      </AnimatePresence>

      <div ref={scrollRef} className="photobook-scroll" data-lenis-prevent>
        <div className="photobook-track" style={{ height: `${(leaves + 1) * 60}svh` }}>
          <div className="photobook-stage">
            <button type="button" className="photobook-turn photobook-turn--prev" aria-label={t.bookPrev} onClick={() => turn(-1)} data-sound="none" />
            <button type="button" className="photobook-turn photobook-turn--next" aria-label={t.bookNext} onClick={() => turn(1)} data-sound="none" />
            <motion.div
              ref={bookRef}
              className="photobook-book"
              style={{ x }}
              initial={{ y: 60, scale: 0.92, rotateX: 22 }}
              animate={{ y: 0, scale: 1, rotateX: 0 }}
              transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            >
              <motion.span className="photobook-stack photobook-stack--left" style={{ width: stackLeft }} />
              <motion.span className="photobook-stack photobook-stack--right" style={{ width: stackRight }} />
              {Array.from({ length: leaves }, (_, i) => {
                const near = Math.abs(i - spread) <= NEAR;
                return (
                  <Leaf
                    key={i}
                    progress={progress}
                    peek={peek}
                    index={i}
                    count={leaves}
                    front={renderFace(faces[i * 2], i * 2, near)}
                    back={renderFace(faces[i * 2 + 1], i * 2 + 1, near)}
                  />
                );
              })}
            </motion.div>
            <div className="photobook-progress" aria-hidden="true">
              <motion.span style={{ scaleX: progress }} />
            </div>
            <p className="photobook-hint">
              {t.bookHint} · {String(spread).padStart(2, '0')} / {String(leaves).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>
      <button ref={closeRef} type="button" className="photobook-close" onClick={onClose}>
        {t.close}
      </button>
    </motion.div>
  );
}
