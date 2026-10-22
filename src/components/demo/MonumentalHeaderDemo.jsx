import React, { useState, useRef } from 'react';
import { soundFx } from '../../utils/analogSound';
import './MonumentalHeaderDemo.css';

const MASK_WORDS = ['IKER AUGUSTO', 'CINEMATOGRAPHY', 'NORWAY 4K', 'SALOMON ACTION'];

export default function MonumentalHeaderDemo() {
  const [activeWordIdx, setActiveWordIdx] = useState(0);
  const [isInverted, setIsInverted] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: x * 15, y: -y * 15 });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const cycleWord = () => {
    setActiveWordIdx((prev) => (prev + 1) % MASK_WORDS.length);
    soundFx.playFilmAdvance();
  };

  const toggleInverted = () => {
    setIsInverted(!isInverted);
    soundFx.playTactileClick();
  };

  return (
    <div className="monumental-demo-card">
      <div className="monumental-demo-header">
        <div className="monumental-title-wrap">
          <span className="demo-badge">MODO LAB 04</span>
          <h3 className="demo-module-title">Cabecera Monumental con Máscara de Vídeo</h3>
          <p className="demo-module-desc">
            Tipografía mastodóntica con recorte dinámico (SVG / CSS clip-mask) donde el vídeo en 4K se proyecta directamente dentro de la geometría de los caracteres con perspectiva 3D interactiva.
          </p>
        </div>

        {/* Controls */}
        <div className="monumental-controls-bar">
          <button
            type="button"
            className="monumental-btn"
            onClick={cycleWord}
            title="Cambiar texto"
          >
            Cambiar Titular: <strong>{MASK_WORDS[activeWordIdx]}</strong>
          </button>

          <button
            type="button"
            className={`monumental-btn ${isInverted ? 'active' : ''}`}
            onClick={toggleInverted}
          >
            {isInverted ? 'Modo: Vídeo Fondo' : 'Modo: Vídeo en Letras'}
          </button>
        </div>
      </div>

      {/* 3D Perspective Canvas Container */}
      <div
        ref={containerRef}
        className={`monumental-stage ${isInverted ? 'mode-inverted' : 'mode-masked'}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className="monumental-inner-3d"
          style={{
            transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          }}
        >
          {/* Looping Ambient Video Background */}
          <video
            src="/assets/Noruega/Video/norway-1080p.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="monumental-video"
          />

          {/* Masked Typography Overlay */}
          <div className="monumental-typography-layer">
            <h1 className="monumental-word">{MASK_WORDS[activeWordIdx]}</h1>
          </div>

          <div className="monumental-cinematic-corners">
            <span className="corner top-left">REC ● [4K 60FPS]</span>
            <span className="corner top-right">ISO 800 · LOG-C</span>
            <span className="corner bottom-left">2.39:1 ANAMORPHIC</span>
            <span className="corner bottom-right">IK® DIRECTORS CUT</span>
          </div>
        </div>
      </div>

      <div className="monumental-footer-note">
        <span>💡 <em>Impacto en cabecera:</em> Mueve el ratón para experimentar el giro de perspectiva 3D giroscópico sobre la masa tipográfica.</span>
      </div>
    </div>
  );
}
