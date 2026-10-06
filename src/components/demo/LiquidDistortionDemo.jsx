import React, { useState, useRef, useEffect } from 'react';
import './LiquidDistortionDemo.css';

const LIQUID_PRESETS = [
  { id: 'fluid', name: 'Onda Líquida Orgánica', baseFreq: '0.02 0.05', scale: 45, type: 'turbulence' },
  { id: 'chrome', name: 'Refracción Cromo / Mercurio', baseFreq: '0.04 0.08', scale: 80, type: 'fractalNoise' },
  { id: 'glitch', name: 'Dispersión Digital Glitch', baseFreq: '0.08 0.005', scale: 65, type: 'turbulence' },
];

export default function LiquidDistortionDemo() {
  const [activePresetIdx, setActivePresetIdx] = useState(0);
  const [distortionScale, setDistortionScale] = useState(40);
  const [isHovering, setIsHovering] = useState(false);
  const [wavePhase, setWavePhase] = useState(0);
  const [shockwave, setShockwave] = useState(false);

  const currentPreset = LIQUID_PRESETS[activePresetIdx];
  const animRef = useRef(null);

  // Animated wave oscillation
  useEffect(() => {
    let start = performance.now();
    const loop = (time) => {
      const elapsed = (time - start) / 1000;
      setWavePhase(Math.sin(elapsed * 2) * 15);
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const triggerShockwave = () => {
    setShockwave(true);
    setTimeout(() => setShockwave(false), 600);
  };

  return (
    <div className="liquid-demo-card">
      {/* Hidden SVG Filter for Real-time Hardware Distortion */}
      <svg className="liquid-svg-filter" aria-hidden="true">
        <defs>
          <filter id="liquidFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence
              type={currentPreset.type}
              baseFrequency={currentPreset.baseFreq}
              numOctaves="2"
              result="turbulence"
            />
            <feDisplacementMap
              in2="turbulence"
              in="SourceGraphic"
              scale={isHovering || shockwave ? distortionScale + wavePhase : 0}
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
        </defs>
      </svg>

      <div className="liquid-demo-header">
        <div className="liquid-title-wrap">
          <div className="portal-tag-row">
            <span className="demo-badge modern-badge">VANGUARDIA DIGITAL 02</span>
            <span className="demo-badge creative-badge">CREATIVIDAD A TOPE</span>
          </div>
          <h3 className="demo-module-title">Distorsión Líquida & Refracción de Mercurio</h3>
          <p className="demo-module-desc">
            Pasa el ratón o haz clic sobre la imagen para provocar una deformación líquida refractiva en tiempo real generada mediante shaders vectoriales de desplazamiento de malla.
          </p>
        </div>

        {/* Preset Switcher */}
        <div className="liquid-controls-bar">
          <div className="liquid-btn-group">
            {LIQUID_PRESETS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`liquid-btn ${activePresetIdx === idx ? 'active' : ''}`}
                onClick={() => {
                  setActivePresetIdx(idx);
                  setDistortionScale(p.scale);
                }}
              >
                {p.name.split(' ')[0]} {p.name.split(' ')[1]}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="liquid-btn shock-btn"
            onClick={triggerShockwave}
          >
            ⚡️ Pulso Shockwave
          </button>
        </div>
      </div>

      {/* Main Photographic Canvas with Liquid Warp */}
      <div
        className={`liquid-stage ${shockwave ? 'shockwave-active' : ''}`}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onClick={triggerShockwave}
      >
        <img
          src="/assets/salomon/webp/portada.webp"
          alt="Salomon action distorted"
          className="liquid-img"
          style={{
            filter: (isHovering || shockwave) ? 'url(#liquidFilter)' : 'none',
          }}
        />

        {/* Modern Cyber Glass HUD */}
        <div className="liquid-hud-corner">
          <span className="hud-code">FX: MESH_DISPLACEMENT_V4</span>
          <span className="hud-state">{isHovering ? 'ESTADO: LÍQUIDO ACTIVO' : 'REPOSO · PASA EL CURSOR'}</span>
        </div>

        <div className="liquid-center-prompt">
          <span>{isHovering ? 'ARRASTRA O HAZ CLIC PARA AGITAR' : 'PASA EL CURSOR POR LA IMAGEN'}</span>
        </div>
      </div>

      {/* Intensity Slider Bar */}
      <div className="liquid-slider-bar">
        <div className="slider-label-group">
          <span className="slider-label">Intensidad de Deformación Fluida:</span>
          <span className="slider-val">{distortionScale} px</span>
        </div>
        <input
          type="range"
          min="10"
          max="120"
          value={distortionScale}
          onChange={(e) => setDistortionScale(Number(e.target.value))}
          className="liquid-range-input"
        />
      </div>

      <div className="liquid-footer-note">
        <span>💡 <em>Sensación:</em> Proporciona esa vibra ultra-contemporánea y disruptiva que tienen los portafolios de directores de arte modernos y marcas como Off-White o Balenciaga.</span>
      </div>
    </div>
  );
}
