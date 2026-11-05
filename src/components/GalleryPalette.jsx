import React from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { playSound } from '../audio/sound';
import './GalleryPalette.css';

/*
 * The gallery's colours (after jacobmckee.com's Colors page), taken from its own photos by
 * scripts/build-palette.mjs. Tapping a colour shows only the photos mostly made of it; tapping
 * it again (or "All") brings the whole gallery back.
 */
export default function GalleryPalette({ palette, tone, onTone }) {
  const { dict } = useLanguage();
  const t = dict.projectDetail;
  if (!palette || palette.colours.length < 2) return null;
  const counts = palette.colours.map((_, i) => Object.values(palette.photos).filter((k) => k === i).length);

  const pick = (i) => {
    playSound('click');
    onTone(tone === i ? null : i);
  };

  return (
    <div className="gallery-palette">
      <div className="gallery-palette-head">
        <span>{t.paletteTitle}</span>
        {tone === null ? (
          <small>{t.paletteHint}</small>
        ) : (
          <button type="button" onClick={() => pick(tone)}>
            {t.paletteAll}
          </button>
        )}
      </div>
      <div className="gallery-palette-strip" role="group" aria-label={t.paletteTitle}>
        {palette.colours.map((c, i) => (
          <motion.button
            key={c}
            type="button"
            className={`gallery-palette-swatch ${tone === i ? 'is-on' : ''} ${tone !== null && tone !== i ? 'is-off' : ''}`}
            style={{ background: c }}
            onClick={() => pick(i)}
            aria-pressed={tone === i}
            aria-label={`${c.toUpperCase()} · ${counts[i]}`}
            whileTap={{ scale: 0.97 }}
          >
            <span>{c.toUpperCase()}</span>
            <small>{String(counts[i]).padStart(2, '0')}</small>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
