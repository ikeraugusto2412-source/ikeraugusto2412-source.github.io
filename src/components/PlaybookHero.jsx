import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import useIntroReady from '../lib/introGate';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import { EASE, DUR, RISE } from './motion/tokens';
import SplitReveal from './motion/SplitReveal';
import './PlaybookHero.css';

/*
 * Entrance choreography, played once the preloader curtain starts lifting:
 * title leads, the cards in view follow left → right, the editorial bar settles last.
 * Everything rises from below; only the start time varies, never the curve.
 */
const FIRST_VISIBLE = 6; // the track starts one full set in, so cards 6+ are the ones on screen
const titleVariants = {
  hidden: { opacity: 0, y: RISE * 1.5 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, delay: i * 0.08, ease: EASE },
  }),
};
const cardVariants = {
  hidden: { opacity: 0, y: RISE },
  visible: (order) => ({
    opacity: 1,
    y: 0,
    transition: { duration: DUR.slow, delay: 0.2 + order * 0.06, ease: EASE },
  }),
};
const barVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: DUR.standard, delay: 0.7, ease: EASE } },
};

// Curated galleries with diverse aspect ratios & dimensions (like in allintitarvl.framer.website)
const GALLERIES = [
  {
    id: 'new-york',
    num: '001',
    title: 'NEW YORK',
    field: 'STREET PHOTOGRAPHY',
    count: '51 PHOTOGRAPHS',
    image: '/assets/ny/portada.webp',
    // Flagship prominent large cover
    width: 420,
    height: 520,
    active: true,
    link: '/project/new-york',
  },
  {
    id: 'norway',
    num: '002',
    title: 'NORWAY',
    field: 'VIDEO BLOG · CINEMA',
    count: 'VLOG + 30 PHOTOGRAPHS',
    image: '/assets/Noruega/webp/_6M25407.webp',
    // Wide cinematic cover
    width: 440,
    height: 380,
    active: false,
    link: '/project/norway',
  },
  {
    id: 'london',
    num: '003',
    title: 'LONDON',
    field: 'STREET & ARCHITECTURE',
    count: '35 PHOTOGRAPHS',
    image: '/assets/london/webp/foto portada 2.webp',
    // Tall portrait cover
    width: 360,
    height: 480,
    active: false,
    link: '/project/london',
  },
  {
    id: 'huck-knife-pro',
    num: '004',
    title: 'HUCK KNIFE PRO',
    field: 'SALOMON · MILANO 2026',
    count: '13 PHOTOGRAPHS',
    image: '/assets/salomon/webp/portada.webp',
    // Tall product cover
    width: 370,
    height: 510,
    active: false,
    link: '/project/huck-knife-pro',
  },
  {
    id: 'tour-de-france',
    num: '005',
    title: 'TOUR DE FRANCE',
    field: 'SPORTS & ACTION · SITGES',
    count: '23 PHOTOGRAPHS',
    image: '/assets/tour-de-france/webp/portada1.webp',
    // Dynamic sports action portrait (Tadej Pogačar maillot a pois)
    width: 380,
    height: 520,
    active: false,
    link: '/project/tour-de-france',
  },
  {
    id: 'the-weeknd',
    num: '006',
    title: 'THE WEEKND',
    field: 'LEICA D-LUX 4 · CONCERT',
    count: '20 PHOTOGRAPHS',
    image: '/assets/the-weeknd/webp/fotoportada1.webp',
    // Tall portrait cover (fotoportada1)
    width: 370,
    height: 520,
    active: false,
    link: '/project/the-weeknd',
  },
  {
    id: 'hugo-bravo',
    num: '007',
    title: 'HUGO BRAVO',
    field: 'PARIS TO SITGES · 1,250 KM',
    count: '25 PHOTOGRAPHS',
    image: '/assets/hugo-bravo/webp/foto portada 1.webp',
    // Tall portrait cover matching Playbook card format
    width: 370,
    height: 520,
    active: false,
    link: '/project/hugo-bravo',
  },
];

export default function PlaybookHero() {
  const { dict } = useLanguage();
  const containerRef = useRef(null);
  const trackRef = useRef(null);
  const cardRefs = useRef([]);
  const navigate = useNavigate();
  const introReady = useIntroReady();
  const reduceMotion = usePrefersReducedMotion();
  const reduceMotionRef = useRef(reduceMotion);
  useEffect(() => {
    reduceMotionRef.current = reduceMotion;
  }, [reduceMotion]);

  // Tripled array for seamless infinite loop
  const loopedGalleries = [...GALLERIES, ...GALLERIES, ...GALLERIES];

  // Physics state matching allintitarvl.framer.website decompiled engine
  const physics = useRef({
    x: 0,
    targetX: 0,
    prevX: 0,
    tilt: 0,
    targetTilt: 0,
    tiltVel: 0,
  });

  const singleSetWidth = useRef(0);
  const isDragging = useRef(false);
  const hasMoved = useRef(false);
  const dragStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    const G = 0.1;
    const K = 0.75;
    const maxTilt = 28; // deg
    const speedScale = 1.3;
    const smoothness = 0.08;
    const scrollSpeed = 2.0;

    // Measure total width of 1 set
    const measure = () => {
      if (!trackRef.current) return;
      const totalW = trackRef.current.scrollWidth;
      singleSetWidth.current = totalW / 3;
      if (physics.current.x === 0 && singleSetWidth.current > 0) {
        physics.current.x = -singleSetWidth.current;
        physics.current.targetX = -singleSetWidth.current;
        physics.current.prevX = -singleSetWidth.current;
      }
    };

    measure();
    window.addEventListener('resize', measure);

    // Wheel event: vertical wheel translates into horizontal movement
    const onWheel = (e) => {
      e.preventDefault();
      const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
      const clamped = Math.sign(delta) * Math.min(Math.abs(delta), 90);
      physics.current.targetX -= clamped * scrollSpeed * 0.7;
    };

    // Touch events
    const onTouchStart = (e) => {
      hasMoved.current = false;
      touchStartY.current = e.touches[0].clientY;
      dragStartX.current = e.touches[0].clientX;
    };

    const onTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const currentX = e.touches[0].clientX;
      const diffY = touchStartY.current - currentY;
      const diffX = dragStartX.current - currentX;

      touchStartY.current = currentY;
      dragStartX.current = currentX;

      const diff = Math.abs(diffX) > Math.abs(diffY) ? diffX : diffY;
      if (Math.abs(diff) > 2) hasMoved.current = true;
      physics.current.targetX -= diff * 1.5;
    };

    // Release drag even if the mouse is let go outside the carousel
    const onWindowMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', onWindowMouseUp);

    const container = containerRef.current;
    if (container) {
      container.addEventListener('wheel', onWheel, { passive: false });
      container.addEventListener('touchstart', onTouchStart, { passive: true });
      container.addEventListener('touchmove', onTouchMove, { passive: true });
    }

    // Animation loop with 3D tilt
    let animId;
    let lastTime = performance.now();
    const lastWrite = { x: '', tilt: '' };

    const loop = (now) => {
      const s = Math.min((now - lastTime) / 16.67, 3);
      lastTime = now;

      const p = physics.current;
      p.prevX = p.x;

      // Exponential smoothing
      p.x += (p.targetX - p.x) * (1 - Math.pow(1 - smoothness, s));

      // Velocity
      const velocity = p.x - p.prevX;

      // Dynamic tilt based on velocity
      // Reduced motion: the carousel still scrolls, but the cards stay flat (no 3D swing)
      if (reduceMotionRef.current) {
        p.targetTilt = 0;
      } else if (Math.abs(velocity) > 0.05) {
        p.targetTilt = Math.max(-maxTilt, Math.min(maxTilt, velocity * speedScale * 1.5));
      } else {
        p.targetTilt = 0;
      }

      // Spring tilt physics
      const diff = (p.targetTilt - p.tilt) * G;
      p.tiltVel = (p.tiltVel + diff * s) * Math.pow(K, s);
      p.tilt += p.tiltVel;

      // Infinite wrapping
      const setW = singleSetWidth.current;
      if (setW > 0) {
        if (p.x < -setW * 2) {
          p.x += setW;
          p.targetX += setW;
          p.prevX += setW;
        } else if (p.x > 0) {
          p.x -= setW;
          p.targetX -= setW;
          p.prevX -= setW;
        }
      }

      // Idle (nothing moving): skip the DOM writes so phones aren't restyling 27 cards every frame
      const tiltDeg = p.tilt.toFixed(2);
      const xStr = p.x.toFixed(2);
      if (xStr !== lastWrite.x || tiltDeg !== lastWrite.tilt) {
        lastWrite.x = xStr;
        lastWrite.tilt = tiltDeg;

        // Apply transform to track
        if (trackRef.current) {
          trackRef.current.style.transform = `translate3d(${xStr}px, 0, 0)`;
        }

        // Apply 3D rotateY to every card
        cardRefs.current.forEach((el) => {
          if (el) {
            el.style.transform = `translateZ(0) rotateY(${tiltDeg}deg)`;
          }
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', measure);
      window.removeEventListener('mouseup', onWindowMouseUp);
      if (container) {
        container.removeEventListener('wheel', onWheel);
        container.removeEventListener('touchstart', onTouchStart);
        container.removeEventListener('touchmove', onTouchMove);
      }
    };
  }, []);

  // Mouse Drag handlers
  const onMouseDown = (e) => {
    isDragging.current = true;
    hasMoved.current = false;
    dragStartX.current = e.clientX;
  };

  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    const diff = e.clientX - dragStartX.current;
    if (Math.abs(diff) > 4) {
      hasMoved.current = true;
    }
    dragStartX.current = e.clientX;
    physics.current.targetX += diff * 1.5;
  };

  const handleCardClick = (item) => {
    if (hasMoved.current) return;
    if (item.link) navigate(item.link);
  };

  return (
    <motion.div
      ref={containerRef}
      className="playbook-fullscreen-stage"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      initial="hidden"
      animate={introReady ? 'visible' : 'hidden'}
    >
      {/* Title Header */}
      <div className="playbook-top-hero">
        <motion.h1
          className="playbook-brand"
          variants={titleVariants}
          custom={0}
        >
          IK®
        </motion.h1>

        <h2 className="playbook-main-title">
          <SplitReveal text={dict.playbook.title} play={introReady} delay={0.08} />
        </h2>
      </div>

      {/* Horizontal Carousel Viewport */}
      <div className="playbook-carousel-viewport">
        <div ref={trackRef} className="playbook-horizontal-track">
          {loopedGalleries.map((item, idx) => {
            const cardNum = String((idx % GALLERIES.length) + 1).padStart(3, '0');
            return (
              <motion.div
                key={`${item.id}-${idx}`}
                className="playbook-perspective-wrapper"
                variants={cardVariants}
                custom={Math.min(Math.max(idx - FIRST_VISIBLE, 0), 6)}
              >
                <div
                  ref={(el) => (cardRefs.current[idx] = el)}
                  className={`playbook-dynamic-card ${item.active ? 'is-flagship' : ''}`}
                  data-sound-hover
                  style={{
                    width: `${item.width}px`,
                    height: `${item.height}px`,
                  }}
                  onClick={() => handleCardClick(item)}
                >
                  {/* Image */}
                  <div className="card-image-wrap">
                    <img
                      src={item.image}
                      alt={item.title}
                      draggable="false"
                      loading={idx < 8 ? 'eager' : 'lazy'}
                    />
                  </div>

                  {/* Top Slide-Down Label (Framer Style) */}
                  <div className="card-slide-top">
                    <span className="card-tag-num">{cardNum}</span>
                    {item.active && <span className="card-flagship-badge">{dict.playbook.active}</span>}
                  </div>

                  {/* Bottom Slide-Up Label (Framer Style) */}
                  <div className="card-slide-bottom">
                    <div className="card-title-line">{item.title}</div>
                    <div className="card-field-line">
                      {dict.playbook.galleries?.[item.id]?.field || item.field}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Bottom Editorial Bar */}
      <motion.div className="playbook-bottom-bar" variants={barVariants}>
        <div className="playbook-status-badge">
          <span className="badge-dot" />
          <span>{dict.playbook.statusBadge}</span>
        </div>

        <div className="playbook-scroll-indicator">
          <span>{dict.playbook.scrollHint}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
