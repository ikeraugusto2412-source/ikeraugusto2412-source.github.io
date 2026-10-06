import React, { useState, useRef, useEffect } from 'react';
import { soundFx } from '../../utils/analogSound';
import './AnamorphicFlareDemo.css';

const FLARE_STYLES = [
  {
    id: 'blue',
    name: 'Anamórfico Azul Clásico',
    subtitle: 'Arri / Master Anamorphic 2x',
    coreColor: 'rgba(0, 180, 255, 0.9)',
    streakColor: 'linear-gradient(90deg, transparent 0%, rgba(0, 140, 255, 0.2) 20%, rgba(120, 220, 255, 0.95) 50%, rgba(0, 140, 255, 0.2) 80%, transparent 100%)',
    leakGlow: 'radial-gradient(circle, rgba(0, 120, 255, 0.35) 0%, transparent 65%)',
  },
  {
    id: 'amber',
    name: 'Fuga de Luz Ámbar Vintage',
    subtitle: 'Cooke Vintage 1970s Warmth',
    coreColor: 'rgba(255, 140, 0, 0.95)',
    streakColor: 'linear-gradient(90deg, transparent 0%, rgba(255, 100, 0, 0.2) 25%, rgba(255, 220, 120, 0.95) 50%, rgba(255, 100, 0, 0.2) 75%, transparent 100%)',
    leakGlow: 'radial-gradient(circle, rgba(255, 120, 30, 0.4) 0%, transparent 60%)',
  },
  {
    id: 'prism',
    name: 'Dispersión Prismática Arcoíris',
    subtitle: 'Aberración Cromática de Cristal Óptico',
    coreColor: 'rgba(255, 255, 255, 0.95)',
    streakColor: 'linear-gradient(90deg, transparent 0%, rgba(255, 0, 128, 0.4) 20%, rgba(0, 255, 255, 0.8) 50%, rgba(255, 255, 0, 0.4) 80%, transparent 100%)',
    leakGlow: 'radial-gradient(circle, rgba(255, 0, 200, 0.25) 0%, rgba(0, 255, 200, 0.2) 40%, transparent 70%)',
  }
];

export default function AnamorphicFlareDemo() {
  const [activeStyleIdx, setActiveStyleIdx] = useState(0);
  const [lightPos, setLightPos] = useState({ x: 320, y: 180, pctX: 45, pctY: 35 });
  const [isAutoDrifting, setIsAutoDrifting] = useState(true);
  const [streakIntensity, setStreakIntensity] = useState(1);

  const containerRef = useRef(null);
  const animRef = useRef(null);
  const currentStyle = FLARE_STYLES[activeStyleIdx];

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    setIsAutoDrifting(false);
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setLightPos({
      x,
      y,
      pctX: (x / rect.width) * 100,
      pctY: (y / rect.height) * 100,
    });
  };

  // Auto-drifting cinematographic sun flare
  useEffect(() => {
    if (!isAutoDrifting) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let start = performance.now();
    const drift = (time) => {
      const elapsed = (time - start) / 1000;
      const x = 50 + Math.cos(elapsed * 0.8) * 35;
      const y = 35 + Math.sin(elapsed * 1.2) * 20;
      setLightPos({
        x: 0,
        y: 0,
        pctX: x,
        pctY: y,
      });
      animRef.current = requestAnimationFrame(drift);
    };

    animRef.current = requestAnimationFrame(drift);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAutoDrifting]);

  const selectStyle = (idx) => {
    setActiveStyleIdx(idx);
    soundFx.playTactileClick();
  };

  const toggleAuto = () => {
    setIsAutoDrifting(!isAutoDrifting);
    soundFx.playTactileClick();
  };

  return (
    <div className="flare-demo-card">
      <div className="flare-demo-header">
        <div className="flare-title-wrap">
          <span className="demo-badge new-badge">NUEVA IDEA 04</span>
          <h3 className="demo-module-title">Destellos Anamórficos Cinemáticos & Fugas de Luz</h3>
          <p className="demo-module-desc">
            Mueve el ratón para guiar una fuente de luz interactiva. El motor óptico calcula la línea de destello horizontal anamórfico (*horizontal streak*) y la dispersión espectral característica del cine de gran formato.
          </p>
        </div>

        {/* Style Selector */}
        <div className="flare-controls-bar">
          <div className="flare-btn-group">
            {FLARE_STYLES.map((style, idx) => (
              <button
                key={style.id}
                type="button"
                className={`flare-btn ${activeStyleIdx === idx ? 'active' : ''}`}
                onClick={() => selectStyle(idx)}
              >
                {style.name.split(' ')[0]} {style.name.split(' ')[1]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`flare-btn ${isAutoDrifting ? 'active' : ''}`}
            onClick={toggleAuto}
          >
            {isAutoDrifting ? '⏸ Pausar Órbita' : '▶ Órbita Solar Auto'}
          </button>
        </div>
      </div>

      {/* Main Photographic Flare Canvas */}
      <div
        ref={containerRef}
        className="flare-viewport"
        onMouseMove={handleMouseMove}
      >
        <img
          src="/assets/Noruega/webp/_6M25407.webp"
          alt="Norway landscape anamorphic"
          className="flare-base-img"
        />

        {/* Anamorphic Horizontal Streak Line */}
        <div
          className="flare-streak-line"
          style={{
            top: `${lightPos.pctY}%`,
            background: currentStyle.streakColor,
            opacity: streakIntensity,
          }}
        />

        {/* Flare Point Core */}
        <div
          className="flare-core-dot"
          style={{
            left: `${lightPos.pctX}%`,
            top: `${lightPos.pctY}%`,
            background: currentStyle.coreColor,
            boxShadow: `0 0 40px ${currentStyle.coreColor}, 0 0 90px ${currentStyle.coreColor}`,
          }}
        />

        {/* Organic Light Leak Diffuse Bleed */}
        <div
          className="flare-bleed-glow"
          style={{
            left: `${lightPos.pctX}%`,
            top: `${lightPos.pctY}%`,
            background: currentStyle.leakGlow,
          }}
        />

        {/* Telemetry Tag HUD */}
        <div className="flare-telemetry-hud">
          <span className="hud-lens">LENTE: ATLAS ORION ANAMORPHIC 2X</span>
          <span className="hud-flare-name">{currentStyle.name} · {currentStyle.subtitle}</span>
          <span className="hud-pos">COORDENADAS LUZ: X {Math.round(lightPos.pctX)}% · Y {Math.round(lightPos.pctY)}%</span>
        </div>
      </div>

      {/* Flare Footer Note */}
      <div className="flare-footer-note">
        <span>💡 <em>Efecto dinámico:</em> Puedes pasar el cursor por cualquier parte de la escena para simular la entrada de luz directa de sol en la lente.</span>
      </div>
    </div>
  );
}
