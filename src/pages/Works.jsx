import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { projects } from '../data/projects';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { EASE } from '../components/motion/tokens';
import { lift } from '../components/motion/pressable';
import DrawLine from '../components/DrawLine';
import { sileo } from 'sileo';
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

export default function Works() {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [hoveredProject, setHoveredProject] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

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
                  <h1 className="swagg-main-title">WORK</h1>
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
                      setHoveredProject(null);
                      sileo.info({ title: 'Vista en cuadrícula', description: 'Mostrando proyectos en grid editorial' });
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
                      sileo.info({ title: 'Vista en lista', description: 'Mostrando proyectos en modo lista' });
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
                  className="swagg-works-grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
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
                      <div
                        key={item.id + '-' + idx}
                        className={`swagg-grid-card-wrap span-${cell.span}`}
                      >
                        <Link
                          to={`/project/${item.id}`}
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
                            <img
                              src={item.coverImage}
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
                      </div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  className="swagg-works-list-wrapper"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onMouseLeave={() => setHoveredProject(null)}
                >
                  {/* Floating Center Cover Image that reveals on row hover */}
                  <div className="swagg-list-floating-overlay">
                    <AnimatePresence>
                      {hoveredProject && (
                        <motion.div
                          key="floating-center-cover"
                          className="swagg-list-floating-center"
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <motion.img
                            key={hoveredProject.id}
                            src={hoveredProject.coverImage}
                            alt={hoveredProject.title}
                            className="swagg-list-floating-img"
                            initial={{ opacity: 0.7 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.15 }}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Editorial List Table */}
                  <div className="swagg-list-table">
                    {projects.map((item, idx) => {
                      const numStr = String(idx + 1).padStart(2, '0');
                      const categoryLabel = typeof item.category === 'object'
                        ? (item.category[language] || item.category.en || '')
                        : item.category;
                      const isHovered = hoveredProject?.id === item.id;

                      return (
                        <Link
                          key={item.id}
                          to={`/project/${item.id}`}
                          className={`swagg-list-row ${isHovered ? 'active-hover' : ''}`}
                          onMouseEnter={() => setHoveredProject(item)}
                          onFocus={() => setHoveredProject(item)}
                          data-cursor-text="VIEW"
                        >
                          {/* Fill bar: wipes in from the left; text inverts via blend mode as it passes */}
                          <motion.span
                            className="swagg-list-row-fill"
                            aria-hidden="true"
                            initial={false}
                            animate={{ scaleX: isHovered ? 1 : 0 }}
                            transition={{ duration: 0.3, ease: EASE }}
                          />
                          <div className="swagg-list-col-num">{numStr}</div>
                          <div className="swagg-list-col-title">{item.title}</div>
                          <div className="swagg-list-col-field">{categoryLabel}</div>
                          <div className="swagg-list-col-year">{item.year}</div>
                        </Link>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

        </div>

        <Footer />
      </div>
    </PageTransition>
  );
}
