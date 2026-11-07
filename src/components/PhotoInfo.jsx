import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import photoInfo from '../data/photoInfo.json';
import palettes from '../data/palettes.json';
import './PhotoInfo.css';

/*
 * Per-photo sheet in the full-screen viewer (after mamuso.dev): camera, lens, exposure, focal
 * length, date, place and the gallery palette with this photo's main colour marked. The «i»
 * button (or the I key) shows and hides it; it stays open while moving between photos.
 * Camera data comes from the originals (scripts/build-photo-info.mjs).
 */
export default function PhotoInfo({ src, project, open, onToggle }) {
  const { dict, language } = useLanguage();
  const t = dict.projectDetail.photoInfo;
  const info = photoInfo[src];
  const palette = palettes[project.id];
  const tone = palette?.photos[src];

  useEffect(() => {
    const onKey = (e) => {
      if (e.key.toLowerCase() === 'i' && !e.metaKey && !e.ctrlKey) onToggle();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onToggle]);

  if (!info) return null;
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const exposure = [info.f && `ƒ/${info.f}`, info.shutter, info.iso && `ISO ${info.iso}`].filter(Boolean).join(' · ');
  const rows = [
    [t.camera, info.camera],
    [t.lens, info.lens],
    [t.exposure, exposure],
    [t.focal, info.focal && `${Math.round(info.focal * 10) / 10} mm`],
    [t.date, info.date && new Date(`${info.date}T12:00:00`).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })],
    [t.place, project.location],
  ].filter(([, v]) => v);

  return (
    <>
      <button
        type="button"
        className={`photo-info-toggle ${open ? 'is-on' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-pressed={open}
        aria-label={t.toggle}
        title={`${t.toggle} (I)`}
      >
        i
      </button>
      <AnimatePresence>
        {open && (
          <motion.aside
            className="photo-info"
            aria-label={t.toggle}
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="photo-info-head">
              <span>{project.title}</span>
              <span>{t.toggle}</span>
            </div>
            <dl>
              {rows.map(([k, v]) => (
                <React.Fragment key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </React.Fragment>
              ))}
              {palette && (
                <>
                  <dt>{t.palette}</dt>
                  <dd className="photo-info-palette">
                    {palette.colours.map((c, i) => (
                      <i key={c} style={{ background: c }} className={i === tone ? 'is-main' : ''} title={c.toUpperCase()} />
                    ))}
                  </dd>
                </>
              )}
            </dl>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  );
}
