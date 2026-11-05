import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { sizedSrc } from '../lib/images';
import './BehindTheScenes.css';

/*
 * "Behind the scenes" strip at the end of a gallery (after podium.global): the making-of photos
 * listed in the project's `btsImages`, dragged sideways. Renders nothing for a project without them.
 */
export default function BehindTheScenes({ images }) {
  const { dict } = useLanguage();
  const viewport = useRef(null);
  const track = useRef(null);
  const [max, setMax] = useState(0);

  useEffect(() => {
    if (!track.current) return undefined;
    const measure = () => setMax(Math.max(0, track.current.scrollWidth - viewport.current.clientWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(viewport.current);
    return () => ro.disconnect();
  }, [images]);

  if (!images?.length) return null;

  return (
    <section className="bts" aria-label={dict.projectDetail.btsTitle}>
      <div className="bts-head">
        <h2>{dict.projectDetail.btsTitle}</h2>
        <span className="bts-bar" aria-hidden="true" />
        <small>{String(images.length).padStart(2, '0')}</small>
      </div>
      <div className="bts-viewport" ref={viewport}>
        <motion.div
          ref={track}
          className="bts-track"
          drag={max > 0 ? 'x' : false}
          dragConstraints={{ left: -max, right: 0 }}
          dragElastic={0.08}
          data-cursor-text={max > 0 ? 'DRAG' : undefined}
        >
          {images.map((src, i) => (
            <figure key={src}>
              <img src={sizedSrc(src, 640)} alt={`${dict.projectDetail.btsTitle} ${i + 1}`} loading="lazy" decoding="async" draggable={false} />
              <figcaption>{String(i + 1).padStart(2, '0')}</figcaption>
            </figure>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
