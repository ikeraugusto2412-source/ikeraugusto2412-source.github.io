import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { soundFx } from '../../utils/analogSound';
import './ApertureBokehDemo.css';

const APERTURE_STOPS = [
  { f: 'ƒ/1.2', blur: 16, irisScale: 1.0,  dof: 'Profundidad ultra reducida · Bokeh sedoso', blades: 'Abierto al 100%' },
  { f: 'ƒ/1.8', blur: 11, irisScale: 0.82, dof: 'Retrato cinematográfico · Suave desenfoque', blades: 'Abierto al 82%' },
  { f: 'ƒ/2.8', blur: 7,  irisScale: 0.65, dof: 'Excelente nitidez central · Bokeh moderado', blades: 'Abierto al 65%' },
  { f: 'ƒ/5.6', blur: 3,  irisScale: 0.45, dof: 'Sweet spot de la lente · Profundidad media', blades: 'Paso medio' },
  { f: 'ƒ/11',  blur: 1,  irisScale: 0.28, dof: 'Paisaje y calle · Gran profundidad de campo', blades: 'Cerrado' },
  { f: 'ƒ/16',  blur: 0,  irisScale: 0.16, dof: 'Enfoque hiperfocal total · Todo nítido', blades: 'Mínima apertura' },
];

export default function ApertureBokehDemo() {
  const [activeStopIdx, setActiveStopIdx] = useState(1); // default f/1.8
  const currentStop = APERTURE_STOPS[activeStopIdx];

  const selectStop = (idx) => {
    setActiveStopIdx(idx);
    soundFx.playTactileClick(0.7);
  };

  return (
    <div className="bokeh-demo-card">
      <div className="bokeh-demo-header">
        <div className="bokeh-title-wrap">
          <span className="demo-badge new-badge">NUEVA IDEA 02</span>
          <h3 className="demo-module-title">Simulador de Diafragma Óptico & Bokeh (ƒ/1.2 a ƒ/16)</h3>
          <p className="demo-module-desc">
            Gira el anillo de diafragma manual para ver cómo las palas mecánicas del iris se abren o cierran físicamente, alterando en tiempo real la profundidad de campo y el desenfoque bokeh del fondo.
          </p>
        </div>

        {/* Optical Telemetry Tag */}
        <div className="bokeh-meta-pill">
          <span className="iris-dot" />
          <span>OBJETIVO: 50MM F/1.2 GM CINEMA</span>
        </div>
      </div>

      {/* Main Photographic Stage with Dynamic Bokeh */}
      <div className="bokeh-viewport">
        {/* Background Layer (Subject to Depth-of-Field Blur) */}
        <div
          className="bokeh-bg-layer"
          style={{
            backgroundImage: "url('/assets/london/webp/_6M25608.webp')",
            filter: `blur(${currentStop.blur}px)`,
          }}
        />

        {/* Specular Bokeh Glow Particles (Visible at wide apertures f/1.2 - f/2.8) */}
        <div
          className="bokeh-specular-container"
          style={{ opacity: currentStop.blur > 4 ? (currentStop.blur / 16) : 0 }}
        >
          <span className="bokeh-orb orb-1" />
          <span className="bokeh-orb orb-2" />
          <span className="bokeh-orb orb-3" />
          <span className="bokeh-orb orb-4" />
          <span className="bokeh-orb orb-5" />
        </div>

        {/* Foreground In-Focus Subject Mask / Element */}
        <div className="bokeh-in-focus-hud">
          <div className="focus-crosshair">
            <span className="crosshair-box" />
            <span className="focus-lock-text">ENFOQUE BLOQUEADO [SUJETO]</span>
          </div>
        </div>

        {/* Mechanical Iris Blade Graphic Overlay (Floating Lens Barrel Indicator) */}
        <div className="lens-iris-widget">
          <div className="iris-housing">
            <div
              className="iris-aperture-hole"
              style={{
                transform: `scale(${currentStop.irisScale})`,
              }}
            />
            {/* 8 Mechanical Blades lines */}
            <div className="iris-blade-line b1" />
            <div className="iris-blade-line b2" />
            <div className="iris-blade-line b3" />
            <div className="iris-blade-line b4" />
            <div className="iris-blade-line b5" />
            <div className="iris-blade-line b6" />
            <div className="iris-blade-line b7" />
            <div className="iris-blade-line b8" />
          </div>
          <div className="iris-label">
            <span className="iris-f-number">{currentStop.f}</span>
            <span className="iris-f-desc">{currentStop.blades}</span>
          </div>
        </div>
      </div>

      {/* Manual Lens Barrel Control Ring */}
      <div className="lens-barrel-ring">
        <div className="barrel-knurling-top" />
        <div className="barrel-stops-row">
          {APERTURE_STOPS.map((stop, idx) => (
            <button
              key={stop.f}
              type="button"
              className={`barrel-stop-btn ${activeStopIdx === idx ? 'active' : ''}`}
              onClick={() => selectStop(idx)}
            >
              <span className="stop-f">{stop.f}</span>
              <span className="stop-tick" />
            </button>
          ))}
        </div>
        <div className="barrel-knurling-bottom" />
      </div>

      {/* Optical Description */}
      <div className="bokeh-footer-bar">
        <div className="bokeh-dof-text">
          <span className="dof-indicator">PROFUNDIDAD DE CAMPO:</span>
          <strong>{currentStop.dof}</strong>
        </div>
        <div className="bokeh-hint">
          <span>💡 Prueba a cambiar de ƒ/1.2 a ƒ/16 para ver la transición óptica completa.</span>
        </div>
      </div>
    </div>
  );
}
