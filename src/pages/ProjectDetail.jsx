import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import React, { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { projects } from '../data/projects';
import Footer from '../components/Footer';
import PageTransition from '../components/PageTransition';
import ErrorBoundary from '../components/ErrorBoundary';
import { pageVariants, pageFadeVariants } from '../components/motion/tokens';
import { Reveal, RevealItem } from '../components/motion/Reveal';
import { pressable, MotionLink } from '../components/motion/pressable';
import DrawLine from '../components/DrawLine';
import useScrollLock from '../hooks/useScrollLock';
import ProgressiveImage from '../components/ProgressiveImage';
import LightboxPhoto from '../components/LightboxPhoto';
import GalleryRuler from '../components/GalleryRuler';
import { sizedSrc } from '../lib/images';
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
  const { language, dict, localePath } = useLanguage();
  const { id } = useParams();
  const project = projects.find(p => p.id === id);
  const reduceMotion = useReducedMotion();
  const galleryRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  /*
   * The open photo lives in the URL (?foto=12, 1-based), so any photo can be shared as a link.
   * Opening adds a history entry — the phone's back gesture closes the lightbox instead of
   * leaving the page — while moving between photos replaces it.
   */
  const [searchParams, setSearchParams] = useSearchParams();
  const galleryImages = project?.gridImages ?? [];
  const fotoParam = Number(searchParams.get('foto'));
  const selectedImage =
    Number.isInteger(fotoParam) && fotoParam >= 1 && fotoParam <= galleryImages.length ? galleryImages[fotoParam - 1] : null;
  const galleryIndex = Math.max(0, galleryImages.indexOf(selectedImage));
  const [slideDir, setSlideDir] = useState(0);

  const showImage = (img, { replace }) => {
    const index = galleryImages.indexOf(img);
    if (index === -1) return;
    setSearchParams({ foto: String(index + 1) }, { replace, state: { lightbox: true }, preventScrollReset: true });
  };

  const openLightbox = (img) => {
    showImage(img, { replace: false });
    playSound('shutter');
    sileo.info({ title: dict.projectDetail.fullscreenToastTitle, description: dict.projectDetail.fullscreenToastDesc });
  };

  const closeLightbox = () => {
    if (!selectedImage) return;
    // Opened from this page: step back. Opened from a shared link: just drop the parameter.
    if (location.state?.lightbox) navigate(-1);
    else setSearchParams({}, { replace: true, preventScrollReset: true });
  };

  // Lightbox navigation across the project's photos (buttons, arrow keys, swipe)
  const stepLightbox = (dir) => {
    if (galleryImages.length < 2 || !selectedImage) return;
    setSlideDir(dir);
    showImage(neighbourImage(galleryImages, selectedImage, dir), { replace: true });
    playSound('click');
  };

  const handleShareProject = () => {
    Promise.resolve(navigator.clipboard?.writeText(window.location.href))
      .then(() => {
        if (!navigator.clipboard) throw new Error('no clipboard');
        sileo.success({ title: dict.projectDetail.linkCopiedTitle, description: dict.projectDetail.linkCopiedDesc });
      })
      .catch(() => sileo.error({ title: dict.projectDetail.linkCopyFailed, description: window.location.href }));
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useScrollLock(Boolean(selectedImage));

  useEffect(() => {
    if (!selectedImage) return undefined;
    // ESC closes the lightbox, ← → move between photos
    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox();
      const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (dir) stepLightbox(dir);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  });

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
          subtitle={`${project.gridImages ? project.gridImages.length : '30'} ${dict.projectDetail.photographs} · ${dict.projectDetail.archivalSeries}`}
          previewImages={
            project.gridImages && project.gridImages.length > 0
              ? project.gridImages.slice(0, 8).map((src) => sizedSrc(src, 640))
              : [sizedSrc(project.coverImage, 640)]
          }
        />
      {/* Top Hero: Video Player for Norway, 3D Spiral Helix on New York, or Monumental Static Cover Hero on London/Salomon/Tour */}
      {project.videoUrl ? (
        <div className="project-video-hero-wrap">
          <div className="project-detail-video-wrap container">
            <CinemaVideoPlayer
              src={project.videoUrl}
              sources={project.videoSources}
              poster={sizedSrc(project.coverImage, window.innerWidth * (window.devicePixelRatio || 1))}
            />
          </div>
        </div>
      ) : project.id === 'huck-knife-pro' && project.gridImages && project.gridImages.length > 0 ? (
        <ErrorBoundary inline>
        <Suspense fallback={<div className="project-3d-placeholder" />}>
          <SalomonGalleryOrbital
            images={project.gridImages}
            title={project.title}
            isReady={true}
          />
        </Suspense>
        </ErrorBoundary>
      ) : project.id === 'new-york' && project.gridImages && project.gridImages.length > 0 ? (
        <ErrorBoundary inline>
        <Suspense fallback={<div className="project-3d-placeholder" />}>
          <SpiralGallery
            images={project.gridImages}
            title={project.title}
            onSelectImage={openLightbox}
            isReady={true}
          />
        </Suspense>
        </ErrorBoundary>
      ) : project.id === 'london' && project.gridImages && project.gridImages.length > 0 ? (
        <ErrorBoundary inline>
        <Suspense fallback={<div className="project-3d-placeholder" />}>
          <FloatingGallery
            images={project.gridImages}
            title={project.title}
            onSelectImage={openLightbox}
            isReady={true}
          />
        </Suspense>
        </ErrorBoundary>
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
              priority
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
        <div className="project-gallery-columns" ref={galleryRef}>
          <div className="gallery-col">
            {project.gridImages && project.gridImages.filter((_, idx) => idx % 2 === 0).map((img, i) => (
              <div key={img} className="gallery-item-wrapper" style={{ order: i * 2 }} data-photo={i * 2}>
                <ProgressiveImage
                  src={img}
                  alt={`${project.title} — ${dict.projectDetail.photo} ${i * 2 + 1}`}
                  className="gallery-item"
                  sizes="(max-width: 640px) 100vw, 50vw"
                  onClick={() => openLightbox(img)}
                />
              </div>
            ))}
          </div>
          <div className="gallery-col">
            {project.gridImages && project.gridImages.filter((_, idx) => idx % 2 === 1).map((img, i) => (
              <div key={img} className="gallery-item-wrapper" style={{ order: i * 2 + 1 }} data-photo={i * 2 + 1}>
                <ProgressiveImage
                  src={img}
                  alt={`${project.title} — ${dict.projectDetail.photo} ${i * 2 + 2}`}
                  className="gallery-item"
                  sizes="(max-width: 640px) 100vw, 50vw"
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
                    title={`${dict.projectDetail.relatedIg} ${idx + 1}`}
                    loading="lazy"
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
          <MotionLink to={localePath('/')} className="back-link has-draw-line" {...pressable}>
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
            onClick={closeLightbox}
          >
            {/* Swipe ← → to change photo, swipe ↓ or tap to close, pinch / double-tap to zoom */}
            <AnimatePresence initial={false} custom={slideDir} mode="popLayout">
              <LightboxPhoto
                key={selectedImage}
                src={selectedImage}
                alt={`${project.title} — ${galleryIndex + 1} / ${galleryImages.length}`}
                dir={slideDir}
                variants={lightboxSlide}
                onStep={stepLightbox}
                onClose={closeLightbox}
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
            <button className="lightbox-close" onClick={(e) => { e.stopPropagation(); closeLightbox(); }}>
              {dict.projectDetail.close}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {galleryImages.length > 1 && (
        <GalleryRuler count={galleryImages.length} galleryRef={galleryRef} hidden={Boolean(selectedImage)} />
      )}
      </div>
    </motion.div>
  );
}
