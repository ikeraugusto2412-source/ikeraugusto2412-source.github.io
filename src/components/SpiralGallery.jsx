import React, { useEffect, useRef, useState } from 'react';
import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion';
import { sizedSrc } from '../lib/images';
import './SpiralGallery.css';

/*
 * New York hero (after pacomepertant.com's spiral view): every photo sits on an endless helix
 * built with CSS 3D. It turns slowly on its own, a little more as you scroll the page, and by
 * dragging sideways. The photos facing you are lit; the ones turning away fade into the dark.
 * Tap a photo to open it full screen.
 */
const STEP = 360 / 10; // ten photos per turn
const AUTO_DEG_PER_S = 5;
const SCROLL_DEG_PER_PX = 0.12;
const DRAG_DEG_PER_PX = 0.35;

const layoutFor = (w) =>
  w <= 768 ? { radius: Math.min(150, w * 0.38), width: 104, rise: 44 } : { radius: Math.min(400, w * 0.27), width: 170, rise: 66 };

function HelixPhoto({ src, index, count, rot, layout, onOpen, label }) {
  const transform = useTransform(rot, (r) => {
    // position on an endless helix: k = 0 is the photo facing you, ±count/2 the farthest away
    const k = ((((index + r / STEP) % count) + count * 1.5) % count) - count / 2;
    return `translate(-50%, -50%) rotateY(${k * STEP}deg) translateZ(${layout.radius}px) translateY(${k * layout.rise}px)`;
  });
  const opacity = useTransform(rot, (r) => {
    const k = ((((index + r / STEP) % count) + count * 1.5) % count) - count / 2;
    const facing = Math.max(0, Math.cos((k * STEP * Math.PI) / 180)) ** 1.5;
    const far = Math.min(1, Math.max(0, 1 - (Math.abs(k) - 8) / 6)); // fade the ends of the visible turns
    return (0.07 + 0.93 * facing) * far;
  });
  const px = layout.width * (window.devicePixelRatio || 1);

  return (
    <motion.button
      type="button"
      className="spiral-photo"
      style={{ transform, opacity, width: layout.width }}
      onTap={() => onOpen?.(src)}
      aria-label={label}
      data-cursor-text="VIEW"
    >
      <img src={sizedSrc(src, px > 200 ? 640 : 320)} alt="" draggable={false} decoding="async" fetchPriority="low" />
    </motion.button>
  );
}

export default function SpiralGallery({ images = [], title = 'New York', onSelectImage, isReady = true }) {
  const stageRef = useRef(null);
  const reduceMotion = useReducedMotion();
  const inView = useInView(stageRef, { margin: '200px' });
  const [layout, setLayout] = useState(() => layoutFor(window.innerWidth));
  const [dragging, setDragging] = useState(false);
  const rot = useMotionValue(0);
  const smooth = useSpring(rot, { stiffness: 70, damping: 22, mass: 0.8 });
  const holding = useRef(false);

  useEffect(() => {
    const onResize = () => setLayout(layoutFor(window.innerWidth));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Scrolling the page turns the helix a little, in both directions
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (inView) rot.set(rot.get() - (y - lastY) * SCROLL_DEG_PER_PX);
      lastY = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [inView, rot]);

  useAnimationFrame((_, delta) => {
    if (reduceMotion || !inView || holding.current || !isReady) return;
    rot.set(rot.get() - (AUTO_DEG_PER_S * Math.min(delta, 64)) / 1000);
  });

  return (
    <div className="spiral-gallery-wrapper">
      {/* Monumental Header with masked slide-up entrance */}
      <div className="spiral-gallery-header">
        <div className="spiral-title-mask">
          <motion.span
            className="spiral-brand-name"
            initial={{ y: 80, opacity: 0 }}
            animate={isReady ? { y: 0, opacity: 1 } : { y: 80, opacity: 0 }}
            transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
          >
            IK®
          </motion.span>
        </div>

        <div className="spiral-title-mask">
          <motion.h1
            className="spiral-project-title"
            initial={{ y: 90, opacity: 0 }}
            animate={isReady ? { y: 0, opacity: 1 } : { y: 90, opacity: 0 }}
            transition={{ delay: 0.06, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {title}
          </motion.h1>
        </div>
      </div>

      {/* Badge Row with staggered fade-up */}
      <motion.div
        className="spiral-badge-row"
        initial={{ opacity: 0, y: 20 }}
        animate={isReady ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ delay: 0.16, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="spiral-badge">[3D HELIX GALLERY]</span>
        <span className="spiral-hint">DRAG TO ROTATE · SCROLL TO EXPLORE</span>
      </motion.div>

      <motion.div
        ref={stageRef}
        className={`spiral-3d-stage ${dragging ? 'is-interacting' : ''}`}
        initial={{ opacity: 0, scale: 0.94 }}
        animate={isReady ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.94 }}
        transition={{ delay: 0.2, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        onPointerDown={() => (holding.current = true)}
        onPointerUp={() => (holding.current = false)}
        onPointerCancel={() => (holding.current = false)}
        onPointerLeave={() => (holding.current = false)}
        onPanStart={() => setDragging(true)}
        onPan={(_, info) => rot.set(rot.get() + info.delta.x * DRAG_DEG_PER_PX)}
        onPanEnd={(_, info) => {
          setDragging(false);
          holding.current = false;
          rot.set(rot.get() + info.velocity.x * 0.05); // a little momentum
        }}
      >
        <div className="spiral-helix">
          {images.map((src, i) => (
            <HelixPhoto
              key={src}
              src={src}
              index={i}
              count={images.length}
              rot={smooth}
              layout={layout}
              onOpen={dragging ? undefined : onSelectImage}
              label={`${title} ${i + 1}`}
            />
          ))}
        </div>
      </motion.div>

      <div className="spiral-bottom-fade" />
    </div>
  );
}
