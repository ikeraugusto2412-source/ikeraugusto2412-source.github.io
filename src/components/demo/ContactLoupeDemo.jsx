import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundFx } from '../../utils/analogSound';
import './ContactLoupeDemo.css';

const SAMPLE_PHOTOS = [
  {
    id: 1,
    url: '/assets/london/webp/_6M25608.webp',
    title: 'London Underground Reflection',
    camera: 'LEICA M6 TTL',
    lens: 'SUMMICRON-M 35mm ƒ/2 ASPH',
    exposure: '1/500s · ƒ/2.8 · ISO 400',
    stock: 'KODAK PORTRA 400',
    location: 'Piccadilly Circus, London',
  },
  {
    id: 2,
    url: '/assets/london/webp/_6M24845.webp',
    title: 'Rain & Red Bus Motion',
    camera: 'LEICA M6 TTL',
    lens: 'NOCTILUX 50mm ƒ/0.95',
    exposure: '1/250s · ƒ/1.4 · ISO 800',
    stock: 'ILFORD HP5 PLUS 400',
    location: 'Westminster, London',
  },
  {
    id: 3,
    url: '/assets/salomon/webp/portada.webp',
    title: 'Salomon Huck Knife Freestyle',
    camera: 'SONY FX3 CINEMA',
    lens: 'FE 24-70mm ƒ/2.8 GM II',
    exposure: '1/2000s · ƒ/4.0 · ISO 160',
    stock: 'S-LOG3 / CINE EI',
    location: 'Laax Snowpark, Switzerland',
  }
];

export default function ContactLoupeDemo() {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(2.5);
  const [isNegative, setIsNegative] = useState(false);
  const [showExif, setShowExif] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0, percentX: 50, percentY: 50 });

  const containerRef = useRef(null);
  const currentPhoto = SAMPLE_PHOTOS[activePhotoIdx];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const clampedX = Math.max(0, Math.min(rect.width, x));
    const clampedY = Math.max(0, Math.min(rect.height, y));

    setMousePos({
      x: clampedX,
      y: clampedY,
      percentX: (clampedX / rect.width) * 100,
      percentY: (clampedY / rect.height) * 100,
      width: rect.width,
      height: rect.height,
    });
  };

  const handleMouseEnter = () => {
    setIsHovering(true);
    soundFx.playFilmAdvance();
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
  };

  const handlePhotoClick = () => {
    soundFx.playShutter();
  };

  const toggleNegative = () => {
    setIsNegative(!isNegative);
    soundFx.playTactileClick();
  };

  const cycleZoom = () => {
    const nextZoom = zoomLevel === 2 ? 3 : zoomLevel === 3 ? 4 : 2;
    setZoomLevel(nextZoom);
    soundFx.playTactileClick();
  };

  return (
    <div className="loupe-demo-card">
      <div className="loupe-demo-header">
        <div className="loupe-title-wrap">
          <span className="demo-badge">MODO LAB 01</span>
          <h3 className="demo-module-title">Lupa de Contacto 35mm & Inspector EXIF</h3>
          <p className="demo-module-desc">
            Pasa el ratón sobre la imagen para revelar el grano analógico ampliado, retícula óptica milimétrica y telemetría de disparo en tiempo real.
          </p>
        </div>

        {/* Action Controls Bar */}
        <div className="loupe-controls-bar">
          {/* Photo Switcher */}
          <div className="loupe-btn-group">
            {SAMPLE_PHOTOS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`loupe-btn ${activePhotoIdx === idx ? 'active' : ''}`}
                onClick={() => {
                  setActivePhotoIdx(idx);
                  soundFx.playFilmAdvance();
                }}
              >
                Foto 0{idx + 1}
              </button>
            ))}
          </div>

          {/* Zoom Selector */}
          <button
            type="button"
            className="loupe-btn"
            onClick={cycleZoom}
            title="Cambiar aumento de lente"
          >
            Aumento: <strong>{zoomLevel}×</strong>
          </button>

          {/* Negative Celluloid Toggle */}
          <button
            type="button"
            className={`loupe-btn ${isNegative ? 'active' : ''}`}
            onClick={toggleNegative}
            title="Invertir película a negativo 35mm"
          >
            {isNegative ? '🎞 Negativo ON' : '📷 Positivo'}
          </button>

          {/* EXIF Toggle */}
          <button
            type="button"
            className={`loupe-btn ${showExif ? 'active' : ''}`}
            onClick={() => {
              setShowExif(!showExif);
              soundFx.playTactileClick();
            }}
          >
            EXIF HUD: {showExif ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Photographic Frame */}
      <div
        ref={containerRef}
        className={`loupe-viewport ${isNegative ? 'celluloid-negative' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handlePhotoClick}
      >
        <img
          src={currentPhoto.url}
          alt={currentPhoto.title}
          className="loupe-base-img"
          loading="lazy"
        />

        {/* 35mm Sprocket Holes Border Effect */}
        <div className="film-sprocket-top" />
        <div className="film-sprocket-bottom" />

        {/* Live Hover Loupe Glass */}
        {isHovering && (
          <div
            className="loupe-glass"
            style={{
              transform: `translate(${mousePos.x}px, ${mousePos.y}px) translate(-50%, -50%)`,
            }}
          >
            {/* Magnified Optical Viewport */}
            <div
              className="loupe-magnified-content"
              style={{
                backgroundImage: `url(${currentPhoto.url})`,
                backgroundSize: `${mousePos.width * zoomLevel}px ${mousePos.height * zoomLevel}px`,
                backgroundPosition: `-${mousePos.x * zoomLevel - 100}px -${mousePos.y * zoomLevel - 100}px`,
                filter: isNegative ? 'invert(0.95) hue-rotate(180deg)' : 'none',
              }}
            />

            {/* Precision Optical Reticle */}
            <div className="loupe-reticle">
              <span className="reticle-cross-h" />
              <span className="reticle-cross-v" />
              <span className="reticle-circle" />
              <span className="reticle-zoom-tag">{zoomLevel}× OPTICAL</span>
            </div>

            {/* Realistic Lens Bezel & Chromatic Aberration */}
            <div className="loupe-bezel" />
          </div>
        )}

        {/* EXIF Telemetry HUD Overlay */}
        <AnimatePresence>
          {showExif && (
            <motion.div
              className="loupe-exif-hud"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <div className="exif-row">
                <span className="exif-label">CAM</span>
                <span className="exif-val">{currentPhoto.camera}</span>
              </div>
              <div className="exif-row">
                <span className="exif-label">OPT</span>
                <span className="exif-val">{currentPhoto.lens}</span>
              </div>
              <div className="exif-row">
                <span className="exif-label">EXP</span>
                <span className="exif-val">{currentPhoto.exposure}</span>
              </div>
              <div className="exif-row highlight">
                <span className="exif-label">EMU</span>
                <span className="exif-val">{currentPhoto.stock}</span>
              </div>
              <div className="exif-footer">
                <span className="exif-loc">📍 {currentPhoto.location}</span>
                <span className="exif-hint">Clic para obturar 📸</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="loupe-footer-note">
        <span>💡 <em>Sensación analógica:</em> Haz clic sobre la foto para simular el sonido de disparo mecánico de obturador Leica.</span>
      </div>
    </div>
  );
}
