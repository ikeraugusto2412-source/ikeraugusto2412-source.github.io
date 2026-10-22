import React, { useRef, useSyncExternalStore } from 'react';
import { useSprings, animated, to, easings } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { useLanguage } from '../context/LanguageContext';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import Photo from './Photo';
import './FloatingGallery.css';

/*
 * FloatingGallery — London hero. Photos float around the title with React-Spring physics:
 *  - idle float (looping spring), mouse parallax by depth, springy hover scale
 *  - drag with inertia: on release the photo keeps its momentum, then springs back home
 *  - the others shy away from the photo being dragged (subtle repulsion)
 *  - a tap/click (< 5 px of travel) opens the lightbox via onSelectImage
 * Layout is deterministic (fixed slots). Reduced motion: static photos, click only.
 */

// x/y: slot centre in % of the stage; w: width in px at the reference viewport; d: parallax depth
const DESKTOP_SLOTS = [
  { x: 11, y: 24, w: 210, d: 0.6 },
  { x: 29, y: 15, w: 150, d: 1.0 },
  { x: 71, y: 17, w: 190, d: 0.8 },
  { x: 89, y: 31, w: 160, d: 1.2 },
  { x: 8, y: 63, w: 170, d: 1.1 },
  { x: 25, y: 80, w: 220, d: 0.7 },
  { x: 45, y: 72, w: 140, d: 1.3 },
  { x: 63, y: 80, w: 200, d: 0.9 },
  { x: 81, y: 69, w: 230, d: 0.6 },
  { x: 94, y: 86, w: 130, d: 1.2 },
  { x: 51, y: 13, w: 120, d: 1.4 },
  { x: 36, y: 38, w: 110, d: 1.1 },
];
const DESKTOP_REF = 1440;

const MOBILE_SLOTS = [
  { x: 22, y: 17, w: 120, d: 0.8 },
  { x: 72, y: 14, w: 100, d: 1.1 },
  { x: 88, y: 38, w: 86, d: 1.2 },
  { x: 12, y: 40, w: 86, d: 1.0 },
  { x: 20, y: 74, w: 110, d: 0.9 },
  { x: 55, y: 84, w: 96, d: 1.2 },
  { x: 86, y: 70, w: 118, d: 0.7 },
];
const MOBILE_REF = 390;

const MOBILE_QUERY = '(max-width: 700px)';
const subscribeMobile = (cb) => {
  const mql = window.matchMedia(MOBILE_QUERY);
  mql.addEventListener('change', cb);
  return () => mql.removeEventListener('change', cb);
};
const useIsMobile = () =>
  useSyncExternalStore(subscribeMobile, () => window.matchMedia(MOBILE_QUERY).matches, () => false);

const BASE_SPRING = { tension: 170, friction: 22 };
const HOVER_SPRING = { tension: 320, friction: 14 };
const REPULSE_RADIUS = 260;
const REPULSE_PUSH = 36;
const MAX_THROW = 360;

export default function FloatingGallery({ images = [], title = 'London', onSelectImage, isReady = true }) {
  const { dict } = useLanguage();
  const reduced = usePrefersReducedMotion();
  const isMobile = useIsMobile();
  const stageRef = useRef(null);
  const itemRefs = useRef([]);
  const topZ = useRef(10);
  const dragging = useRef(false);
  const parallaxFrame = useRef(0);

  const slots = isMobile ? MOBILE_SLOTS : DESKTOP_SLOTS;
  const refWidth = isMobile ? MOBILE_REF : DESKTOP_REF;
  const items = slots.slice(0, images.length).map((slot, i) => ({
    ...slot,
    src: images[i],
    // heavier photos move more lazily
    mass: 0.7 + (slot.w / 230) * 0.8,
  }));

  const [springs, api] = useSprings(
    items.length,
    (i) => ({ x: 0, y: 0, rx: 0, ry: 0, px: 0, py: 0, s: 1, config: { ...BASE_SPRING, mass: items[i].mass } }),
    [items.length],
  );

  // Idle float: each photo drifts a few px on its own slow loop
  const [floats] = useSprings(
    items.length,
    (i) =>
      reduced
        ? { fx: 0, fy: 0, immediate: true }
        : {
            from: { fx: -(4 + (i % 3) * 3), fy: -(6 + (i % 4) * 2) },
            to: { fx: 4 + (i % 3) * 3, fy: 6 + (i % 4) * 2 },
            loop: { reverse: true },
            delay: i * 140,
            config: { duration: 3200 + i * 370, easing: easings.easeInOutSine },
          },
    [items.length, reduced],
  );

  const onPointerMove = (e) => {
    if (reduced || dragging.current || e.pointerType !== 'mouse' || !stageRef.current) return;
    const { clientX, clientY } = e;
    cancelAnimationFrame(parallaxFrame.current);
    parallaxFrame.current = requestAnimationFrame(() => {
      const r = stageRef.current.getBoundingClientRect();
      const mx = ((clientX - r.left) / r.width) * 2 - 1;
      const my = ((clientY - r.top) / r.height) * 2 - 1;
      api.start((i) => ({ px: -mx * 18 * items[i].d, py: -my * 14 * items[i].d }));
    });
  };

  const onPointerLeave = () => {
    cancelAnimationFrame(parallaxFrame.current);
    api.start({ px: 0, py: 0 });
  };

  const hover = (index, on) => (e) => {
    if (reduced || dragging.current || e.pointerType !== 'mouse') return;
    api.start((i) => (i === index ? { s: on ? 1.08 : 1, config: { ...HOVER_SPRING, mass: items[i].mass } } : {}));
  };

  const centreOf = (el) => {
    const r = el.getBoundingClientRect();
    return [r.left + r.width / 2, r.top + r.height / 2];
  };

  const bind = useDrag(
    ({ args: [index], first, active, last, tap, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], memo }) => {
      if (tap) {
        // < 5 px of travel: treat as a click, settle the photo back and open the lightbox
        dragging.current = false;
        if (memo) api.start((i) => (i === index ? { x: memo.x, y: memo.y, s: 1 } : { rx: 0, ry: 0 }));
        onSelectImage?.(items[index].src);
        return memo;
      }
      if (reduced) return memo;

      if (first) {
        dragging.current = true;
        const el = itemRefs.current[index];
        if (el) {
          topZ.current += 1;
          el.style.zIndex = String(topZ.current);
        }
        memo = {
          x: springs[index].x.get(),
          y: springs[index].y.get(),
          start: el ? centreOf(el) : [0, 0],
          others: itemRefs.current.map((other) => (other ? centreOf(other) : null)),
        };
      }
      if (!memo) return memo;

      if (active) {
        const cx = memo.start[0] + mx;
        const cy = memo.start[1] + my;
        api.start((i) => {
          if (i === index) {
            return { x: memo.x + mx, y: memo.y + my, s: 1.1, immediate: (key) => key === 'x' || key === 'y' };
          }
          const c = memo.others[i];
          if (!c) return {};
          const ox = c[0] - cx;
          const oy = c[1] - cy;
          const dist = Math.hypot(ox, oy) || 1;
          const push = dist < REPULSE_RADIUS ? (1 - dist / REPULSE_RADIUS) * REPULSE_PUSH : 0;
          return { rx: (ox / dist) * push, ry: (oy / dist) * push };
        });
      }

      if (last) {
        dragging.current = false;
        const clamp = (v) => Math.max(-MAX_THROW, Math.min(MAX_THROW, v));
        const throwX = memo.x + mx + clamp(vx * dx * 180);
        const throwY = memo.y + my + clamp(vy * dy * 180);
        api.start((i) => {
          if (i !== index) return { rx: 0, ry: 0 };
          const mass = items[i].mass;
          return {
            to: async (next) => {
              // keep the momentum, then drift back home on a soft spring
              await next({ x: throwX, y: throwY, s: 1, config: { tension: 120, friction: 26, mass } });
              await next({ x: 0, y: 0, config: { tension: 40, friction: 14, mass } });
            },
          };
        });
      }
      return memo;
    },
    { filterTaps: true, tapsThreshold: 5, pointer: { capture: true } },
  );

  return (
    <section
      ref={stageRef}
      className={`floating-gallery ${isReady ? 'is-ready' : ''} ${reduced ? 'is-static' : ''}`}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="project-cover-header floating-gallery-header">
        <div className="project-title-mask">
          <span className="project-brand-name">IK®</span>
        </div>
        <div className="project-title-mask">
          <h1 className="project-monumental-title">{title.toUpperCase()}</h1>
        </div>
      </div>

      {springs.map((sp, i) => {
        const item = items[i];
        const fl = floats[i];
        return (
          <animated.div
            key={`${item.src}-${i}`}
            ref={(el) => (itemRefs.current[i] = el)}
            {...bind(i)}
            className="floating-gallery-item"
            onPointerEnter={hover(i, true)}
            onPointerLeave={hover(i, false)}
            style={{
              left: `${item.x}%`,
              top: `${item.y}%`,
              width: `clamp(${Math.round(item.w * 0.55)}px, ${((item.w / refWidth) * 100).toFixed(3)}vw, ${Math.round(item.w * 1.25)}px)`,
              transform: to(
                [sp.x, sp.y, sp.rx, sp.ry, sp.px, sp.py, fl.fx, fl.fy, sp.s],
                (x, y, rx, ry, px, py, fx, fy, s) =>
                  `translate(-50%, -50%) translate3d(${(x + rx + px + fx).toFixed(2)}px, ${(y + ry + py + fy).toFixed(2)}px, 0) scale(${s.toFixed(4)})`,
              ),
            }}
          >
            <Photo src={item.src} sizes="240px" alt={`${title} — ${i + 1}`} draggable={false} loading={i < 6 ? 'eager' : 'lazy'} decoding="async" />
          </animated.div>
        );
      })}

      <span className="floating-gallery-hint">{dict.projectDetail.floatingHint}</span>
    </section>
  );
}
