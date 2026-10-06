import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundFx } from '../../utils/analogSound';
import './ShowreelModalDemo.css';

export default function ShowreelModalDemo() {
  const [isOpen, setIsOpen] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const videoRef = useRef(null);

  const openShowreel = () => {
    setIsOpen(true);
    soundFx.playShutter();
    setCountdown(3);
  };

  const closeShowreel = () => {
    setIsOpen(false);
    setCountdown(null);
    setIsPlaying(false);
    soundFx.playTactileClick();
  };

  // 3-2-1 Film Leader countdown effect
  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 1) {
      const timer = setTimeout(() => {
        setCountdown((c) => c - 1);
        soundFx.playTactileClick(0.8);
      }, 700);
      return () => clearTimeout(timer);
    } else if (countdown === 1) {
      const timer = setTimeout(() => {
        setCountdown(0);
        setIsPlaying(true);
        soundFx.playFilmAdvance();
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeShowreel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div className="showreel-demo-card">
      <div className="showreel-demo-header">
        <div className="showreel-title-wrap">
          <span className="demo-badge">MODO LAB 05</span>
          <h3 className="demo-module-title">Director's Showreel Mode (Pantalla Completa)</h3>
          <p className="demo-module-desc">
            Activación cinemática inmediata: apaga la interfaz general de la web y sumerge al visitante en un pase privado a pantalla completa en formato anamórfico 2.39:1 con cuenta atrás analógica.
          </p>
        </div>

        <div className="showreel-action-bar">
          <motion.button
            type="button"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="showreel-launch-btn"
            onClick={openShowreel}
          >
            <span className="launch-icon">▶</span>
            <span>LANZAR DIRECTOR'S CUT</span>
          </motion.button>
        </div>
      </div>

      <div className="showreel-teaser-preview">
        <div className="teaser-overlay">
          <div className="teaser-pill">PREVISUALIZACIÓN DE SALA</div>
          <span className="teaser-meta">4K HDR · 2.39:1 ANAMORPHIC SCOPE · DA VINCI GRADE</span>
        </div>
        <img
          src="/assets/Noruega/webp/_6M25158.webp"
          alt="Showreel preview"
          className="teaser-img"
        />
      </div>

      {/* Fullscreen Cinema Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="showreel-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            {/* Close Button Top Right */}
            <button
              type="button"
              className="showreel-close-btn"
              onClick={closeShowreel}
              title="Cerrar showreel (ESC)"
            >
              <span>✕</span> ESC CERRAR
            </button>

            {/* Countdown Film Leader Overlay */}
            {countdown !== null && countdown > 0 && (
              <div className="showreel-countdown-overlay">
                <div className="countdown-ring">
                  <span className="countdown-number">{countdown}</span>
                  <div className="countdown-scanner" />
                </div>
                <span className="countdown-tag">PREPARANDO BOBINA ANALÓGICA · 35MM</span>
              </div>
            )}

            {/* Anamorphic Scope Viewport */}
            <div className="showreel-cinema-viewport">
              <video
                ref={videoRef}
                src="/assets/Noruega/Video/Secuencia 01_2.mp4"
                playsInline
                muted={isMuted}
                loop
                className="showreel-video"
                onEnded={() => setIsPlaying(false)}
              />

              {/* Floating Minimal Controls */}
              <div className="showreel-floating-hud">
                <div className="hud-title-col">
                  <span className="hud-brand">IK® DIRECTOR'S CUT</span>
                  <span className="hud-film">NORWAY & EXPEDITIONS · 2024 SHOWREEL</span>
                </div>

                <div className="hud-actions-row">
                  <button
                    type="button"
                    className="hud-btn"
                    onClick={() => {
                      if (!videoRef.current) return;
                      if (videoRef.current.paused) {
                        videoRef.current.play();
                        setIsPlaying(true);
                      } else {
                        videoRef.current.pause();
                        setIsPlaying(false);
                      }
                      soundFx.playTactileClick();
                    }}
                  >
                    {isPlaying ? '⏸ PAUSA' : '▶ REANUDAR'}
                  </button>

                  <button
                    type="button"
                    className="hud-btn"
                    onClick={() => {
                      setIsMuted(!isMuted);
                      soundFx.playTactileClick();
                    }}
                  >
                    {isMuted ? '🔇 SILENCIO' : '🔊 AUDIO'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="showreel-footer-note">
        <span>💡 <em>Efecto WOW:</em> Pulsar el botón transporta al cliente a una sala de proyección privada, sin fricciones ni distracciones.</span>
      </div>
    </div>
  );
}
