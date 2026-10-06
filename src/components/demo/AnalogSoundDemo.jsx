import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { soundFx } from '../../utils/analogSound';
import './AnalogSoundDemo.css';

export default function AnalogSoundDemo() {
  const [isEnabled, setIsEnabled] = useState(soundFx.isEnabled);
  const [volume, setVolume] = useState(0.6);
  const [activePad, setActivePad] = useState(null);
  const [triggerCount, setTriggerCount] = useState(0);

  const toggleSound = () => {
    const next = soundFx.toggleSound();
    setIsEnabled(next);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    soundFx.setVolume(val);
  };

  const triggerSound = (type, fn) => {
    // If user clicks a sound pad, auto-enable if not active
    if (!soundFx.isEnabled) {
      soundFx.toggleSound(true);
      setIsEnabled(true);
    }
    fn();
    setActivePad(type);
    setTriggerCount((c) => c + 1);
    setTimeout(() => setActivePad(null), 250);
  };

  return (
    <div className="sound-demo-card">
      <div className="sound-demo-header">
        <div className="sound-title-wrap">
          <span className="demo-badge">MODO LAB 03</span>
          <h3 className="demo-module-title">Diseño Sonoro Analógico Web Audio</h3>
          <p className="demo-module-desc">
            Micro-acústica mecánica sintetizada en tiempo real mediante el oscilador de la Web Audio API del navegador. Cero archivos MP3 pesados, latencia cero y fidelidad táctil.
          </p>
        </div>

        {/* Master Sound Switch */}
        <div className="sound-master-control">
          <button
            type="button"
            className={`sound-master-btn ${isEnabled ? 'enabled' : ''}`}
            onClick={toggleSound}
          >
            {/* 4-bar jumping EQ animation when sound is ON */}
            <div className="sound-eq-bars">
              <span className={`eq-bar bar-1 ${isEnabled ? 'animating' : ''}`} />
              <span className={`eq-bar bar-2 ${isEnabled ? 'animating' : ''}`} />
              <span className={`eq-bar bar-3 ${isEnabled ? 'animating' : ''}`} />
              <span className={`eq-bar bar-4 ${isEnabled ? 'animating' : ''}`} />
            </div>
            <span className="sound-master-label">
              {isEnabled ? 'AUDIO MASTER: ACTIVO' : 'AUDIO MASTER: SILENCIADO'}
            </span>
          </button>
        </div>
      </div>

      {/* Sound Pads Grid */}
      <div className="sound-pads-grid">
        {/* Pad 1: Leica Shutter */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={`sound-pad ${activePad === 'shutter' ? 'triggering' : ''}`}
          onClick={() => triggerSound('shutter', () => soundFx.playShutter())}
        >
          <div className="pad-icon">📸</div>
          <div className="pad-meta">
            <span className="pad-tag">01 · OBTURADOR</span>
            <span className="pad-name">Leica Focal Plane Slap</span>
            <span className="pad-desc">Doble chasquido de cortinilla y rebote de espejo analógico</span>
          </div>
          <span className="pad-action-hint">Disparar</span>
        </motion.button>

        {/* Pad 2: Film Advance Ratchet */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={`sound-pad ${activePad === 'advance' ? 'triggering' : ''}`}
          onClick={() => triggerSound('advance', () => soundFx.playFilmAdvance())}
        >
          <div className="pad-icon">⚙️</div>
          <div className="pad-meta">
            <span className="pad-tag">02 · CARRETE</span>
            <span className="pad-name">35mm Film Advance Lever</span>
            <span className="pad-desc">Rueda dentada de tracción de película y pestillo final</span>
          </div>
          <span className="pad-action-hint">Arrastrar</span>
        </motion.button>

        {/* Pad 3: Tactile Studio Click */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={`sound-pad ${activePad === 'click' ? 'triggering' : ''}`}
          onClick={() => triggerSound('click', () => soundFx.playTactileClick())}
        >
          <div className="pad-icon">🔘</div>
          <div className="pad-meta">
            <span className="pad-tag">03 · INTERRUPTOR</span>
            <span className="pad-name">Studio Tactile Switch</span>
            <span className="pad-desc">Chasquido metálico de alta precisión para botones e inputs</span>
          </div>
          <span className="pad-action-hint">Pulsar</span>
        </motion.button>

        {/* Pad 4: Motor Drive Burst */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.96 }}
          className={`sound-pad ${activePad === 'burst' ? 'triggering' : ''}`}
          onClick={() => triggerSound('burst', () => soundFx.playBurstDrive())}
        >
          <div className="pad-icon">⚡️</div>
          <div className="pad-meta">
            <span className="pad-tag">04 · RÁFAGA</span>
            <span className="pad-name">Continuous Motor Drive</span>
            <span className="pad-desc">Secuencia de 3 fotogramas por segundo para fotografía deportiva</span>
          </div>
          <span className="pad-action-hint">Ráfaga</span>
        </motion.button>
      </div>

      {/* Volume & Telemetry Bar */}
      <div className="sound-sub-bar">
        <div className="sound-volume-wrap">
          <span className="volume-label">Volumen Acústico:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={handleVolumeChange}
            className="sound-volume-slider"
          />
          <span className="volume-pct">{Math.round(volume * 100)}%</span>
        </div>

        <div className="sound-stats">
          <span>Impactos acústicos registrados: <strong>{triggerCount}</strong></span>
        </div>
      </div>

      <div className="sound-footer-note">
        <span>💡 <em>Filosofía de diseño:</em> El sonido permanece en silencio por defecto para respetar al usuario, pero cuando se activa mediante el botón de la barra de navegación, otorga una textura táctil analógica que distingue este portfolio de cualquier plantilla genérica.</span>
      </div>
    </div>
  );
}
