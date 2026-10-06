import React, { useEffect, useRef } from 'react';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import './DrawLine.css';

/*
 * DrawLine — SVG stroke drawn with Anime.js v4 (loaded on demand, so it never
 * weighs on the initial bundle). The stroke uses currentColor.
 *
 *   variant   'underline' (thin line under a title/link) | 'frame' (camera viewfinder corners)
 *   path      custom path `d` (overrides variant); pass `viewBox` with it
 *   trigger   'inView' draws once when scrolled into view
 *             'hover'  draws on hover/focus of the parent element, retracts on leave
 *             'mount'  draws right away (after `delay`)
 *   duration  ms (300–600 for UI; the preloader passes its own)
 *
 * Hover mode listens on the parent element, which should be position: relative
 * (add the `has-draw-line` class) when using the underline variant.
 */
const VARIANTS = {
  underline: { viewBox: '0 0 100 2', paths: ['M0 1 H100'] },
  frame: {
    viewBox: '0 0 100 60',
    paths: ['M0 14 V0 H16', 'M84 0 H100 V14', 'M100 46 V60 H84', 'M16 60 H0 V46'],
  },
};

export default function DrawLine({
  variant = 'underline',
  path,
  viewBox,
  trigger = 'inView',
  duration = 450,
  delay = 0,
  strokeWidth = 1,
  className = '',
}) {
  const svgRef = useRef(null);
  const reduced = usePrefersReducedMotion();
  const shape = path ? { viewBox: viewBox ?? '0 0 100 100', paths: [path] } : VARIANTS[variant] ?? VARIANTS.underline;

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return undefined;

    let cancelled = false;
    let anim = null;
    let detach = () => {};

    import('animejs')
      .then(({ animate, svg }) => {
        if (cancelled) return;
        const drawables = svg.createDrawable(svgEl.querySelectorAll('path'), 0, 0);
        svgEl.style.visibility = 'visible';

        const drawTo = (draw, ms, extra = {}) => {
          anim?.pause();
          anim = animate(drawables, { draw, duration: reduced ? 0 : ms, ease: 'outCubic', ...extra });
        };
        const drawIn = () => drawTo('0 1', duration, { delay: reduced ? 0 : delay });

        if (trigger === 'mount') {
          drawIn();
        } else if (trigger === 'inView') {
          const io = new IntersectionObserver(
            ([entry]) => {
              if (!entry.isIntersecting) return;
              drawIn();
              io.disconnect();
            },
            { rootMargin: '0px 0px -10% 0px' },
          );
          io.observe(svgEl);
          detach = () => io.disconnect();
        } else if (trigger === 'hover') {
          const host = svgEl.parentElement;
          // Real hover only: a tap on a touch screen fires pointerenter too, which would leave the line stuck
          const isTouch = (e) => e.pointerType && e.pointerType !== 'mouse';
          const enter = (e) => {
            if (!isTouch(e)) drawTo('0 1', duration);
          };
          // Retract towards the right, then reset so the next hover grows from the left again
          const leave = (e) => {
            if (isTouch(e)) return;
            drawTo('1 1', duration * 0.8, {
              onComplete: () => drawables.forEach((d) => { d.draw = '0 0'; }),
            });
          };
          host.addEventListener('pointerenter', enter);
          host.addEventListener('pointerleave', leave);
          host.addEventListener('focusin', enter);
          host.addEventListener('focusout', leave);
          detach = () => {
            host.removeEventListener('pointerenter', enter);
            host.removeEventListener('pointerleave', leave);
            host.removeEventListener('focusin', enter);
            host.removeEventListener('focusout', leave);
          };
        }
      })
      .catch(() => {
        /* animejs failed to load: leave the line hidden rather than break the page */
      });

    return () => {
      cancelled = true;
      detach();
      anim?.cancel();
    };
  }, [trigger, duration, delay, reduced]);

  return (
    <svg
      ref={svgRef}
      className={`draw-line draw-line--${path ? 'custom' : variant} ${className}`}
      viewBox={shape.viewBox}
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {shape.paths.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          vectorEffect="non-scaling-stroke"
          strokeLinecap="square"
        />
      ))}
    </svg>
  );
}
