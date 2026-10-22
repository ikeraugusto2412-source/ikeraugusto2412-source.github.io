import React, { useState, useEffect, memo } from 'react';
import { useAnimate } from 'framer-motion';
import './GalleryIntroTransition.css';

/**
 * Fast-cycling preview card matching allintitarvl.framer.website
 * Images are preloaded into the browser cache so cycling is buttery smooth with zero frame flicker.
 */
const CyclingCard = memo(function CyclingCard({ previewImages = [] }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!previewImages || previewImages.length <= 1) return;

    // Eagerly preload preview images into GPU/browser memory
    previewImages.forEach((src) => {
      const img = new Image();
      img.src = src;
    });

    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % previewImages.length);
    }, 130);

    return () => clearInterval(interval);
  }, [previewImages]);

  return (
    <div className="gallery-intro-card">
      <img
        src={previewImages[index]}
        alt=""
        aria-hidden="true"
        className="gallery-intro-card-img"
      />
      <div className="gallery-intro-card-badge">
        <span>PREVIEW</span>
      </div>
    </div>
  );
});

export default function GalleryIntroTransition({
  brand = 'IK®',
  title = 'NEW YORK',
  subtitle = '50 PHOTOGRAPHS · ARCHIVAL SERIES',
  previewImages = [],
  onStartReveal,
  onComplete,
}) {
  const [scope, animate] = useAnimate();
  const [isRendered, setIsRendered] = useState(true);

  useEffect(() => {
    let isCancelled = false;

    async function sequence() {
      if (!scope.current) return;

      const easeLuxury = [0.16, 1, 0.3, 1];
      const easeExit = [0.65, 0, 0.35, 1];

      try {
        // Step 0: Ensure starting states are applied immediately (0ms)
        animate('.gallery-intro-overlay', { opacity: 1 }, { duration: 0 });
        animate('.intro-line-1', { y: '115%', opacity: 0 }, { duration: 0 });
        animate('.intro-line-2', { y: '115%', opacity: 0 }, { duration: 0 });
        animate('.intro-line-3', { y: '115%', opacity: 0 }, { duration: 0 });
        animate('.gallery-intro-card', { y: 50, scale: 0.88, opacity: 0 }, { duration: 0 });

        // Step 1: Crisp masked entrance without any blur
        animate('.intro-line-1', { y: '0%', opacity: 1 }, { duration: 0.55, ease: easeLuxury, delay: 0.04 });
        animate('.intro-line-2', { y: '0%', opacity: 1 }, { duration: 0.62, ease: easeLuxury, delay: 0.12 });
        animate('.intro-line-3', { y: '0%', opacity: 1 }, { duration: 0.55, ease: easeLuxury, delay: 0.2 });
        await animate('.gallery-intro-card', { y: 0, scale: 1, opacity: 1 }, { duration: 0.6, ease: easeLuxury, delay: 0.14 });

        if (isCancelled) return;

        // Step 2: Stable hold (850ms) so user clearly reads title and sees cycling card
        await new Promise((resolve) => setTimeout(resolve, 850));

        if (isCancelled) return;

        // Step 3: Clean masked exit — lines slide UP into the mask and card shrinks
        animate('.intro-line-1', { y: '-115%', opacity: 0 }, { duration: 0.42, ease: easeExit });
        animate('.intro-line-2', { y: '-115%', opacity: 0 }, { duration: 0.42, ease: easeExit, delay: 0.04 });
        animate('.intro-line-3', { y: '-115%', opacity: 0 }, { duration: 0.38, ease: easeExit, delay: 0.08 });
        await animate('.gallery-intro-card', { y: 30, scale: 0.92, opacity: 0 }, { duration: 0.38, ease: easeExit });

        if (isCancelled) return;

        // Step 4: Signal page content (SpiralGallery) to blossom and reveal its header
        if (onStartReveal) onStartReveal();

        // Step 5: Dissolve overlay smoothly to reveal the 3D gallery
        await animate('.gallery-intro-overlay', { opacity: 0 }, { duration: 0.45, ease: [0.22, 1, 0.36, 1] });

        if (isCancelled) return;

        // Step 6: Complete and unmount cleanly from DOM
        setIsRendered(false);
        if (onComplete) onComplete();
      } catch (e) {
        // Fallback safety in case component unmounted
        if (!isCancelled) {
          if (onStartReveal) onStartReveal();
          setIsRendered(false);
          if (onComplete) onComplete();
        }
      }
    }

    sequence();

    return () => {
      isCancelled = true;
    };
  }, [animate, scope, onStartReveal, onComplete]);

  if (!isRendered) return null;

  return (
    <div ref={scope}>
      <div className="gallery-intro-overlay">
        <div className="gallery-intro-bg" />

        <div className="gallery-intro-center">
          <div className="gallery-intro-text-wrap">
            {/* Line 1: Brand Name */}
            <div className="intro-line-mask">
              <div className="intro-line-1">
                <span className="gallery-intro-brand">{brand}</span>
              </div>
            </div>

            {/* Line 2: Project Title */}
            <div className="intro-line-mask">
              <div className="intro-line-2">
                <h2 className="gallery-intro-title">{title}</h2>
              </div>
            </div>

            {/* Line 3: Subtitle */}
            <div className="intro-line-mask">
              <div className="intro-line-3">
                <span className="gallery-intro-subtitle">{subtitle}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom-Right Fast-Cycling Preview Card */}
        {previewImages.length > 0 && (
          <CyclingCard previewImages={previewImages} />
        )}
      </div>
    </div>
  );
}
