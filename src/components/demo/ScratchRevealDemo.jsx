import React, { useState, useRef, useEffect } from 'react';
import './ScratchRevealDemo.css';

export default function ScratchRevealDemo() {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [isScratching, setIsScratching] = useState(false);
  const [revealedPct, setRevealedPct] = useState(0);

  // Initialize Canvas with Liquid Chrome / Silver Surface
  const initCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.globalCompositeOperation = 'source-over';

    // Rich metallic chrome gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#1c1c24');
    grad.addColorStop(0.3, '#3a3a48');
    grad.addColorStop(0.5, '#757588');
    grad.addColorStop(0.7, '#2a2a35');
    grad.addColorStop(1, '#111116');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative chrome typography stamp
    ctx.save();
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.textAlign = 'center';
    ctx.letterSpacing = '3px';
    ctx.fillText('IK® EXCLUSIVE ARCHIVE', w / 2, h / 2 - 20);

    ctx.font = '12px monospace';
    ctx.fillStyle = '#ff0055';
    ctx.fillText('RASCA AQUÍ CON EL RATÓN PARA DESCUBRIR', w / 2, h / 2 + 15);
    ctx.restore();

    setRevealedPct(0);
  };

  useEffect(() => {
    initCanvas();
  }, []);

  const scratch = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * canvas.width;
    const y = ((clientY - rect.top) / rect.height) * canvas.height;

    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 42, 0, Math.PI * 2, false);
    ctx.fill();

    setRevealedPct((prev) => Math.min(100, prev + 1.2));
  };

  const handleMouseDown = (e) => {
    setIsScratching(true);
    scratch(e.clientX, e.clientY);
  };

  const handleMouseMove = (e) => {
    if (!isScratching) return;
    scratch(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsScratching(false);
  };

  const handleTouchMove = (e) => {
    if (!e.touches[0]) return;
    scratch(e.touches[0].clientX, e.touches[0].clientY);
  };

  const revealAll = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setRevealedPct(100);
  };

  return (
    <div className="scratch-demo-card">
      <div className="scratch-header">
        <div className="scratch-title-wrap">
          <div className="deck-tag-row">
            <span className="demo-badge new-idea-badge">NUEVA IDEA 03</span>
            <span className="demo-badge play-badge">GAMIFICACIÓN DIRECTA</span>
          </div>
          <h3 className="demo-module-title">Rasca y Descubre Cromado (Scratch-to-Reveal)</h3>
          <p className="demo-module-desc">
            Interacción lúdica y táctil. Desliza el ratón sobre la capa de cromo líquido para rascarla en tiempo real y descubrir la toma secreta que se esconde debajo.
          </p>
        </div>

        <div className="scratch-controls-bar">
          <button
            type="button"
            className="scratch-btn"
            onClick={initCanvas}
          >
            ↺ Restaurar Cromo
          </button>
          <button
            type="button"
            className="scratch-btn highlight-btn"
            onClick={revealAll}
          >
            ★ Revelar Todo
          </button>
        </div>
      </div>

      {/* Main Photographic Scratch Container */}
      <div
        ref={containerRef}
        className="scratch-viewport"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={(e) => {
          if (e.touches[0]) scratch(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={handleTouchMove}
      >
        {/* Hidden Artwork Underneath */}
        <img
          src="/assets/london/webp/_6M25608.webp"
          alt="London Street Photography Artwork"
          className="scratch-under-img"
          draggable="false"
        />

        {/* Scratchable Metallic Chrome Canvas */}
        <canvas
          ref={canvasRef}
          width={800}
          height={500}
          className="scratch-canvas"
        />

        {/* Progress Bar Badge */}
        <div className="scratch-progress-badge">
          <div className="progress-fill" style={{ width: `${revealedPct}%` }} />
          <span className="progress-text">REVELADO: {Math.round(revealedPct)}%</span>
        </div>
      </div>

      <div className="scratch-footer-note">
        <span>💡 <em>Retención de usuario:</em> Convierte una foto en un mini-juego táctil irresistible que mantiene al visitante enganchado rascando la pantalla.</span>
      </div>
    </div>
  );
}
