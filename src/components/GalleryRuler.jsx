import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './GalleryRuler.css';

/*
 * Gallery ruler (inspired by the scrubber on animejs.com): a slim bar pinned to the bottom of
 * the screen while a project's gallery is in view. One tick per photo, a counter ("12 / 50")
 * and a needle that follows the photo in the middle of the screen. Tap anywhere on the ruler
 * to jump to that photo, or drag the needle (Anime.js Draggable) to scrub through the series.
 *
 * Photos are found by their data-photo index inside `galleryRef`.
 */
const scrollToPhoto = (el, immediate) => {
  // Centre the photo on screen (via Lenis, see App.jsx)
  const offset = -(window.innerHeight - Math.min(el.offsetHeight, window.innerHeight)) / 2;
  window.dispatchEvent(new CustomEvent('scrollrequest', { detail: { target: el, offset, immediate } }));
};

export default function GalleryRuler({ count, galleryRef, hidden = false }) {
  const { dict } = useLanguage();
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState(0);
  const trackRef = useRef(null);
  const needleRef = useRef(null);
  const draggableRef = useRef(null);
  const dragging = useRef(false);
  const activeRef = useRef(0);

  const photoEl = (i) => galleryRef.current?.querySelector(`[data-photo="${i}"]`);

  // Show the ruler only while the gallery is on screen
  useEffect(() => {
    const gallery = galleryRef.current;
    if (!gallery) return undefined;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: '-35% 0px -35% 0px',
    });
    io.observe(gallery);
    return () => io.disconnect();
  }, [galleryRef]);

  // Follow the photo closest to the middle of the screen
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const gallery = galleryRef.current;
      if (!gallery || dragging.current) return;
      const mid = window.innerHeight / 2;
      let best = activeRef.current;
      let bestDist = Infinity;
      gallery.querySelectorAll('[data-photo]').forEach((el) => {
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.top + r.height / 2 - mid);
        if (d < bestDist) {
          bestDist = d;
          best = Number(el.dataset.photo);
        }
      });
      if (best !== activeRef.current) {
        activeRef.current = best;
        setActive(best);
      }
      // Needle glides with the scroll (no snapping while reading)
      if (draggableRef.current && count > 1) draggableRef.current.progressX = best / (count - 1);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [galleryRef, count]);

  // Draggable needle (Anime.js): scrubbing jumps straight to the photo under it
  useEffect(() => {
    const needle = needleRef.current;
    const track = trackRef.current;
    if (!needle || !track || count < 2) return undefined;
    let cancelled = false;
    let draggable = null;

    import('animejs').then(({ createDraggable }) => {
      if (cancelled) return;
      const indexAt = (self) => Math.round(self.progressX * (count - 1));
      draggable = createDraggable(needle, {
        container: track,
        y: false,
        snap: () => (track.clientWidth - needle.offsetWidth) / (count - 1),
        releaseStiffness: 260,
        cursor: { onHover: 'grab', onGrab: 'grabbing' },
        onGrab: () => {
          dragging.current = true;
        },
        onDrag: (self) => {
          const i = indexAt(self);
          if (i !== activeRef.current) {
            activeRef.current = i;
            setActive(i);
            const el = photoEl(i);
            if (el) scrollToPhoto(el, true);
          }
        },
        onSettle: () => {
          dragging.current = false;
        },
      });
      draggable.progressX = activeRef.current / (count - 1);
      draggableRef.current = draggable;
    });

    return () => {
      cancelled = true;
      draggable?.revert();
      draggableRef.current = null;
    };
    // photoEl only reads galleryRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count]);

  // Tap on the ruler: jump to the photo under the finger
  const handleTrackClick = (e) => {
    if (e.target === needleRef.current || count < 1) return;
    const r = trackRef.current.getBoundingClientRect();
    const i = Math.round(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * (count - 1));
    const el = photoEl(i);
    if (el) scrollToPhoto(el, false);
  };

  const label = dict.projectDetail.rulerLabel;

  return (
    <nav
      className={`gallery-ruler ${visible && !hidden ? 'is-visible' : ''}`}
      aria-label={label}
      aria-hidden={!visible || hidden}
    >
      <span className="gallery-ruler-count" aria-live="polite">
        <strong>{String(active + 1).padStart(2, '0')}</strong>
        <span className="gallery-ruler-sep">/</span>
        {String(count).padStart(2, '0')}
      </span>
      <div ref={trackRef} className="gallery-ruler-track" onClick={handleTrackClick} data-sound="none">
        {Array.from({ length: count }, (_, i) => (
          <span key={i} className={`gallery-ruler-tick ${i <= active ? 'is-past' : ''} ${i % 5 === 0 ? 'is-major' : ''}`} />
        ))}
        <button
          ref={needleRef}
          type="button"
          className="gallery-ruler-needle"
          aria-label={`${dict.projectDetail.photo} ${active + 1} / ${count}`}
          tabIndex={visible && !hidden ? 0 : -1}
          data-sound="none"
          onKeyDown={(e) => {
            const dir = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
            if (!dir) return;
            e.preventDefault();
            const i = Math.min(count - 1, Math.max(0, activeRef.current + dir));
            const el = photoEl(i);
            if (el) scrollToPhoto(el, false);
          }}
        />
      </div>
    </nav>
  );
}
