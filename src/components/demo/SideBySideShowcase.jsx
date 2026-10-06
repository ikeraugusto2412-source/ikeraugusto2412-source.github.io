import React, { useState } from 'react';
import { SideBySideSlide } from '../unlumen-ui/side-by-side-slide';
import './SideBySideShowcase.css';

const SHOWCASE_PROJECTS = [
  {
    id: 'norway',
    name: 'Noruega 4K — Fiordos & Carreteras',
    tag: 'CINE 4K HDR',
    img: '/assets/Noruega/webp/_6M25407.webp',
    logMeta: 'SONY FX3 S-LOG3 / S-GAMUT3.CINE',
    gradeMeta: 'DAVINCI RESOLVE · KODAK 2383 PRINT',
  },
  {
    id: 'salomon',
    name: 'Salomon Huck Knife Classics 2026',
    tag: 'ACTION COMMERCIAL',
    img: '/assets/salomon/webp/portada.webp',
    logMeta: 'RED R3D RAW / IPP2 REDLOGFILM',
    gradeMeta: 'COMMERCIAL ACTION FINISH · ARRI COLOR',
  },
  {
    id: 'london',
    name: 'London Night Streetwear 4K',
    tag: 'COMMERCIAL EDITORIAL',
    img: '/assets/london/webp/_6M25605.webp',
    logMeta: 'FLAT DIGITAL SENSOR RAW',
    gradeMeta: 'URBAN CINEMA GRADE · TEAL & ORANGE',
  }
];

export default function SideBySideShowcase() {
  const [activeProjectIdx, setActiveProjectIdx] = useState(0);
  const [orientation, setOrientation] = useState('horizontal');
  const [showHandle, setShowHandle] = useState(true);
  const [activeColor, setActiveColor] = useState('#ffffff');
  const [springPreset, setSpringPreset] = useState('default'); // 'default' | 'snappy' | 'liquid'

  const currentProject = SHOWCASE_PROJECTS[activeProjectIdx];

  const springConfigs = {
    default: { stiffness: 300, damping: 30 },
    snappy: { stiffness: 500, damping: 40 },
    liquid: { stiffness: 180, damping: 25 },
  };

  return (
    <div className="side-by-side-showcase-card">
      <div className="sbs-showcase-header">
        <div className="sbs-title-wrap">
          <div className="sbs-badge-row">
            <span className="demo-badge highlight-badge">★ TU ELECCIÓN 01</span>
            <span className="demo-badge spec-badge">@UNLUMEN-UI/SIDE-BY-SIDE-SLIDE</span>
          </div>
          <h3 className="demo-module-title">Side By Side Slide — RAW a Color Grade</h3>
          <p className="demo-module-desc">
            Componente oficial de Léo con física de resortes (*spring-animated divider*) que sigue el cursor a 60 FPS mediante <code>useMotionValue</code> y <code>clip-path: inset()</code>. Al retirar el cursor, regresa automáticamente al centro con balanceo elástico.
          </p>
        </div>

        {/* Project Presets Switcher */}
        <div className="sbs-controls-row">
          <div className="sbs-btn-group">
            {SHOWCASE_PROJECTS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`sbs-btn ${activeProjectIdx === idx ? 'active' : ''}`}
                onClick={() => setActiveProjectIdx(idx)}
              >
                {p.name.split('—')[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Interactive SideBySideSlide Viewport */}
      <div className="sbs-viewport-wrapper">
        <SideBySideSlide
          beforeImage={currentProject.img}
          afterImage={currentProject.img}
          beforeAlt={`${currentProject.name} RAW S-Log3`}
          afterAlt={`${currentProject.name} Color Grade Final`}
          orientation={orientation}
          initialPosition={50}
          dividerColor={activeColor}
          dividerWidth={activeColor === '#ffffff' ? 2 : 3}
          dividerShadow={`0 0 16px ${activeColor}88`}
          showHandle={showHandle}
          handleSize={42}
          handleColor={activeColor}
          cursor="none"
          springOptions={springConfigs[springPreset]}
          className="sbs-slide-instance"
          beforeStyle={{
            filter: 'saturate(0.48) contrast(0.72) brightness(1.22) sepia(0.06)',
          }}
          afterStyle={{
            filter: 'saturate(1.15) contrast(1.1) brightness(0.98)',
          }}
        >
          {/* Custom Overlaid HUD Badges */}
          <div className="sbs-overlay-hud left-hud">
            <span className="sbs-hud-dot silver-dot" />
            <div className="sbs-hud-text">
              <span className="sbs-hud-title">RAW / S-LOG3 FLAT</span>
              <span className="sbs-hud-sub">{currentProject.logMeta}</span>
            </div>
          </div>

          <div className="sbs-overlay-hud right-hud">
            <span className="sbs-hud-dot gold-dot" />
            <div className="sbs-hud-text">
              <span className="sbs-hud-title">FINAL COLOR GRADE</span>
              <span className="sbs-hud-sub">{currentProject.gradeMeta}</span>
            </div>
          </div>
        </SideBySideSlide>
      </div>

      {/* Interactive Options Configuration Bar */}
      <div className="sbs-config-bar">
        {/* Orientation Toggle */}
        <div className="config-group">
          <span className="config-label">Orientación:</span>
          <div className="config-toggles">
            <button
              type="button"
              className={`config-chip ${orientation === 'horizontal' ? 'active' : ''}`}
              onClick={() => setOrientation('horizontal')}
            >
              Horizontal (← →)
            </button>
            <button
              type="button"
              className={`config-chip ${orientation === 'vertical' ? 'active' : ''}`}
              onClick={() => setOrientation('vertical')}
            >
              Vertical (↑ ↓)
            </button>
          </div>
        </div>

        {/* Divider Color Customization */}
        <div className="config-group">
          <span className="config-label">Color Divisor:</span>
          <div className="color-swatches">
            {[
              { label: 'Blanco', value: '#ffffff' },
              { label: 'Azul Apple', value: '#3b82f6' },
              { label: 'Oro Cinema', value: '#ffd700' },
              { label: 'Neón Rosa', value: '#ff0055' },
            ].map((c) => (
              <button
                key={c.value}
                type="button"
                className={`color-swatch-btn ${activeColor === c.value ? 'active' : ''}`}
                style={{ backgroundColor: c.value }}
                onClick={() => setActiveColor(c.value)}
                title={c.label}
              />
            ))}
          </div>
        </div>

        {/* Handle Toggle */}
        <div className="config-group">
          <span className="config-label">Tirador Circular:</span>
          <button
            type="button"
            className={`config-chip ${showHandle ? 'active' : ''}`}
            onClick={() => setShowHandle(!showHandle)}
          >
            {showHandle ? 'Con Tirador' : 'Sin Tirador (Línea pura)'}
          </button>
        </div>

        {/* Spring Physics Preset */}
        <div className="config-group">
          <span className="config-label">Física de Resorte:</span>
          <div className="config-toggles">
            <button
              type="button"
              className={`config-chip ${springPreset === 'default' ? 'active' : ''}`}
              onClick={() => setSpringPreset('default')}
            >
              Estándar
            </button>
            <button
              type="button"
              className={`config-chip ${springPreset === 'snappy' ? 'active' : ''}`}
              onClick={() => setSpringPreset('snappy')}
            >
              Rápido (Stiff)
            </button>
            <button
              type="button"
              className={`config-chip ${springPreset === 'liquid' ? 'active' : ''}`}
              onClick={() => setSpringPreset('liquid')}
            >
              Suave (Liquid)
            </button>
          </div>
        </div>
      </div>

      <div className="sbs-footer-note">
        <span>💡 <em>Comportamiento Unlumen UI:</em> Pasa el ratón por encima para desplazar la cortina y retira el cursor para comprobar cómo el divisor vuelve flotando suavemente al 50% inicial con física de resorte real.</span>
      </div>
    </div>
  );
}
