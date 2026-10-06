import React, { useState, useRef } from 'react';
import './XRaySpotlightDemo.css';

export default function XRaySpotlightDemo() {
  const containerRef = useRef(null);
  const [spotPos, setSpotPos] = useState({ x: 260, y: 220, isHovering: false });
  const [scanMode, setScanMode] = useState('blueprint'); // 'blueprint' | 'thermal'

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setSpotPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      isHovering: true,
    });
  };

  const handleMouseLeave = () => {
    setSpotPos((prev) => ({ ...prev, isHovering: false }));
  };

  return (
    <div className="xray-demo-card">
      <div className="xray-demo-header">
        <div className="xray-title-wrap">
          <div className="deck-tag-row">
            <span className="demo-badge new-idea-badge">NUEVA IDEA 02</span>
            <span className="demo-badge tech-badge">ESCANEO DE DIRECCIÓN</span>
          </div>
          <h3 className="demo-module-title">Linterna de Composición & Escáner X-Ray</h3>
          <p className="demo-module-desc">
            Pasa la linterna por la escena: el haz de luz revela el plano técnico interno del director de fotografía (rejilla de composición de tercios, vectores de acción y telemetría de rodaje).
          </p>
        </div>

        <div className="xray-controls-bar">
          <button
            type="button"
            className={`xray-btn ${scanMode === 'blueprint' ? 'active' : ''}`}
            onClick={() => setScanMode('blueprint')}
          >
            📐 Blueprint & Composición
          </button>
          <button
            type="button"
            className={`xray-btn ${scanMode === 'thermal' ? 'active' : ''}`}
            onClick={() => setScanMode('thermal')}
          >
            🔥 Mapa Térmico / Falso Color
          </button>
        </div>
      </div>

      {/* Main Photographic Stage */}
      <div
        ref={containerRef}
        className="xray-viewport"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Layer 1: Final Finished Photograph (Background) */}
        <img
          src="/assets/salomon/webp/portada.webp"
          alt="Salomon snow action"
          className="xray-base-img"
        />

        {/* Layer 2: Technical Blueprint / X-Ray Mode (Clipped to cursor spotlight circle) */}
        <div
          className={`xray-scanner-layer ${scanMode === 'thermal' ? 'mode-thermal' : 'mode-blueprint'}`}
          style={{
            clipPath: spotPos.isHovering
              ? `circle(120px at ${spotPos.x}px ${spotPos.y}px)`
              : 'circle(0px at 50% 50%)',
          }}
        >
          {/* Inner Image transformed */}
          <img
            src="/assets/salomon/webp/portada.webp"
            alt="Salomon technical wireframe"
            className="xray-transformed-img"
          />

          {/* Blueprint Vector Grid */}
          <div className="blueprint-grid-overlay">
            {/* Rule of Thirds lines */}
            <div className="rule-thirds-h1" />
            <div className="rule-thirds-h2" />
            <div className="rule-thirds-v1" />
            <div className="rule-thirds-v2" />

            {/* Target Crosshairs */}
            <div className="target-reticle" style={{ left: `${spotPos.x}px`, top: `${spotPos.y}px` }}>
              <span className="reticle-box" />
              <span className="reticle-text">TARGET LOCK · 99.4%</span>
            </div>
          </div>
        </div>

        {/* Spotlight Ring Graphic Follower */}
        {spotPos.isHovering && (
          <div
            className="spotlight-ring-follower"
            style={{
              left: `${spotPos.x}px`,
              top: `${spotPos.y}px`,
            }}
          >
            <div className="spotlight-lens-border" />
          </div>
        )}

        {/* Live HUD Telemetry Overlay */}
        <div className="xray-live-hud">
          <div className="hud-line">
            <span className="hud-label">SISTEMA</span>
            <span className="hud-val">DIRECTOR SCAN V2</span>
          </div>
          <div className="hud-line">
            <span className="hud-label">ENFOQUE</span>
            <span className="hud-val">HYPERFOCAL TRACKING</span>
          </div>
          <div className="hud-line">
            <span className="hud-label">COBERTURA</span>
            <span className="hud-val">FULL FRAME 4K RAW</span>
          </div>
        </div>
      </div>

      <div className="xray-footer-note">
        <span>💡 <em>Impacto:</em> Demuestra a marcas comerciales cómo calculas las líneas de fuga, la tensión compositiva y el encuadre con rigor técnico y creativo.</span>
      </div>
    </div>
  );
}
