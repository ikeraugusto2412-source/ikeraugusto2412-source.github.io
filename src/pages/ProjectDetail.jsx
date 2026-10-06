import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { projects } from '../data/projects';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import { pageVariants, pageFadeVariants } from '../components/motion/tokens';
import { Reveal, RevealItem } from '../components/motion/Reveal';
import { pressable, MotionLink } from '../components/motion/pressable';
import DrawLine from '../components/DrawLine';
import useScrollLock from '../hooks/useScrollLock';
import ProgressiveImage from '../components/ProgressiveImage';
import CinemaVideoPlayer from '../components/CinemaVideoPlayer';
import GalleryIntroTransition from '../components/GalleryIntroTransition';
import NotFound from './NotFound';
import { sileo } from 'sileo';
import { playSound } from '../audio/sound';
import './ProjectDetail.css';

// Interactive heroes (three.js / react-spring) are only needed on some projects, so load them on demand
const SpiralGallery = lazy(() => import('../components/SpiralGallery'));
const SalomonGalleryOrbital = lazy(() => import('../components/SalomonGalleryOrbital'));
const FloatingGallery = lazy(() => import('../components/FloatingGallery'));

/** Wrap-around neighbour in the project's photo list. */
function neighbourImage(images, current, dir) {
  const i = Math.max(0, images.indexOf(current));
  return images[(i + dir + images.length) % images.length];
}

const lightboxSlide = {
  enter: (dir) => ({ x: dir * 60, opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } },
  exit: (dir) => ({ x: dir * -60, opacity: 0, transition: { duration: 0.2 } }),
};

export default function ProjectDetail() {
  const { language, dict } = useLanguage();
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  const [selectedImage, setSelectedImage] = useState(null);
  const reduceMotion = useReducedMotion();

  const openLightbox = (img) => {
    setSelectedImage(img);
    playSound('shutter');
    sileo.info({ title: 'Pantalla completa', description: 'Pulsa ESC o haz clic para cerrar' });
  };

  // Lightbox navigation across the project's photos (buttons, arrow keys, swipe)
  const galleryImages = project?.gridImages ?? [];
  const galleryIndex = Math.max(0, galleryImages.indexOf(selectedImage));
  const [slideDir, setSlideDir] = useState(0);
  const lightboxDragged = useRef(false);
  const stepLightbox = (dir) => {
    if (galleryImages.length < 2) return;
    setSlideDir(dir);
    setSelectedImage(neighbourImage(galleryImages, selectedImage, dir));
    playSound('click');
  };

  const handleShareProject = () => {
    navigator.clipboard?.writeText(window.location.href).then(() => {
      sileo.success({ title: 'Enlace copiado', description: 'Compártelo donde quieras 📷' });
    });
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useScrollLock(Boolean(selectedImage));

  useEffect(() => {
    // Allow ESC key to close the lightbox
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectedImage(null);
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      const images = project?.gridImages ?? [];
      if (selectedImage && dir && images.length > 1) {
        setSlideDir(dir);
        setSelectedImage(neighbourImage(images, selectedImage, dir));
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [selectedImage, project]);

  if (!project) return <NotFound message={dict.projectDetail.notFound} />;

  return (
    <motion.div
      className="project-detail-wrapper"
      variants={reduceMotion ? pageFadeVariants : pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="project-detail">
        {/* Fullscreen cinematic intro overlay matching user favorite */}
        <GalleryIntroTransition
          key={project.id}
          brand="IK®"
          title={project.title.toUpperCase()}
          subtitle={`${project.gridImages ? project.gridImages.length : '30'} ${dict.projectDetail?.photographs || 'PHOTOGRAPHS'} · ARCHIVAL SERIES`}
          previewImages={
            project.gridImages && project.gridImages.length > 0
              ? project.gridImages.slice(0, 8)
              : [project.coverImage]
          }
        />
      {/* Top Hero: Video Player for Norway, 3D Spiral Helix on New York, or Monumental Static Cover Hero on London/Salomon/Tour */}
      {project.videoUrl ? (
        <div className="project-video-hero-wrap">
          <div className="project-detail-video-wrap container">
            <CinemaVideoPlayer
              src={project.videoUrl}
              poster={project.coverImage}
            />
          </div>
        </div>
      ) : project.id === 'huck-knife-pro' && project.gridImages && project.gridImages.length > 0 ? (
        <Suspense fallback={<div className="project-3d-placeholder" />}>
          <SalomonGalleryOrbital
            images={project.gridImages}
            title={project.title}
            isReady={true}
          />
        </Suspense>
      ) : project.id === 'new-york' && project.gridImages && project.gridImages.length > 0 ? (
        <Suspense fallback={<div className="project-3d-placeholder" />}>
          <SpiralGallery
            images={project.gridImages}
            title={project.title}
            onSelectImage={openLightbox}
            isReady={true}
          />
        </Suspense>
      ) : project.id === 'london' && project.gridImages && project.gridImages.length > 0 ? (
        <Suspense fallback={<div className="project-3d-placeholder" />}>
          <FloatingGallery
            images={project.gridImages}
            title={project.title}
            onSelectImage={openLightbox}
            isReady={true}
          />
        </Suspense>
      ) : (
        <div className="project-cover-hero">
          {/* Monumental Static Header */}
          <div className="project-cover-header">
            <div className="project-title-mask">
              <span className="project-brand-name">IK®</span>
            </div>

            <div className="project-title-mask">
              <h1 className="project-monumental-title">
                {project.title.toUpperCase()}
              </h1>
            </div>
          </div>

          {/* Static Cover Image Canvas (Pure visual hero - not clickable) */}
          <div
            className="project-cover-canvas"
            style={{ '--cover-pos': project.coverPosition || 'center' }}
          >
            <ProgressiveImage
              src={project.coverImage}
              alt={project.title}
              className="project-cover-img"
              style={{ objectPosition: project.coverPosition || 'center' }}
            />
            {/* Clean Gradient Vignette so the photo is seen clearly */}
            <div className="project-cover-vignette" />
          </div>

          {/* Badge Row at bottom of cover */}
          <div className="project-badge-row">
            <span className="project-badge">[ {typeof project.category === 'object' ? (project.category[language] || project.category.en) : project.category} ]</span>
            <span className="project-hint">
              {project.gridImages ? `${project.gridImages.length} ${dict.projectDetail.photographs}` : ''} · {project.location || dict.projectDetail.archive}
            </span>
          </div>
        </div>
      )}


      {/* Editorial animated divider matching allintitarvl */}
      <div className="project-editorial-divider-wrap">
        <motion.div
          className="project-editorial-divider"
          initial={{ scaleX: 0, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 0.15 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: [0.44, 0, 0.56, 1] }}
        />
      </div>
      
      <div className="container">
        <Reveal className="project-detail-header">
          <RevealItem className="project-detail-tag">
            <span>{dict.projectDetail.overviewTag}</span>
          </RevealItem>

          {project.subtitle && (
            <RevealItem as="h2" className="project-detail-subtitle">
              {project.subtitle}
              <DrawLine trigger="inView" duration={550} delay={150} className="draw-line--accent" />
            </RevealItem>
          )}

          <RevealItem className="project-detail-meta">
            <span>{typeof project.category === 'object' ? (project.category[language] || project.category.en) : project.category}</span>
            {project.year && <span className="meta-sep"> · </span>}
            {project.year && <span>{project.year}</span>}
            {project.location && <span className="meta-sep"> · </span>}
            {project.location && <span>{project.location}</span>}
          </RevealItem>

          <RevealItem as="p" className="project-detail-desc">
            {typeof project.description === 'object' ? (project.description[language] || project.description.en) : project.description}
          </RevealItem>
        </Reveal>

        {project.videoUrl && (
          <div className="video-stills-header">
            <span className="video-stills-tag">{dict.projectDetail.nordicArchiveTag}</span>
            <h2>{dict.projectDetail.nordicArchiveTitle}</h2>
            <p>{dict.projectDetail.nordicArchiveDesc.replace('{count}', project.gridImages.length)}</p>
          </div>
        )}

        {/* Static Two-Column Gallery Layout: zero jumping, zero re-balancing, zero duplicates */}
        <div className="project-gallery-columns">
          <div className="gallery-col">
            {project.gridImages && project.gridImages.filter((_, idx) => idx % 2 === 0).map((img, i) => (
              <div key={img} className="gallery-item-wrapper" style={{ order: i * 2 }}>
                <ProgressiveImage
                  src={img}
                  alt={`${project.title} - photo ${i * 2 + 1}`}
                  className="gallery-item"
                  onClick={() => openLightbox(img)}
                />
              </div>
            ))}
          </div>
          <div className="gallery-col">
            {project.gridImages && project.gridImages.filter((_, idx) => idx % 2 === 1).map((img, i) => (
              <div key={img} className="gallery-item-wrapper" style={{ order: i * 2 + 1 }}>
                <ProgressiveImage
                  src={img}
                  alt={`${project.title} - photo ${i * 2 + 2}`}
                  className="gallery-item"
                  onClick={() => openLightbox(img)}
                />
              </div>
            ))}
          </div>
        </div>

        {project.instagramPosts && project.instagramPosts.length > 0 && (
          <div className="instagram-section">
            <h2>{dict.projectDetail.relatedIg}</h2>
            <div className="instagram-grid">
              {project.instagramPosts.map((postUrl, idx) => {
                const embedUrl = postUrl.split('?')[0].replace(/\/$/, '') + '/embed';
                return (
                  <iframe 
                    key={idx}
                    src={embedUrl}
                    width="340" 
                    height="480" 
                    frameBorder="0" 
                    scrolling="no" 
                    allowtransparency="true"
                    style={{ background: 'white', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                  ></iframe>
                )
              })}
            </div>
          </div>
        )}

        <div className="project-navigation">
          <MotionLink to="/" className="back-link has-draw-line" {...pressable}>
            {dict.projectDetail.backToPortfolio}
            <DrawLine trigger="hover" duration={350} strokeWidth={2} />
          </MotionLink>
          <motion.button
            type="button"
            className="back-link has-draw-line"
            onClick={handleShareProject}
            style={{ background: 'none', border: 'none', cursor: 'pointer', marginLeft: 'auto' }}
            {...pressable}
          >
            {dict.projectDetail.share || 'Compartir ↗'}
            <DrawLine trigger="hover" duration={350} strokeWidth={2} />
          </motion.button>
        </div>
      </div>
      
      <Footer />

      <AnimatePresence>
        {selectedImage && (
          <motion.div
            className="lightbox"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
          >
            {/* Swipe ← → to change photo, swipe ↓ to close; a tap (no drag) closes as before */}
            <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
              <motion.img
                key={selectedImage}
                src={selectedImage}
                alt={`${project.title} — ${galleryIndex + 1} / ${galleryImages.length}`}
                className="lightbox-image"
                custom={slideDir}
                variants={lightboxSlide}
                initial="enter"
                animate="center"
                exit="exit"
                drag
                dragDirectionLock
                dragSnapToOrigin
                dragElastic={0.45}
                onDragStart={() => { lightboxDragged.current = true; }}
                onDragEnd={(e, info) => {
                  const { offset, velocity } = info;
                  if (Math.abs(offset.x) > 70 || Math.abs(velocity.x) > 500) stepLightbox(offset.x < 0 ? 1 : -1);
                  else if (offset.y > 110 || velocity.y > 600) setSelectedImage(null);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (lightboxDragged.current) {
                    lightboxDragged.current = false;
                    return;
                  }
                  setSelectedImage(null);
                }}
              />
            </AnimatePresence>
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox-nav lightbox-nav--prev"
                  aria-label={dict.projectDetail.prevImage}
                  onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="lightbox-nav lightbox-nav--next"
                  aria-label={dict.projectDetail.nextImage}
                  onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}
                >
                  ›
                </button>
                <span className="lightbox-counter" aria-hidden="true">
                  {galleryIndex + 1} / {galleryImages.length}
                </span>
              </>
            )}
            <button className="lightbox-close" onClick={() => setSelectedImage(null)}>
              {dict.projectDetail.close}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </motion.div>
  );
}
