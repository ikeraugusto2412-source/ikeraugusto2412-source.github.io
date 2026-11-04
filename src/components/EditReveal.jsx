import React, { useRef, useState } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { sizedSrc } from '../lib/images';
import './EditReveal.css';

/*
 * Before / after of an edit (inspired by the press-and-hold on labs.noomoagency.com):
 * the unedited frame shows first; holding fills a ring and then the edited photo opens
 * as a circle from where the finger or pointer is. Letting go early rewinds the ring.
 */
const HOLD_S = 1.1;

function RevealFrame({ before, after, alt }) {
  const { dict } = useLanguage();
  const [revealed, setRevealed] = useState(false);
  const [origin, setOrigin] = useState({ x: 50, y: 50 });
  const fill = useMotionValue(0);
  const dashOffset = useTransform(fill, (f) => 100 - f * 100);
  const anim = useRef(null);

  const hold = (e) => {
    if (revealed) return;
    const r = e.currentTarget.getBoundingClientRect();
    setOrigin({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
    anim.current?.stop();
    anim.current = animate(fill, 1, {
      duration: HOLD_S * (1 - fill.get()),
      ease: 'linear',
      onComplete: () => setRevealed(true),
    });
  };
  const release = () => {
    if (revealed) return;
    anim.current?.stop();
    anim.current = animate(fill, 0, { duration: 0.35, ease: 'easeOut' });
  };
  const reset = () => {
    setRevealed(false);
    fill.set(0);
  };
  const onKeyDown = (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (revealed) reset();
    else setRevealed(true);
  };

  return (
    <figure className="edit-reveal">
      <div
        className={`edit-reveal-frame ${revealed ? 'is-revealed' : ''}`}
        style={{ '--ox': `${origin.x}%`, '--oy': `${origin.y}%` }}
        role="button"
        tabIndex={0}
        aria-pressed={revealed}
        aria-label={`${alt} — ${revealed ? dict.projectDetail.editAfter : dict.projectDetail.editBefore}`}
        onPointerDown={hold}
        onPointerUp={release}
        onPointerLeave={release}
        onPointerCancel={release}
        onKeyDown={onKeyDown}
        onContextMenu={(e) => e.preventDefault()}
        data-sound="none"
      >
        <img className="edit-reveal-before" src={sizedSrc(before, 1280)} alt="" draggable="false" loading="lazy" />
        <img className="edit-reveal-after" src={sizedSrc(after, 1280)} alt="" draggable="false" loading="lazy" />
        {!revealed && (
          <span className="edit-reveal-cta" aria-hidden="true">
            <svg viewBox="0 0 40 40">
              <circle cx="20" cy="20" r="17" pathLength="100" className="edit-reveal-track" />
              <motion.circle
                cx="20"
                cy="20"
                r="17"
                pathLength="100"
                className="edit-reveal-ring"
                style={{ strokeDasharray: '100', strokeDashoffset: dashOffset }}
              />
            </svg>
            {dict.projectDetail.editHold}
          </span>
        )}
      </div>
      <figcaption className="edit-reveal-bar">
        <span>{revealed ? dict.projectDetail.editAfter : dict.projectDetail.editBefore}</span>
        {revealed && (
          <button type="button" onClick={reset}>
            {dict.projectDetail.editReplay}
          </button>
        )}
      </figcaption>
    </figure>
  );
}

export default function EditReveal({ pairs, title }) {
  const { dict } = useLanguage();
  if (!pairs?.length) return null;
  return (
    <section className="edit-reveal-section">
      <h2 className="edit-reveal-title">{dict.projectDetail.editTitle}</h2>
      {pairs.map((pair, i) => (
        <RevealFrame key={pair.after} before={pair.before} after={pair.after} alt={`${title} — ${i + 1}`} />
      ))}
    </section>
  );
}
