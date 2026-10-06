import React, { useState, useRef } from 'react';
import './SpatialHoloCardDemo.css';

export default function SpatialHoloCardDemo() {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ x: 50, y: 50, opacity: 0 });
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * 18;
    const rotY = ((x - centerX) / centerX) * 18;

    setRotate({ x: rotX, y: rotY });
    setGlare({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100,
      opacity: 0.8,
    });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlare((prev) => ({ ...prev, opacity: 0 }));
  };

  return (
    <div className="holo-demo-card">
      <div className="holo-demo-header">
        <div className="holo-title-wrap">
          <div className="portal-tag-row">
            <span className="demo-badge modern-badge">VANGUARDIA DIGITAL 03</span>
            <span className="demo-badge spatial-badge">SPATIAL 3D DEPTH</span>
          </div>
          <h3 className="demo-module-title">Tarjeta 3D Holo-Especular & Profundidad Espacial</h3>
          <p className="demo-module-desc">
            Inspirada en interfaces espaciales de lujo y coleccionismo gráfico. Mueve el ratón para rotar la tarjeta en el espacio tridimensional y revelar el brillo holográfico tornasolado y capas Z flotantes.
          </p>
        </div>
      </div>

      {/* 3D Perspective Stage */}
      <div className="holo-stage-wrapper">
        <div
          ref={cardRef}
          className="holo-card-container"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{
            transform: `perspective(1000px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          }}
        >
          {/* Layer 1: Background Landscape */}
          <div className="holo-card-bg">
            <img
              src="/assets/Noruega/webp/_6M25100.webp"
              alt="Spatial card artwork"
              className="holo-bg-img"
            />
          </div>

          {/* Layer 2: Iridescent Holographic Foil Sheen */}
          <div
            className="holo-foil-sheen"
            style={{
              opacity: glare.opacity,
              background: `radial-gradient(circle at ${glare.x}% ${glare.y}%, rgba(255, 255, 255, 0.8) 0%, rgba(255, 0, 128, 0.4) 25%, rgba(0, 229, 255, 0.4) 50%, rgba(255, 215, 0, 0.3) 75%, transparent 100%)`,
            }}
          />

          {/* Layer 3: Glass Prismatic Reflection */}
          <div
            className="holo-glass-glare"
            style={{
              opacity: glare.opacity,
              background: `linear-gradient(${rotate.y * 5 + 135}deg, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            }}
          />

          {/* Layer 4: Floating 3D Foreground Elements (translateZ) */}
          <div className="holo-foreground-3d">
            <div className="holo-top-row">
              <span className="holo-brand-badge">IK® AVANT-GARDE</span>
              <span className="holo-edition-tag">SPECIAL ARCHIVE EDITION</span>
            </div>

            <div className="holo-center-content">
              <h2 className="holo-hero-title">NORWAY<br />EXPEDITIONS</h2>
              <span className="holo-sub-tag">DIRECTOR OF PHOTOGRAPHY · 2026</span>
            </div>

            <div className="holo-bottom-row">
              <div className="holo-meta-col">
                <span className="holo-label">FORMAT</span>
                <span className="holo-val">4K RAW / MASTER ANAMORPHIC</span>
              </div>
              <div className="holo-meta-col right">
                <span className="holo-label">AUTHOR</span>
                <span className="holo-val">IKER AUGUSTO</span>
              </div>
            </div>
          </div>

          {/* Outer Glass Bevel Border */}
          <div className="holo-outer-bevel" />
        </div>
      </div>

      <div className="holo-footer-note">
        <span>💡 <em>Efecto visual:</em> La tipografía y los sellos flotan 50 píxeles por delante de la fotografía, creando una sensación de volumen y tacto espacial asombrosa.</span>
      </div>
    </div>
  );
}
