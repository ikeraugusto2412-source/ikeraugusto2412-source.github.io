import React, { useState, useRef, useEffect } from 'react';
import { soundFx } from '../../utils/analogSound';
import './ColorGradeSliderDemo.css';

const GRADE_PRESETS = [
  {
    id: 'norway',
    title: 'Noruega 4K — Fiordos & Carreteras',
    type: 'Cine 4K HDR',
    img: '/assets/Noruega/webp/_6M25407.webp',
    logProfile: 'SONY S-LOG3 / S-GAMUT3.CINE',
    gradeProfile: 'FILM PRINT EMULATION · KODAK 2383',
  },
  {
    id: 'salomon',
    title: 'Salomon Huck Knife Classics',
    type: 'Snowboard Action Commercial',
    img: '/assets/salomon/webp/portada.webp',
    logProfile: 'RED R3D RAW / IPP2 REDLOGFILM',
    gradeProfile: 'COMMERCIAL ACTION PUNCH · ARRI COLOR',
  },
  {
    id: 'london',
    title: 'London Night Streetwear 4K',
    type: 'Commercial Editorial Campaign',
    img: '/assets/london/webp/_6M25605.webp',
    logProfile: 'FLAT SONY FX3 RAW (UNGRADED)',
    gradeProfile: 'DAVINCI RESOLVE COLOR GRADE · TEAL & ORANGE',
  }
];

export default function ColorGradeSliderDemo() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);

  const containerRef = useRef(null);
  const animRef = useRef(null);
  const current = GRADE_PRESETS[activeIdx];

  const updatePosition = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const clampedPct = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    setSliderPos(clampedPct);
  };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setIsAutoPlaying(false);
    updatePosition(e.clientX);
    soundFx.playTactileClick(0.6);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setIsAutoPlaying(false);
    if (e.touches[0]) updatePosition(e.touches[0].clientX);
    soundFx.playTactileClick(0.6);
  };

  useEffect(() => {
    const handleMove = (e) => {
      if (!isDragging) return;
      updatePosition(e.clientX);
    };

    const handleTouchMove = (e) => {
      if (!isDragging || !e.touches[0]) return;
      updatePosition(e.touches[0].clientX);
    };

    const handleUp = () => {
      if (isDragging) {
        setIsDragging(false);
        soundFx.playTactileClick(0.4);
      }
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  // Auto-sweep demonstration
  useEffect(() => {
    if (!isAutoPlaying) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    let start = performance.now();
    const animate = (time) => {
      const elapsed = (time - start) / 1000;
      // Oscillate smoothly between 20% and 80%
      const pos = 50 + Math.sin(elapsed * 2) * 35;
      setSliderPos(pos);
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isAutoPlaying]);

  return (
    <div className="grade-demo-card">
      <div className="grade-demo-header">
        <div className="grade-title-wrap">
          <div className="grade-badge-row" style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
            <span className="demo-badge">MODO LAB 02</span>
            <span className="demo-badge" style={{ background: 'rgba(255, 215, 0, 0.15)', color: '#ffd700', borderColor: 'rgba(255, 215, 0, 0.3)' }}>★ TU ELECCIÓN FAVORITA</span>
          </div>
          <h3 className="demo-module-title">Slider Interactivo RAW vs. Color Grade</h3>
          <p className="demo-module-desc">
            Arrastra el divisor táctil para comparar el perfil plano LOG/RAW original frente al etalonaje de cine final realizado en DaVinci Resolve.
          </p>
        </div>

        {/* Controls Bar */}
        <div className="grade-controls-bar">
          <div className="grade-btn-group">
            {GRADE_PRESETS.map((p, idx) => (
              <button
                key={p.id}
                type="button"
                className={`grade-btn ${activeIdx === idx ? 'active' : ''}`}
                onClick={() => {
                  setActiveIdx(idx);
                  setIsAutoPlaying(false);
                  soundFx.playFilmAdvance();
                }}
              >
                {p.title.split('—')[0].trim()}
              </button>
            ))}
          </div>

          <button
            type="button"
            className={`grade-btn ${isAutoPlaying ? 'active' : ''}`}
            onClick={() => {
              setIsAutoPlaying(!isAutoPlaying);
              soundFx.playTactileClick();
            }}
          >
            {isAutoPlaying ? '⏸ Pausar Barrido' : '▶ Barrido Automático'}
          </button>
        </div>
      </div>

      {/* Main Split Slider Viewport */}
      <div
        ref={containerRef}
        className="grade-viewport"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        {/* Layer B (Right / Background): Graded Final Look */}
        <div className="grade-layer grade-graded-layer">
          <img src={current.img} alt={current.title} className="grade-img grade-graded-img" />
          <div className="grade-badge grade-badge-right">
            <span className="grade-dot grade-dot-gold" />
            <div className="grade-badge-text">
              <span className="grade-badge-title">FINAL COLOR GRADE</span>
              <span className="grade-badge-sub">{current.gradeProfile}</span>
            </div>
          </div>
        </div>

        {/* Layer A (Left / Foreground): Flat S-Log3 / Raw Profile */}
        <div
          className="grade-layer grade-raw-layer"
          style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
        >
          <img src={current.img} alt={current.title} className="grade-img grade-raw-img" />
          <div className="grade-badge grade-badge-left">
            <span className="grade-dot grade-dot-silver" />
            <div className="grade-badge-text">
              <span className="grade-badge-title">RAW / S-LOG3 FLAT</span>
              <span className="grade-badge-sub">{current.logProfile}</span>
            </div>
          </div>
        </div>

        {/* Tactical Divider Handle */}
        <div
          className="grade-divider-line"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="grade-handle-btn">
            <span className="handle-arrow">‹</span>
            <div className="handle-knurling" />
            <span className="handle-arrow">›</span>
          </div>
          <span className="grade-pos-readout">{Math.round(sliderPos)}%</span>
        </div>
      </div>

      <div className="grade-footer-note">
        <span>💡 <em>Experiencia cliente:</em> Este interactivo permite a marcas comerciales y agencias ver tu proceso de postproducción de color de forma tangible e impactante.</span>
      </div>
    </div>
  );
}
