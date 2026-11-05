import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { projects } from '../data/projects';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { EASE, EASE_EXIT, DUR, RISE } from '../components/motion/tokens';
import { lift, MotionLink } from '../components/motion/pressable';
import DrawLine from '../components/DrawLine';
import SplitReveal from '../components/motion/SplitReveal';
import { sileo } from 'sileo';
import { sizedSrc } from '../lib/images';
import Photo from '../components/Photo';
import ProjectMap from '../components/ProjectMap';
import './Works.css';

/**
 * Dynamically generates asymmetric editorial grid cells (with span-1, span-2,
 * and breathing negative-space blank cells) matching Swagg's 4-column rhythm
 * for ANY number of projects.
 */
function generateEditorialGrid(projectsList) {
  const cells = [];
  let i = 0;
  let rowIndex = 0;

  while (i < projectsList.length) {
    const remaining = projectsList.length - i;

    if (remaining === 1) {
      cells.push({ type: 'work', data: projectsList[i], span: 1 });
      i += 1;
    } else if (remaining === 2) {
      cells.push({ type: 'work', data: projectsList[i], span: 2 });
      cells.push({ type: 'blank', span: 1 });
      cells.push({ type: 'work', data: projectsList[i + 1], span: 1 });
      i += 2;
    } else {
      if (rowIndex % 3 === 0) {
        cells.push({ type: 'work', data: projectsList[i], span: 1 });
        cells.push({ type: 'work', data: projectsList[i + 1], span: 1 });
        cells.push({ type: 'work', data: projectsList[i + 2], span: 2 });
      } else if (rowIndex % 3 === 1) {
        cells.push({ type: 'work', data: projectsList[i], span: 2 });
        cells.push({ type: 'work', data: projectsList[i + 1], span: 1 });
        cells.push({ type: 'work', data: projectsList[i + 2], span: 1 });
      } else {
        cells.push({ type: 'work', data: projectsList[i], span: 1 });
        cells.push({ type: 'work', data: projectsList[i + 1], span: 2 });
        cells.push({ type: 'work', data: projectsList[i + 2], span: 1 });
      }
      i += 3;
    }
    rowIndex++;
  }

  return cells;
}

/*
 * Grid ↔ list: the outgoing view lifts away quickly, the incoming one cascades in.
 * Stagger is capped so the whole cascade stays under ~350 ms whatever the project count.
 */
const viewVariants = {
  hidden: {},
  visible: {},
  exit: { opacity: 0, y: -RISE / 2, transition: { duration: 0.22, ease: EASE_EXIT } },
};

const cardVariants = {
  hidden: { opacity: 0, y: RISE },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.standard, delay: 0.08 + Math.min(i, 7) * 0.045, ease: EASE },
  }),
};

const rowVariants = {
  hidden: { opacity: 0, y: RISE / 2 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.quick, delay: Math.min(i, 9) * 0.03, ease: EASE },
  }),
};

/*
 * List view: one big title per project. The active line lights up and the others fade back;
 * with a mouse a cover preview follows the pointer, on touch screens the line in the middle
 * of the screen is the active one.
 */
function ProjectList() {
  const { language, localePath } = useLanguage();
  const [active, setActive] = useState(0);
  const [previewOn, setPreviewOn] = useState(false);
  const listRef = useRef(null);
  const px = useSpring(0, { stiffness: 320, damping: 32 });
  const py = useSpring(0, { stiffness: 320, damping: 32 });

  useEffect(() => {
    if (!window.matchMedia('(hover: none)').matches) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number(e.target.dataset.row))),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    listRef.current.querySelectorAll('[data-row]').forEach((row) => io.observe(row));
    return () => io.disconnect();
  }, []);

  return (
    <motion.div
      className="works-biglist"
      variants={viewVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      onPointerMove={(e) => {
        if (e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        px.set(e.clientX - r.left);
        py.set(e.clientY - r.top);
      }}
      onPointerLeave={() => setPreviewOn(false)}
    >
      <ol ref={listRef} className="works-biglist-rows">
        {projects.map((item, idx) => {
          const categoryLabel = typeof item.category === 'object'
            ? (item.category[language] || item.category.en || '')
            : item.category;
          return (
            <li key={item.id} data-row={idx} className={idx === active ? 'is-active' : ''}>
              <MotionLink
                to={localePath(`/project/${item.id}`)}
                className="works-biglist-row"
                variants={rowVariants}
                custom={idx}
                onPointerEnter={(e) => {
                  if (e.pointerType !== 'mouse') return;
                  setActive(idx);
                  setPreviewOn(true);
                }}
                onFocus={() => setActive(idx)}
                data-cursor-text="VIEW"
              >
                <span className="works-biglist-num">({String(idx + 1).padStart(2, '0')})</span>
                <span className="works-biglist-title">{item.title}</span>
                <span className="works-biglist-meta">
                  <span>{categoryLabel}</span>
                  <span>{item.year}</span>
                </span>
              </MotionLink>
            </li>
          );
        })}
      </ol>
      <motion.div className={`works-biglist-preview ${previewOn ? 'is-on' : ''}`} style={{ x: px, y: py }} aria-hidden="true">
        {projects.map((item, idx) => (
          <img
            key={item.id}
            src={sizedSrc(item.coverImage, 480)}
            alt=""
            loading="lazy"
            decoding="async"
            style={{ objectPosition: item.coverPosition }}
            className={idx === active ? 'is-active' : ''}
          />
        ))}
      </motion.div>
    </motion.div>
  );
}

export default function Works() {
  const { language, dict, localePath } = useLanguage();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [spot, setSpot] = useState(null);
  const gridRef = useRef(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  /*
   * Spotlight (after podium.global): once you point at a cover the others go dark. On touch
   * screens the cover crossing the middle of the screen is the lit one.
   */
  useEffect(() => {
    const grid = gridRef.current;
    if (viewMode !== 'grid' || !grid || !window.matchMedia('(hover: none)').matches) return undefined;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setSpot(e.target.dataset.spot)),
      { rootMargin: '-45% 0px -45% 0px' },
    );
    grid.querySelectorAll('[data-spot]').forEach((el) => io.observe(el));
    const onScroll = () => {
      // above the first card or below the last: nothing is lit
      const r = grid.getBoundingClientRect();
      if (r.top > window.innerHeight / 2 || r.bottom < window.innerHeight / 2) setSpot(null);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, [viewMode]);

  const gridCells = generateEditorialGrid(projects);
  const formattedCount = String(projects.length).padStart(2, '0');

  return (
    <PageTransition>
      <div className="swagg-works-page">
        <div className="swagg-container">
          
          {/* ════════════════════════════════════════════════════════════
              SECTION - HERO
              ════════════════════════════════════════════════════════════ */}
          <section className="swagg-hero-section">
            <div className="swagg-headline">
              <div className="swagg-work-group">
                <div className="swagg-title-wrap">
                  <h1 className="swagg-main-title">
                    <SplitReveal text="WORK" delay={0.1} />
                  </h1>
                  <DrawLine trigger="inView" duration={550} delay={250} className="draw-line--accent" />
                </div>

                {/* Swagg Square Indicator Toggle: ■ GRID / ■ LIST */}
                <div className="swagg-type-toggle">
                  <motion.button
                    {...lift}
                    type="button"
                    className={`swagg-type-btn ${viewMode === 'grid' ? 'active' : ''}`}
                    onClick={() => {
                      setViewMode('grid');
                      sileo.info({ title: dict.works.gridToastTitle, description: dict.works.gridToastDesc });
                    }}
                  >
                    <span className="swagg-type-square" />
                    <span className="swagg-type-label">GRID</span>
                  </motion.button>
                  <motion.button
                    {...lift}
                    type="button"
                    className={`swagg-type-btn ${viewMode === 'list' ? 'active' : ''}`}
                    onClick={() => {
                      setViewMode('list');
                      sileo.info({ title: dict.works.listToastTitle, description: dict.works.listToastDesc });
                    }}
                  >
                    <span className="swagg-type-square" />
                    <span className="swagg-type-label">LIST</span>
                  </motion.button>
                </div>
              </div>

              <div className="swagg-count-num">
                {formattedCount}
              </div>
            </div>
          </section>

          {/* ════════════════════════════════════════════════════════════
              SECTION - WORK (GRID OR INTERACTIVE LIST)
              ════════════════════════════════════════════════════════════ */}
          <section className="swagg-works-section">
            <AnimatePresence mode="wait">
              {viewMode === 'grid' ? (
                <motion.div
                  key="grid"
                  ref={gridRef}
                  className={`swagg-works-grid ${spot ? 'has-spot' : ''}`}
                  onPointerLeave={(e) => e.pointerType === 'mouse' && setSpot(null)}
                  variants={viewVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {gridCells.map((cell, idx) => {
                    if (cell.type === 'blank') {
                      return (
                        <div
                          key={`blank-${idx}`}
                          className="swagg-grid-blank"
                          aria-hidden="true"
                        />
                      );
                    }

                    const item = cell.data;
                    const categoryLabel = typeof item.category === 'object'
                      ? (item.category[language] || item.category.en || '')
                      : item.category;

                    return (
                      <motion.div
                        key={item.id + '-' + idx}
                        className={`swagg-grid-card-wrap span-${cell.span} ${spot === item.id ? 'is-spot' : ''}`}
                        variants={cardVariants}
                        custom={idx}
                        data-spot={item.id}
                        onPointerEnter={(e) => e.pointerType === 'mouse' && setSpot(item.id)}
                      >
                        <Link
                          to={localePath(`/project/${item.id}`)}
                          className="swagg-grid-card"
                          data-cursor-text="VIEW"
                        >
                          {/* Slide-up header on hover */}
                          <div className="swagg-card-header">
                            <div className="swagg-card-header-inner">
                              <span className="swagg-card-title">{item.title}</span>
                              <span className="swagg-card-field">{categoryLabel}</span>
                            </div>
                          </div>

                          <div className={`swagg-card-media-wrap span-${cell.span}`}>
                            <Photo
                              src={item.coverImage}
                              sizes="(max-width: 768px) 100vw, 50vw"
                              blur
                              alt={item.title}
                              loading="lazy"
                              decoding="async"
                              className="swagg-card-img"
                            />
                            <div className="swagg-card-hover-overlay">
                              <span className="swagg-card-view-badge">[VIEW]</span>
                            </div>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <ProjectList key="list" />
              )}
            </AnimatePresence>
          </section>

          <ProjectMap />

        </div>

        <Footer />
      </div>
    </PageTransition>
  );
}
