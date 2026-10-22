import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'framer-motion';
import { useGesture } from '@use-gesture/react';
import { fullAvif } from '../lib/images';

const MAX_ZOOM = 4;
const DOUBLE_TAP_ZOOM = 2.5;
const DOUBLE_TAP_MS = 280;
const spring = { type: 'spring', stiffness: 380, damping: 36 };

/**
 * One photo inside the project lightbox.
 * - Not zoomed: swipe ← → to change photo, swipe ↓ to close, tap to close.
 * - Pinch (or double-tap / double-click) to zoom up to 4×, drag to look around,
 *   pinch back or double-tap again to return.
 * Each photo owns its motion values, so the one leaving and the one arriving never fight.
 */
export default function LightboxPhoto({ src, alt, dir, variants, onStep, onClose }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const [zoomed, setZoomed] = useState(false);
  const lastTap = useRef(0);
  const tapTimer = useRef(null);
  const dragged = useRef(false); // a drag also ends in a click: ignore that one

  // How far the zoomed photo may move before its edge would come into view
  const bounds = (s) => {
    const el = ref.current;
    if (!el) return { x: 0, y: 0 };
    return {
      x: Math.max(0, (el.offsetWidth * s - window.innerWidth) / 2),
      y: Math.max(0, (el.offsetHeight * s - window.innerHeight) / 2),
    };
  };
  const clamp = (v, max) => Math.min(max, Math.max(-max, v));

  const zoomTo = (s, focus) => {
    const target = Math.min(MAX_ZOOM, Math.max(1, s));
    if (target <= 1.02) {
      animate(scale, 1, spring);
      animate(x, 0, spring);
      animate(y, 0, spring);
      setZoomed(false);
      return;
    }
    // Keep the point under the finger/cursor in place while zooming
    let nx = x.get();
    let ny = y.get();
    if (focus && ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const ox = focus[0] - (rect.left + rect.width / 2) + x.get();
      const oy = focus[1] - (rect.top + rect.height / 2) + y.get();
      const k = target / scale.get();
      nx = ox - k * (ox - x.get());
      ny = oy - k * (oy - y.get());
    }
    const b = bounds(target);
    animate(scale, target, spring);
    animate(x, clamp(nx, b.x), spring);
    animate(y, clamp(ny, b.y), spring);
    setZoomed(true);
  };

  const handleTap = (event) => {
    const now = Date.now();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      clearTimeout(tapTimer.current);
      lastTap.current = 0;
      zoomTo(zoomed ? 1 : DOUBLE_TAP_ZOOM, [event.clientX, event.clientY]);
      return;
    }
    lastTap.current = now;
    // Single tap closes, unless a second tap turns it into a zoom
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => {
      if (!zoomed) onClose();
    }, DOUBLE_TAP_MS);
  };

  // Live pinch: follow the fingers, keeping the point between them in place
  const followPinch = (s, origin) => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      const ox = origin[0] - (rect.left + rect.width / 2) + x.get();
      const oy = origin[1] - (rect.top + rect.height / 2) + y.get();
      const k = s / scale.get();
      x.set(ox - k * (ox - x.get()));
      y.set(oy - k * (oy - y.get()));
    }
    scale.set(s);
    if (!zoomed && s > 1.02) setZoomed(true);
  };

  useGesture(
    {
      onDrag: ({ pinching, cancel, first, last, movement: [mx, my], offset: [ox, oy], velocity: [vx, vy], direction: [, dy], memo }) => {
        if (pinching) return cancel();
        dragged.current = true;
        if (zoomed) {
          const b = bounds(scale.get());
          x.set(clamp(ox, b.x));
          y.set(clamp(oy, b.y));
          return memo;
        }
        // Not zoomed: lock to the first clear direction, then swipe
        const lock = (first ? null : memo) ?? (Math.abs(mx) > Math.abs(my) ? 'x' : 'y');
        if (lock === 'x') x.set(mx * 0.9);
        else y.set(Math.max(0, my) * 0.9 + Math.min(0, my) * 0.2);
        if (last) {
          if (lock === 'x' && (Math.abs(mx) > 70 || (vx > 0.5 && Math.abs(mx) > 20))) onStep(mx < 0 ? 1 : -1);
          else if (lock === 'y' && (my > 110 || (vy > 0.6 && dy > 0 && my > 30))) onClose();
          else {
            animate(x, 0, spring);
            animate(y, 0, spring);
          }
        }
        return lock;
      },
      onPinch: ({ offset: [s], origin, last }) => (last ? zoomTo(s, origin) : followPinch(s, origin)),
    },
    {
      target: ref,
      eventOptions: { passive: false },
      drag: { threshold: 8, from: () => [x.get(), y.get()] },
      pinch: { scaleBounds: { min: 0.8, max: MAX_ZOOM }, rubberband: true, from: () => [scale.get(), 0] },
    },
  );

  // Don't fire a pending "single tap → close" after this photo is gone
  useEffect(() => {
    const timer = tapTimer;
    return () => clearTimeout(timer.current);
  }, []);

  const avif = fullAvif(src);

  return (
    <picture style={{ display: 'contents' }}>
      {avif && <source type="image/avif" srcSet={avif} />}
      <motion.img
        ref={ref}
        src={src}
        alt={alt}
        className={`lightbox-image ${zoomed ? 'is-zoomed' : ''}`}
        custom={dir}
        variants={variants}
        initial="enter"
        animate="center"
        exit="exit"
        draggable={false}
        style={{ x, y, scale }}
        onPointerDown={() => {
          dragged.current = false;
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          handleTap(e);
        }}
      />
    </picture>
  );
}
