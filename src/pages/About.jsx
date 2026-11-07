import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import Footer from '../components/Footer';
import Folder from '../components/Folder';
import useFolderSize from '../hooks/useFolderSize';
import DrawLine from '../components/DrawLine';
import useScrollLock from '../hooks/useScrollLock';
import { EASE } from '../components/motion/tokens';
import { pressable, MotionLink } from '../components/motion/pressable';
import { useLanguage } from '../context/LanguageContext';
import { playSound } from '../audio/sound';
import './About.css';

/* ─── Shared Animated Divider ─── */
function Line({ delay = 0 }) {
  return (
    <motion.div
      className="about-line"
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: '-5%' }}
      transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1], delay }}
      style={{ originX: 0 }}
    />
  );
}

/* ─── Scroll-triggered Text Reveal ─── */
function Reveal({ children, delay = 0, className = '', underline = false }) {
  return (
    <>
      <div style={{ overflow: 'hidden' }} className={className}>
        <motion.div
          initial={{ y: '105%' }}
          whileInView={{ y: '0%' }}
          viewport={{ once: true, margin: '-8%' }}
          transition={{ duration: 0.6, ease: EASE, delay }}
        >
          {children}
        </motion.div>
      </div>
      {/* Section-heading accent rule, drawn by Anime.js once the heading is revealed */}
      {underline && (
        <DrawLine trigger="inView" duration={550} delay={Math.round(delay * 1000) + 250} className="draw-line--accent" />
      )}
    </>
  );
}

function FadeIn({ children, delay = 0, className = '' }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.5, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/* ─── Working Archive Slides (On-Field Behind the Scenes) — captions live in translations ─── */
const WORKING_ARCHIVE_IMAGES = [
  '/assets/profile/working_set.webp',
  '/assets/profile/me.webp',
  '/assets/profile/working_rig.webp',
]

export default function About() {
  const { dict, localePath } = useLanguage();
  const [selectedLightbox, setSelectedLightbox] = useState(null);
  const folderSize = useFolderSize();
  const archiveSlides = dict.about.archiveSlides.map((slide, i) => ({ ...slide, image: WORKING_ARCHIVE_IMAGES[i] }));

  const openLightbox = (src) => {
    setSelectedLightbox(src);
    playSound('shutter');
  };

  useScrollLock(Boolean(selectedLightbox));

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectedLightbox(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedLightbox]);

  return (
    <PageTransition>
      <main className="about-page">

        {/* ════════ HERO ════════ */}
        <section className="about-hero">
          <div className="about-hero-inner container">

            <motion.span
              className="about-tag"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {dict.about.tag}
            </motion.span>

            <div className="about-hero-heading">
              <div style={{ overflow: 'hidden' }}>
                <motion.h1
                  className="about-h1-line"
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                >
                  IKER
                </motion.h1>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <motion.h1
                  className="about-h1-line about-h1-italic"
                  initial={{ y: '110%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.23 }}
                >
                  Augusto.
                </motion.h1>
              </div>
            </div>

            <motion.div
              className="about-hero-role"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.42 }}
            >
              <span className="about-mono">{dict.about.role}</span>
              <span className="about-mono about-muted">{dict.about.location}</span>
            </motion.div>

          </div>
        </section>

        <Line />

        {/* ════════ BIO ════════ */}
        <section className="about-bio container">
          <div className="about-bio-grid">
            <div className="about-bio-left">
              <Reveal delay={0}><span className="about-tag">{dict.about.whoTag}</span></Reveal>
              <div className="about-bio-statement">
                <Reveal delay={0.1}>
                  <p className="about-statement-text">
                    {dict.about.statement}
                  </p>
                </Reveal>
              </div>
            </div>
            <div className="about-bio-right">
              <FadeIn delay={0.12}>
                <p className="about-bio-body">
                  {dict.about.bio1}
                </p>
              </FadeIn>
              <FadeIn delay={0.22}>
                <p className="about-bio-body">
                  {dict.about.bio2}
                </p>
              </FadeIn>
              <FadeIn delay={0.32}>
                <p className="about-bio-body">
                  {dict.about.bio3}
                </p>
              </FadeIn>
              <FadeIn delay={0.42} className="about-bio-cta-wrap">
                <MotionLink to={localePath('/contact')} className="about-bio-cta" {...pressable}>
                  <span>{dict.about.ctaWrite}</span>
                  <span className="about-cta-arrow">→</span>
                </MotionLink>
              </FadeIn>
            </div>
          </div>
        </section>

        <Line delay={0.1} />

        {/* ════════ STATS ════════ */}
        <section className="about-stats container">
          <div className="about-stats-grid">
            {dict.about.stats.map(({ num, label }, i) => (
              <div className="about-stat-item" key={num}>
                <Reveal delay={0.08 + i * 0.08}>
                  <span className="about-stat-num">{num}</span>
                </Reveal>
                <FadeIn delay={0.18 + i * 0.08}>
                  <span className="about-stat-label">{label}</span>
                </FadeIn>
              </div>
            ))}
          </div>
        </section>

        <Line delay={0.1} />

        {/* ════════ SERVICES ════════ */}
        <section className="about-services container">
          <div className="about-services-header">
            <FadeIn delay={0}><span className="about-tag">{dict.about.servicesTag}</span></FadeIn>
            <Reveal delay={0.1} underline><h2 className="about-services-title">{dict.about.servicesTitle}</h2></Reveal>
          </div>
          <div className="about-services-grid">
            {dict.about.services.map(({ num, title, desc }, i) => (
              <motion.div
                key={num}
                className="about-service-card"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5%' }}
                transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: (i % 3) * 0.07 }}
              >
                <div className="about-service-top">
                  <span className="about-service-num about-mono">{num}</span>
                  <span className="about-service-arrow">↗</span>
                </div>
                <h3 className="about-service-title">{title}</h3>
                <p className="about-service-desc">{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        <Line delay={0.1} />

        {/* ════════ THE PERSON + WORKING ARCHIVE FOLDER ════════ */}
        <section className="about-dossier container">
          <div className="about-dossier-grid">
            <div className="about-dossier-left">
              <FadeIn delay={0}><span className="about-tag">{dict.about.personTag}</span></FadeIn>
              <Reveal delay={0.1} underline>
                <h2 className="about-portrait-h2">{dict.about.personH2Part1}<br /><em>{dict.about.personH2Part2}</em></h2>
              </Reveal>
              <FadeIn delay={0.25} className="about-portrait-text-wrap">
                <p className="about-bio-body">
                  {dict.about.personBio1}
                </p>
                <p className="about-bio-body">
                  {dict.about.personBio2}
                </p>
              </FadeIn>
            </div>

            <div className="about-dossier-right">
              <div className="about-folder-showcase-wrap">
                <Folder
                  color="black"
                  size={folderSize}
                  items={archiveSlides}
                  toggleLabel={dict.about.folderToggle}
                  openLabel={dict.about.dossierHintOpen}
                  closeLabel={dict.about.dossierHintClose}
                  onSelectCard={(item) => openLightbox(item.image)}
                />
              </div>
            </div>
          </div>
        </section>

        <Line />

        <Footer />

        {/* ════════ ARCHIVAL LIGHTBOX MODAL ════════ */}
        <AnimatePresence>
          {selectedLightbox && (
            <motion.div
              className="about-lightbox-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setSelectedLightbox(null)}
            >
              <motion.div
                className="about-lightbox-content"
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
              >
                <img src={selectedLightbox} alt={archiveSlides.find((s) => s.image === selectedLightbox)?.title ?? 'Iker Augusto'} className="about-lightbox-img" />
                <button
                  className="about-lightbox-close"
                  onClick={() => setSelectedLightbox(null)}
                  aria-label={dict.about.lightboxClose}
                >
                  ✕
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </PageTransition>
  );
}
