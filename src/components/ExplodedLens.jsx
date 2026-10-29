import React, { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLanguage } from '../context/LanguageContext';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import './ExplodedLens.css';

/*
 * "Anatomy of a lens": a line drawing of a camera lens that draws itself and comes apart as
 * the visitor scrolls (inspired by animejs.com). The section is tall and its stage sticks to
 * the screen; scroll progress drives an Anime.js timeline (draw → explode → labels), so
 * scrolling back puts the lens together again. Reduced motion: shown already exploded.
 */

const AXIS = 300; // vertical centre line of the lens in SVG units

// Side profile, front (left) to mount (right). x/w/h in SVG units, dx = how far it travels.
const PARTS = [
  { id: 'hood', x: 40, w: 150, h: 330, dx: -330, kind: 'hood' },
  { id: 'front', x: 196, w: 36, h: 300, dx: -230, kind: 'glass' },
  { id: 'filter', x: 236, w: 60, h: 318, dx: -150, kind: 'thread' },
  { id: 'focus', x: 300, w: 200, h: 336, dx: -60, kind: 'grip', accent: true },
  { id: 'scale', x: 504, w: 84, h: 300, dx: 20, kind: 'scale' },
  { id: 'aperture', x: 592, w: 26, h: 282, dx: 100, kind: 'aperture' },
  { id: 'group', x: 660, w: 120, h: 210, dx: 170, kind: 'groupGlass' },
  { id: 'body', x: 622, w: 236, h: 292, dx: 280, kind: 'barrel' },
  { id: 'mount', x: 862, w: 70, h: 248, dx: 360, kind: 'mount' },
  { id: 'rear', x: 936, w: 30, h: 170, dx: 420, kind: 'glass' },
];

// Drawn back to front so the barrel hides the optical group while assembled
const DRAW_ORDER = ['group', 'hood', 'front', 'filter', 'focus', 'scale', 'aperture', 'body', 'mount', 'rear'];

const top = (h) => AXIS - h / 2;
const range = (n) => Array.from({ length: n }, (_, i) => i);

function lensShape(x, w, h) {
  // Biconvex element: two arcs meeting at the rim
  const t = top(h);
  const b = t + h;
  return `M${x + w / 2} ${t} Q${x - w * 0.35} ${AXIS} ${x + w / 2} ${b} Q${x + w * 1.35} ${AXIS} ${x + w / 2} ${t} Z`;
}

function PartShape({ part }) {
  const { x, w, h, kind } = part;
  const t = top(h);
  const S = 'lens-stroke';
  switch (kind) {
    case 'hood':
      return (
        <>
          <path className={`${S} lens-fill`} d={`M${x} ${t} L${x + w} ${t + 26} L${x + w} ${t + h - 26} L${x} ${t + h} Z`} />
          <path className={S} d={`M${x + 18} ${t + 4} L${x + 18} ${t + h - 4}`} />
          <path className={S} d={`M${x + w - 14} ${t + 28} L${x + w - 14} ${t + h - 28}`} />
        </>
      );
    case 'glass':
      return (
        <>
          <path className={`${S} lens-glass lens-fill`} d={lensShape(x, w, h)} />
          <path className={`${S} lens-reflection`} d={`M${x + w * 0.32} ${t + h * 0.22} Q${x + w * 0.05} ${AXIS - h * 0.05} ${x + w * 0.28} ${t + h * 0.46}`} />
        </>
      );
    case 'groupGlass':
      return (
        <>
          {[0, 1, 2].map((i) => {
            const gw = 26 - i * 3;
            const gh = h - i * 26;
            return <path key={i} className={`${S} lens-glass lens-fill`} d={lensShape(x + i * 40, gw, gh)} />;
          })}
        </>
      );
    case 'thread':
      return (
        <>
          <rect className={`${S} lens-fill`} x={x} y={t} width={w} height={h} rx="4" />
          {range(7).map((i) => (
            <path key={i} className={S} d={`M${x + 8 + i * 7.5} ${t + 6} L${x + 4 + i * 7.5} ${t + h - 6}`} />
          ))}
        </>
      );
    case 'grip':
      return (
        <>
          <rect className={`${S} lens-fill`} x={x} y={t} width={w} height={h} rx="8" />
          {range(34).map((i) => (
            <path key={i} className={`${S} lens-rib`} d={`M${x + 8 + i * 5.5} ${t + 20} L${x + 8 + i * 5.5} ${t + h - 20}`} />
          ))}
          <path className={`${S} lens-accent`} d={`M${x} ${t + 12} L${x + w} ${t + 12}`} />
        </>
      );
    case 'scale':
      return (
        <>
          <rect className={`${S} lens-fill`} x={x} y={t} width={w} height={h} rx="4" />
          {range(9).map((i) => (
            <path key={i} className={S} d={`M${x + 10 + i * 8} ${t + 18} L${x + 10 + i * 8} ${t + (i % 2 ? 30 : 40)}`} />
          ))}
          {['∞', '3', '1.5', '.8'].map((n, i) => (
            <text key={n} className="lens-scale-num" x={x + 12 + i * 19} y={t + 62}>
              {n}
            </text>
          ))}
        </>
      );
    case 'aperture':
      return (
        <>
          <rect className={`${S} lens-fill`} x={x} y={t} width={w} height={h} rx="3" />
          {range(9).map((i) => (
            <path key={i} className={S} d={`M${x + 3} ${t + 20 + i * ((h - 40) / 8)} L${x + w - 3} ${t + 36 + i * ((h - 40) / 8)}`} />
          ))}
        </>
      );
    case 'barrel':
      return (
        <>
          <rect className={`${S} lens-fill lens-opaque`} x={x} y={t} width={w} height={h} rx="6" />
          {range(18).map((i) => (
            <path key={i} className={`${S} lens-rib`} d={`M${x + 120 + i * 6} ${t + 24} L${x + 120 + i * 6} ${t + h - 24}`} />
          ))}
          <path className={S} d={`M${x + 14} ${t + 40} L${x + 104} ${t + 40}`} />
          <path className={S} d={`M${x + 14} ${t + h - 40} L${x + 104} ${t + h - 40}`} />
        </>
      );
    case 'mount':
      return (
        <>
          <rect className={`${S} lens-fill`} x={x} y={t} width={w} height={h} rx="3" />
          {[0.18, 0.5, 0.82].map((f) => (
            <rect key={f} className={S} x={x + w - 2} y={t + h * f - 14} width="14" height="28" rx="2" />
          ))}
          <path className={S} d={`M${x + 22} ${t + 6} L${x + 22} ${t + h - 6}`} />
        </>
      );
    default:
      return null;
  }
}

// Portrait phones get the lens standing up: it comes apart top to bottom, labels on the sides
const PORTRAIT_QUERY = '(max-width: 768px) and (orientation: portrait)';
const subscribePortrait = (cb) => {
  const mq = window.matchMedia(PORTRAIT_QUERY);
  mq.addEventListener('change', cb);
  return () => mq.removeEventListener('change', cb);
};
const getPortrait = () => window.matchMedia(PORTRAIT_QUERY).matches;

const PIVOT = 600; // the vertical layout turns the lens 90° around (PIVOT, AXIS)

export default function ExplodedLens() {
  const { dict } = useLanguage();
  const copy = dict.about.lens;
  const reduceMotion = usePrefersReducedMotion();
  const vertical = useSyncExternalStore(subscribePortrait, getPortrait, () => false);
  const sectionRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const section = sectionRef.current;
    const root = svgRef.current;
    if (!section || !root) return undefined;
    let cancelled = false;
    let cleanup = () => {};

    import('animejs').then(({ createTimeline, svg, stagger }) => {
      if (cancelled) return;
      const tl = createTimeline({ autoplay: false, defaults: { ease: 'inOutQuad' } });
      const strokes = svg.createDrawable(root.querySelectorAll('.lens-stroke'));
      const leaders = svg.createDrawable(root.querySelectorAll('.lens-leader'));
      const move = vertical ? 'translateY' : 'translateX';

      // 1 · the drawing appears, front to back
      tl.add(strokes, { draw: ['0 0', '0 1'], duration: 320, ease: 'outQuad', delay: stagger(0.6) }, 0);
      tl.add(root.querySelectorAll('.lens-fill'), { opacity: [0, 1], duration: 140, ease: 'linear' }, 180);
      // The optical group lives inside the barrel: only show it once the barrel is solid
      tl.add(root.querySelector('[data-part="group"]'), { opacity: [0, 1], duration: 60, ease: 'linear' }, 300);
      tl.add(
        root.querySelector('.lens-rig'),
        vertical
          ? { rotate: [3, -4], scale: [1.08, 0.94], duration: 1000, ease: 'linear' }
          : { rotate: [-4, -13], scale: [1.18, 0.88], duration: 1000, ease: 'linear' },
        0,
      );
      // 2 · the parts (and their labels) slide apart along the optical axis
      PARTS.forEach((p, i) => {
        tl.add(root.querySelector(`[data-part="${p.id}"]`), { translateX: [0, p.dx], duration: 420, ease: 'inOutCubic' }, 300 + i * 12);
        tl.add(root.querySelector(`[data-label="${p.id}"]`), { [move]: [0, p.dx], duration: 420, ease: 'inOutCubic' }, 300 + i * 12);
      });
      // 3 · each part gets its name
      tl.add(leaders, { draw: ['0 0', '0 1'], duration: 160, delay: stagger(22) }, 560);
      tl.add(root.querySelectorAll('.lens-label'), { opacity: [0, 1], duration: 160, delay: stagger(22) }, 600);

      const total = tl.duration;
      if (reduceMotion) {
        tl.seek(total);
        cleanup = () => tl.revert();
        return;
      }

      let frame = 0;
      const update = () => {
        frame = 0;
        const rect = section.getBoundingClientRect();
        const travel = rect.height - window.innerHeight;
        const progress = travel > 0 ? Math.min(1, Math.max(0, -rect.top / travel)) : 1;
        tl.seek(progress * total);
      };
      const onScroll = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      update();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      cleanup = () => {
        cancelAnimationFrame(frame);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
        tl.revert();
      };
    });

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [reduceMotion, vertical]);

  const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]));

  // Label of each part: above/below it (horizontal lens) or to its left/right (standing lens)
  const label = (part) => {
    const i = PARTS.indexOf(part);
    const first = i % 2 === 0;
    const cx = part.x + part.w / 2;
    const reach = i % 4 < 2 ? 70 : 130;
    if (vertical) {
      const y = AXIS + (cx - PIVOT);
      const sign = first ? -1 : 1;
      const edge = PIVOT + (sign * part.h) / 2;
      const end = edge + sign * reach;
      return { d: `M${edge} ${y} L${end} ${y}`, x: end + sign * 14, y: y + 12, anchor: first ? 'end' : 'start' };
    }
    const sign = first ? -1 : 1;
    const edge = AXIS + (sign * part.h) / 2;
    const end = edge + sign * reach;
    return { d: `M${cx} ${edge} L${cx} ${end}`, x: cx, y: end + (first ? -12 : 26), anchor: 'middle' };
  };

  return (
    <section
      ref={sectionRef}
      className={`exploded-lens ${reduceMotion ? 'is-static' : ''} ${vertical ? 'is-vertical' : ''}`}
      aria-labelledby="exploded-lens-title"
    >
      <div className="exploded-lens-stage">
        <div className="exploded-lens-copy container">
          <span className="about-tag">{copy.tag}</span>
          <h2 id="exploded-lens-title" className="exploded-lens-title">
            {copy.title1}
            <br />
            <em>{copy.title2}</em>
          </h2>
        </div>

        <div className="exploded-lens-art">
          <svg
            key={vertical ? 'v' : 'h'}
            ref={svgRef}
            className="exploded-lens-svg"
            viewBox={vertical ? '-330 -600 1860 1760' : '-340 -30 1820 660'}
            role="img"
            aria-label={PARTS.map((p) => copy.parts[p.id]).join(', ')}
          >
            <g className="lens-rig">
              <g transform={vertical ? `rotate(90 ${PIVOT} ${AXIS})` : undefined}>
                <path className="lens-axis" d="M-340 300 L1480 300" />
                {DRAW_ORDER.map((id) => (
                  <g key={id} data-part={id} className="lens-part">
                    <PartShape part={byId[id]} />
                  </g>
                ))}
              </g>
              {PARTS.map((part) => {
                const l = label(part);
                return (
                  <g key={part.id} data-label={part.id}>
                    <path className="lens-leader" d={l.d} />
                    <text className="lens-label" x={l.x} y={l.y} textAnchor={l.anchor}>
                      {copy.parts[part.id]}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        <span className="exploded-lens-hint about-mono" aria-hidden="true">
          {copy.hint}
        </span>
      </div>
    </section>
  );
}
