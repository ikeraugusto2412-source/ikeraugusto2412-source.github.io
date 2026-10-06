import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { soundFx } from '../../utils/analogSound';
import './FilmEmulationDemo.css';

const FILM_STOCKS = [
  {
    id: 'cinestill',
    name: 'Cinestill 800T',
    subtitle: 'Tungsten Cinema Stock',
    desc: 'Famoso por su halo rojo (Halation) alrededor de fuentes de luz intensas. Estética nocturna de película de 35mm estilo Blade Runner / Wong Kar-wai.',
    halation: true,
    toneClass: 'tone-cinestill',
    grainIntensity: 'Fino cinematográfico',
    iso: 'ISO 800',
  },
  {
    id: 'portra',
    name: 'Kodak Portra 400',
    subtitle: 'Warm Editorial & Skin Tones',
    desc: 'El estándar de oro en moda y retrato editorial. Tonos de piel suaves, grano pastel sedoso y sombras ligeramente cálidas.',
    halation: false,
    toneClass: 'tone-portra',
    grainIntensity: 'Micro-grano orgánico',
    iso: 'ISO 400',
  },
  {
    id: 'trix',
    name: 'Kodak Tri-X 400',
    subtitle: 'Classic Black & White Silver',
    desc: 'La emulsión legendaria del fotoperiodismo callejero y Magnum. Altos contrastes, negros de carbón profundos y grano con garra.',
    halation: false,
    toneClass: 'tone-trix',
    grainIntensity: 'Grano de plata pronunciado',
    iso: 'ISO 400 (Push +1)',
  },
  {
    id: 'velvia',
    name: 'Fujifilm Velvia 50',
    subtitle: 'Vivid Landscape Slide Film',
    desc: 'Diapositiva reversible de alta saturación. Azules crepusculares profundos y verdes esmeralda intensos para naturaleza y exteriores.',
    halation: false,
    toneClass: 'tone-velvia',
    grainIntensity: 'Ultra-fino',
    iso: 'ISO 50',
  }
];

export default function FilmEmulationDemo() {
  const [activeStockIdx, setActiveStockIdx] = useState(0);
  const [hasGrain, setHasGrain] = useState(true);
  const [exposureCompensation, setExposureCompensation] = useState(0); // -1, 0, +1
  const currentStock = FILM_STOCKS[activeStockIdx];

  const selectStock = (idx) => {
    setActiveStockIdx(idx);
    soundFx.playFilmAdvance();
  };

  const toggleGrain = () => {
    setHasGrain(!hasGrain);
    soundFx.playTactileClick();
  };

  const changeExp = (val) => {
    setExposureCompensation(val);
    soundFx.playTactileClick();
  };

  return (
    <div className="emulation-demo-card">
      <div className="emulation-demo-header">
        <div className="emulation-title-wrap">
          <span className="demo-badge new-badge">NUEVA IDEA 03</span>
          <h3 className="demo-module-title">Emulador de Emulsión Analógica & Efecto Halation</h3>
          <p className="demo-module-desc">
            Simulador de las 4 películas de 35mm más icónicas de la historia del cine y la fotografía, con halo rojo de dispersión (*Cinestill Halation*), curvas tonales y grano de plata.
          </p>
        </div>

        {/* Film Box Selector Buttons */}
        <div className="emulation-stocks-bar">
          {FILM_STOCKS.map((stock, idx) => (
            <button
              key={stock.id}
              type="button"
              className={`film-box-btn ${activeStockIdx === idx ? 'active' : ''}`}
              onClick={() => selectStock(idx)}
            >
              <span className="box-name">{stock.name}</span>
              <span className="box-iso">{stock.iso}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Viewport Frame */}
      <div className={`emulation-viewport ${currentStock.toneClass}`}>
        <img
          src="/assets/london/webp/_6M25608.webp"
          alt="Film emulation preview"
          className="emulation-base-img"
          style={{
            filter: exposureCompensation === 1 
              ? 'brightness(1.15) contrast(1.05)' 
              : exposureCompensation === -1 
              ? 'brightness(0.85) contrast(1.15)' 
              : 'none'
          }}
        />

        {/* Cinestill Red Halation Glow Layer */}
        {currentStock.halation && (
          <div className="halation-glow-layer" />
        )}

        {/* Procedural Film Grain Overlay */}
        {hasGrain && (
          <div className="film-grain-layer" />
        )}

        {/* Film Canister HUD Stamp */}
        <div className="canister-stamp">
          <div className="canister-header">
            <span className="stamp-badge">35MM FILM PROFILE</span>
            <span className="stamp-stock">{currentStock.name}</span>
          </div>
          <p className="stamp-desc">{currentStock.desc}</p>
          <div className="stamp-meta">
            <span>VELOCIDAD: <strong>{currentStock.iso}</strong></span>
            <span>TEXTURA: <strong>{currentStock.grainIntensity}</strong></span>
            {currentStock.halation && (
              <span className="halation-active-tag">● HALATION 650nm ACTIVO</span>
            )}
          </div>
        </div>
      </div>

      {/* Control Tweaks Bar */}
      <div className="emulation-tools-bar">
        <div className="tool-group">
          <span className="tool-label">Grano de Haluros de Plata:</span>
          <button
            type="button"
            className={`tool-toggle-btn ${hasGrain ? 'active' : ''}`}
            onClick={toggleGrain}
          >
            {hasGrain ? 'Grano: ACTIVADO' : 'Grano: DESACTIVADO'}
          </button>
        </div>

        <div className="tool-group">
          <span className="tool-label">Forzado de Exposición (Push/Pull):</span>
          <div className="exp-btn-row">
            <button
              type="button"
              className={`exp-btn ${exposureCompensation === -1 ? 'active' : ''}`}
              onClick={() => changeExp(-1)}
            >
              -1 Stop (Pull)
            </button>
            <button
              type="button"
              className={`exp-btn ${exposureCompensation === 0 ? 'active' : ''}`}
              onClick={() => changeExp(0)}
            >
              Nominal 0
            </button>
            <button
              type="button"
              className={`exp-btn ${exposureCompensation === 1 ? 'active' : ''}`}
              onClick={() => changeExp(1)}
            >
              +1 Stop (Push)
            </button>
          </div>
        </div>
      </div>

      <div className="emulation-footer-note">
        <span>💡 <em>Detalle técnico:</em> Observa cómo en Cinestill 800T los reflejos de luz desprenden un halo rojizo-ámbar característico de la eliminación de la capa Remjet en cine.</span>
      </div>
    </div>
  );
}
