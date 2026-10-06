import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { soundFx } from '../../utils/analogSound';
import './FilmStripLightboxDemo.css';

const FILM_FRAMES = [
  { id: '18A', img: '/assets/london/webp/_6M25608.webp', title: 'Piccadilly Neon Lights', meta: 'EXP 18A' },
  { id: '19',  img: '/assets/Noruega/webp/_6M25407.webp', title: 'Fjord Highway Horizon', meta: 'EXP 19' },
  { id: '19A', img: '/assets/salomon/webp/portada.webp', title: 'Salomon Big Air Jump', meta: 'EXP 19A' },
  { id: '20',  img: '/assets/london/webp/_6M24845.webp', title: 'Westminster Red Bus Rain', meta: 'EXP 20' },
  { id: '20A', img: '/assets/tour-de-france/webp/_6M21261.webp', title: 'Peloton Coastal Descent', meta: 'EXP 20A' },
  { id: '21',  img: '/assets/Noruega/webp/_6M25158.webp', title: 'Arctic Road Mist', meta: 'EXP 21' },
  { id: '21A', img: '/assets/london/webp/_6M25605.webp', title: 'Underground Passenger', meta: 'EXP 21A' },
  { id: '22',  img: '/assets/salomon/webp/_6M20776.webp', title: 'Boarder Snow Spray', meta: 'EXP 22' },
];

export default function FilmStripLightboxDemo() {
  const [isLightboxOn, setIsLightboxOn] = useState(true);
  const [selectedFrame, setSelectedFrame] = useState(FILM_FRAMES[1]);
  const [isNegative, setIsNegative] = useState(false);
  const stripRef = useRef(null);

  const toggleLightbox = () => {
    setIsLightboxOn(!isLightboxOn);
    soundFx.playTactileClick();
  };

  const toggleNegative = () => {
    setIsNegative(!isNegative);
    soundFx.playTactileClick();
  };

  const selectFrame = (frame) => {
    setSelectedFrame(frame);
    soundFx.playShutter();
  };

  return (
    <div className={`filmstrip-demo-card ${isLightboxOn ? 'lightbox-lit' : 'lightbox-dim'}`}>
      <div className="filmstrip-demo-header">
        <div className="filmstrip-title-wrap">
          <span className="demo-badge new-badge">NUEVA IDEA 01</span>
          <h3 className="demo-module-title">Mesa de Luz & Tira Continua de Negativos 35mm</h3>
          <p className="demo-module-desc">
            Una experiencia táctil de laboratorio analógico. Tira continua de película con perforaciones de arrastre (*sprocket holes*), numeración de fotogramas y código de barras DX sobre mesa de luz interactiva.
          </p>
        </div>

        <div className="filmstrip-controls">
          <button
            type="button"
            className={`filmstrip-btn ${isLightboxOn ? 'active' : ''}`}
            onClick={toggleLightbox}
          >
            {isLightboxOn ? '💡 Mesa de Luz: ENCENDIDA' : '🌙 Mesa de Luz: APAGADA'}
          </button>

          <button
            type="button"
            className={`filmstrip-btn ${isNegative ? 'active' : ''}`}
            onClick={toggleNegative}
          >
            {isNegative ? '🎞 Vista: Negativo Celuloide' : '📷 Vista: Positivo Diapositiva'}
          </button>
        </div>
      </div>

      {/* Lightbox Table Surface */}
      <div className="lightbox-surface">
        <div className="lightbox-grid-pattern" />

        {/* 35mm Film Roll Strip */}
        <div
          ref={stripRef}
          className={`film-strip-scrollable ${isNegative ? 'film-negative-mode' : ''}`}
        >
          {/* Edge Code Top Bar */}
          <div className="film-edge-top">
            <span className="film-brand-edge">EASTMAN KODAK 5219 · 500T</span>
            <span className="film-barcode-edge">|||| ||||| || ||||||</span>
            <span className="film-brand-edge">SAFETY FILM · 35MM</span>
            <span className="film-barcode-edge">||||| ||| ||||</span>
            <span className="film-brand-edge">IKER AUGUSTO ARCHIVE</span>
          </div>

          <div className="film-frames-track">
            {FILM_FRAMES.map((frame) => {
              const isSelected = selectedFrame.id === frame.id;
              return (
                <div
                  key={frame.id}
                  className={`film-frame-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectFrame(frame)}
                >
                  {/* Sprockets Top */}
                  <div className="sprocket-row top-sprockets">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="sprocket-hole" />
                    ))}
                  </div>

                  {/* Frame Image Area */}
                  <div className="frame-image-box">
                    <img src={frame.img} alt={frame.title} className="frame-thumbnail" />
                    <span className="frame-meta-tag">{frame.meta}</span>
                  </div>

                  {/* Sprockets Bottom */}
                  <div className="sprocket-row bottom-sprockets">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="sprocket-hole" />
                    ))}
                  </div>

                  <span className="frame-exp-number">{frame.id}</span>
                </div>
              );
            })}
          </div>

          {/* Edge Code Bottom Bar */}
          <div className="film-edge-bottom">
            <span>▷ 18A</span>
            <span>▷ 19</span>
            <span>▷ 19A</span>
            <span>▷ 20</span>
            <span>▷ 20A</span>
            <span>▷ 21</span>
            <span>▷ 21A</span>
            <span>▷ 22</span>
          </div>
        </div>

        {/* Active Frame Enlargement Preview */}
        {selectedFrame && (
          <div className="lightbox-preview-card">
            <div className="preview-header">
              <span className="preview-label">FOTOGRAMA SELECCIONADO EN MESA: <strong>{selectedFrame.id}</strong></span>
              <span className="preview-title">{selectedFrame.title}</span>
            </div>
            <div className={`preview-img-wrap ${isNegative ? 'film-negative-mode' : ''}`}>
              <img src={selectedFrame.img} alt={selectedFrame.title} className="preview-img" />
            </div>
          </div>
        )}
      </div>

      <div className="filmstrip-footer-note">
        <span>💡 <em>Sensación analógica:</em> Desplaza la tira horizontalmente y haz clic en cualquier negativo para proyectarlo en la lupa de la mesa de luz.</span>
      </div>
    </div>
  );
}
