import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import usePrefersReducedMotion from '../hooks/usePrefersReducedMotion';
import './GradeCompare.css';

/*
 * Colour grade before / after on moving footage.
 * Each shot is ONE video with the flat camera file (C-Log) on top and the graded version
 * below, so both halves are always on the same frame. A canvas draws the graded half and,
 * over it, the log half clipped to the left of a divider the visitor drags. Until someone
 * touches it, the divider sweeps slowly from side to side.
 *
 *   shots: [{ src: '/…/clip.mp4', poster: '/…/clip.webp', label: { en, es } }]
 */
const SWEEP_S = 7; // one full left → right → left sweep

export default function GradeCompare({ shots }) {
  const { dict, language } = useLanguage();
  const t = dict.projectDetail.grade;
  const reduceMotion = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [split, setSplit] = useState(0.5);
  const [touched, setTouched] = useState(false);
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const posterRef = useRef(null);
  const splitRef = useRef(0.5);
  const draggingRef = useRef(false);
  const playingRef = useRef(false); // the video has shown a frame; until then draw the poster

  const shot = shots?.[index];

  // Draw the current frame (video, or the poster until the video has data)
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const source = video && playingRef.current && video.readyState >= 2 ? video : posterRef.current;
    if (!source || (source === posterRef.current && !source.complete)) return;
    const sw = source.videoWidth || source.naturalWidth;
    const sh = (source.videoHeight || source.naturalHeight) / 2; // each half
    if (!sw || !sh) return;
    const { width: W, height: H } = canvas;
    const x = Math.round(W * splitRef.current);
    // graded (bottom half of the file) everywhere
    ctx.drawImage(source, 0, sh, sw, sh, 0, 0, W, H);
    // log (top half) on the left of the divider
    if (x > 0) ctx.drawImage(source, 0, 0, (sw * x) / W, sh, 0, 0, x, H);
  }, []);

  // Canvas size follows the element (sharp on retina, capped to the file's resolution)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const resize = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.min(1920, Math.round(r.width * dpr));
      canvas.height = Math.round((canvas.width * 9) / 16);
      draw();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    return () => ro.disconnect();
  }, [draw]);

  // Render loop: every video frame (or every animation frame while sweeping)
  useEffect(() => {
    let raf = 0;
    // start a quarter of the way in, so the sweep begins from the centre
    const start = performance.now() - (SWEEP_S * 1000) / 4;
    const loop = (now) => {
      if (!touched && !reduceMotion && !draggingRef.current) {
        const p = ((now - start) / 1000 / SWEEP_S) % 1;
        splitRef.current = 0.5 + 0.38 * Math.cos(p * Math.PI * 2); // 0.12 ↔ 0.88
      }
      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [draw, touched, reduceMotion]);

  // Play only while on screen
  useEffect(() => {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return undefined;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) video.play().catch(() => {});
      else video.pause();
    }, { threshold: 0.25 });
    io.observe(wrap);
    return () => io.disconnect();
  }, [index]);

  const moveTo = (clientX) => {
    const r = canvasRef.current.getBoundingClientRect();
    const s = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    splitRef.current = s;
    setSplit(s);
  };

  const onPointerDown = (e) => {
    draggingRef.current = true;
    setTouched(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
    moveTo(e.clientX);
  };
  const onPointerMove = (e) => {
    if (draggingRef.current) moveTo(e.clientX);
  };
  const onPointerUp = () => {
    draggingRef.current = false;
  };
  const onKeyDown = (e) => {
    const step = e.shiftKey ? 0.1 : 0.03;
    let s = splitRef.current;
    if (e.key === 'ArrowLeft') s -= step;
    else if (e.key === 'ArrowRight') s += step;
    else if (e.key === 'Home') s = 0;
    else if (e.key === 'End') s = 1;
    else return;
    e.preventDefault();
    setTouched(true);
    s = Math.min(1, Math.max(0, s));
    splitRef.current = s;
    setSplit(s);
  };

  // Keep the divider handle in sync with the sweep (state only updates on interaction)
  const handleRef = useRef(null);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (handleRef.current) handleRef.current.style.left = `${splitRef.current * 100}%`;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!shots?.length) return null;

  return (
    <section className="grade-compare" aria-labelledby="grade-compare-title">
      <header className="grade-compare-head">
        <span className="grade-compare-tag">{t.tag}</span>
        <h2 id="grade-compare-title">{t.title}</h2>
        <p>{t.desc}</p>
      </header>

      <div ref={wrapRef} className="grade-compare-frame">
        <canvas
          ref={canvasRef}
          className="grade-compare-canvas"
          role="slider"
          tabIndex={0}
          aria-label={t.sliderLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(split * 100)}
          aria-valuetext={`${Math.round(split * 100)}% ${t.before}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={onKeyDown}
          data-sound="none"
        />
        <span ref={handleRef} className="grade-compare-handle" aria-hidden="true">
          <span className="grade-compare-knob">
            <svg viewBox="0 0 24 24" width="16" height="16"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
          </span>
        </span>
        <span className="grade-compare-label grade-compare-label--before" aria-hidden="true">{t.before}</span>
        <span className="grade-compare-label grade-compare-label--after" aria-hidden="true">{t.after}</span>
        {!touched && <span className="grade-compare-hint" aria-hidden="true">{t.hint}</span>}

        {/* Source frames for the canvas (not shown) */}
        <video
          key={shot.src}
          ref={videoRef}
          className="grade-compare-source"
          src={shot.src}
          muted
          loop
          playsInline
          preload="metadata"
          onLoadStart={() => { playingRef.current = false; }}
          onPlaying={() => { playingRef.current = true; }}
          aria-hidden="true"
          tabIndex={-1}
        />
        <img key={shot.poster} ref={posterRef} className="grade-compare-source" src={shot.poster} alt="" onLoad={draw} />
      </div>

      {shots.length > 1 && (
        <div className="grade-compare-shots" role="group" aria-label={t.shots}>
          {shots.map((s, i) => (
            <button
              key={s.src}
              type="button"
              className={i === index ? 'is-active' : ''}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
            >
              <span className="grade-compare-num">{String(i + 1).padStart(2, '0')}</span>
              {s.label?.[language] ?? s.label?.en}
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
