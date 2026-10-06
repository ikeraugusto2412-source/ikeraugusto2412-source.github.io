import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import './ImageSequenceHero.css';

const FRAME_COUNT  = 192;
const FIRST_BATCH  = 12;   // frames loaded before animation starts
const BATCH_SIZE   = 18;   // background batch size

const buildPath = (i, ext) => {
  const num = (i + 1).toString().padStart(4, '0');
  return `/assets/frames/frames/frame_${num}.${ext}`;
};

const schedule = window.requestIdleCallback
  ? (fn) => window.requestIdleCallback(fn, { timeout: 400 })
  : (fn) => setTimeout(fn, 32);

export default function ImageSequenceHero() {
  const containerRef      = useRef(null);
  const canvasRef         = useRef(null);
  const bitmapsRef        = useRef(new Array(FRAME_COUNT).fill(null)); // ⑥ ImageBitmap — lighter than HTMLImageElement
  const lastRenderedIndex = useRef(-1);
  const isMounted         = useRef(true);
  const frameExt          = useRef('jpg');

  const [firstBatchCount,  setFirstBatchCount]  = useState(0);
  const [firstBatchLoaded, setFirstBatchLoaded] = useState(false);
  const [isFullyLoaded,    setIsFullyLoaded]    = useState(false);
  const [isTextVisible,    setIsTextVisible]    = useState(false);

  // ── Scroll tracking ──────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const textOpacity    = useTransform(scrollYProgress, [0, 0.25, 0.3, 0.8, 0.85, 1], [0, 0, 1, 1, 0, 0]);
  const progressScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  useMotionValueEvent(textOpacity, 'change', (v) => setIsTextVisible(v > 0.1));

  const renderFrame = useCallback((index) => {
    const canvas = canvasRef.current;
    const bitmap = bitmapsRef.current[index];
    if (!canvas || !bitmap) return;

    const ctx = canvas.getContext('2d');
    const { innerWidth: w, innerHeight: h } = window;
    const dpr = window.devicePixelRatio || 1;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ir = bitmap.width / bitmap.height;
    const cr = w / h;
    let rw, rh, x, y;

    if (cr > ir) {
      rh = canvas.height; rw = bitmap.width * (canvas.height / bitmap.height);
      x = (canvas.width - rw) / 2; y = 0;
    } else {
      rw = canvas.width; rh = bitmap.height * (canvas.width / bitmap.width);
      x = 0; y = (canvas.height - rh) / 2;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(bitmap, x, y, rw, rh);
  }, []);

  // ── ①②③⑤⑥ Progressive loading with WebP detection + tab pause ────────
  useEffect(() => {
    isMounted.current = true;

    // ⑥ Helper: load img → createImageBitmap → store → release raw img memory
    const loadAsBitmap = (i) => new Promise((resolve) => {
      const img = new Image();
      const finish = async () => {
        try {
          if (img.naturalWidth) {
            const bmp = await createImageBitmap(img);
            if (isMounted.current) bitmapsRef.current[i] = bmp;
          }
        } catch (_) {
          // fall through — frame stays null, scroll will skip it
        } finally {
          img.src = '';   // ⑥ release decoded pixel data
          resolve();
        }
      };
      img.onload  = finish;
      img.onerror = () => resolve();
      img.src = buildPath(i, frameExt.current);
    });

    const startLoading = (ext) => {
      frameExt.current = ext;
      let phase1Done = 0;

      // ① Phase 1 — first FIRST_BATCH frames in parallel
      const phase1 = Array.from({ length: FIRST_BATCH }, (_, i) =>
        loadAsBitmap(i).then(() => {
          phase1Done++;
          if (isMounted.current) setFirstBatchCount(phase1Done);
        })
      );

      Promise.all(phase1).then(() => {
        if (!isMounted.current) return;
        setFirstBatchLoaded(true);
        lastRenderedIndex.current = 0;
        requestAnimationFrame(() => renderFrame(0));

        // ① Phase 2 — background batches via requestIdleCallback
        let next = FIRST_BATCH;

        const loadBatch = async () => {
          if (!isMounted.current) return;

          // ⑤ Pause loading when tab is hidden
          if (document.hidden) {
            const resume = () => {
              if (!document.hidden) {
                document.removeEventListener('visibilitychange', resume);
                schedule(loadBatch);
              }
            };
            document.addEventListener('visibilitychange', resume);
            return;
          }

          const end = Math.min(next + BATCH_SIZE, FRAME_COUNT);
          await Promise.all(Array.from({ length: end - next }, (_, j) => loadAsBitmap(next + j)));
          next = end;

          if (next < FRAME_COUNT) {
            schedule(loadBatch);
          }
        };

        schedule(loadBatch);
      });
    };

    // ② WebP detection — probe first frame; fall back to jpg
    const probe = new Image();
    probe.onload  = () => startLoading('webp');
    probe.onerror = () => startLoading('jpg');
    probe.src = buildPath(0, 'webp');

    return () => {
      isMounted.current = false;
      // ⑥ Release all ImageBitmaps on unmount
      bitmapsRef.current.forEach((bmp) => bmp?.close?.());
      bitmapsRef.current = new Array(FRAME_COUNT).fill(null);
    };
  }, [renderFrame]);

  // ── Scroll → frame index ─────────────────────────────────────────────────
  const currentFrameIndex = useTransform(scrollYProgress, [0, 1], [0, FRAME_COUNT - 1]);

  useMotionValueEvent(currentFrameIndex, 'change', (latest) => {
    if (!firstBatchLoaded) return;
    const index = Math.round(latest);
    // Only render if the requested bitmap is ready
    if (bitmapsRef.current[index] && index !== lastRenderedIndex.current) {
      lastRenderedIndex.current = index;
      requestAnimationFrame(() => renderFrame(index)); // ④ rAF for 60fps
    }
  });

  // ── Resize handler ────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => {
      if (firstBatchLoaded) renderFrame(Math.round(currentFrameIndex.get()));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [firstBatchLoaded, currentFrameIndex, renderFrame]);

  // ── Derived values ────────────────────────────────────────────────────────
  // ③ Progress bar fills during Phase 1 only (0→12 frames = 0→100%)
  const loadPct = Math.round((firstBatchCount / FIRST_BATCH) * 100);

  // C — letter stagger animation
  const titleChars = 'IKER AUGUSTO'.split('');
  const subtitleText = 'FOTÓGRAFO & FILMMAKER';

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.045, delayChildren: 0 } },
  };
  const charVariants = {
    hidden:  { y: 24, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
  };

  return (
    <div className="image-sequence-hero" ref={containerRef}>
      <div className="sequence-sticky-container">

        {/* ③ Loader — shows only until Phase 1 is done */}
        {!firstBatchLoaded && (
          <div className="sequence-loader">
            <div className="loader-logo-wrapper">
              <h1 className="loader-logo loader-logo-bg">IK</h1>
              <h1
                className="loader-logo loader-logo-fill"
                style={{ clipPath: `inset(${100 - loadPct}% 0 0 0)` }}
              >
                IK
              </h1>
            </div>
            <p className="loader-text">{loadPct}%</p>
          </div>
        )}

        {/* Canvas */}
        <canvas ref={canvasRef} className="sequence-canvas" />

        {/* B — Scroll progress line */}
        {firstBatchLoaded && (
          <motion.div
            className="sequence-progress-line"
            style={{ scaleX: progressScaleX, transformOrigin: 'left center' }}
          />
        )}

        {/* C — Text overlay with letter-by-letter animation */}
        <motion.div className="sequence-text-overlay" style={{ opacity: textOpacity }}>
          <motion.h1
            className="sequence-title"
            variants={containerVariants}
            initial="hidden"
            animate={isTextVisible ? 'visible' : 'hidden'}
          >
            {titleChars.map((char, i) => (
              <motion.span
                key={i}
                variants={charVariants}
                style={{ display: 'inline-block', whiteSpace: char === ' ' ? 'pre' : 'normal' }}
              >
                {char}
              </motion.span>
            ))}
          </motion.h1>
          <h2 className="sequence-subtitle">{subtitleText}</h2>
        </motion.div>

      </div>
    </div>
  );
}
