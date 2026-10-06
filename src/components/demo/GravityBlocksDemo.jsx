import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import './GravityBlocksDemo.css';

const LETTER_BLOCKS = [
  { id: 1, letter: 'I', color: '#00e5ff', bg: '#0b2b33', x: -180, y: 120, rot: -10 },
  { id: 2, letter: 'K', color: '#ff0055', bg: '#330816', x: -60,  y: 130, rot: 15 },
  { id: 3, letter: 'E', color: '#ffcc00', bg: '#332b00', x: 60,   y: 110, rot: -8 },
  { id: 4, letter: 'R', color: '#30d158', bg: '#082b13', x: 180,  y: 140, rot: 12 },
  { id: 5, letter: '®', color: '#ffffff', bg: '#22222a', x: 260,  y: 80,  rot: -5 },
  { id: 6, letter: '4K', color: '#ff3b30', bg: '#33100c', x: -120, y: -40, rot: 25 },
  { id: 7, letter: 'DIR', color: '#a855f7', bg: '#260e3b', x: 100, y: -30, rot: -18 },
];

export default function GravityBlocksDemo() {
  const containerRef = useRef(null);
  const [blocks, setBlocks] = useState(LETTER_BLOCKS);
  const [isZeroGravity, setIsZeroGravity] = useState(false);

  const dropWithGravity = () => {
    setIsZeroGravity(false);
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        y: 120 + Math.random() * 40,
        x: b.x + (Math.random() - 0.5) * 60,
        rot: (Math.random() - 0.5) * 35,
      }))
    );
  };

  const zeroGravity = () => {
    setIsZeroGravity(true);
    setBlocks((prev) =>
      prev.map((b) => ({
        ...b,
        y: -120 - Math.random() * 60,
        x: b.x + (Math.random() - 0.5) * 80,
        rot: (Math.random() - 0.5) * 60,
      }))
    );
  };

  const alignName = () => {
    setIsZeroGravity(false);
    setBlocks([
      { id: 1, letter: 'I', color: '#00e5ff', bg: '#0b2b33', x: -150, y: 50, rot: 0 },
      { id: 2, letter: 'K', color: '#ff0055', bg: '#330816', x: -75,  y: 50, rot: 0 },
      { id: 3, letter: 'E', color: '#ffcc00', bg: '#332b00', x: 0,    y: 50, rot: 0 },
      { id: 4, letter: 'R', color: '#30d158', bg: '#082b13', x: 75,   y: 50, rot: 0 },
      { id: 5, letter: '®', color: '#ffffff', bg: '#22222a', x: 145,  y: 50, rot: 0 },
      { id: 6, letter: '4K', color: '#ff3b30', bg: '#33100c', x: -75, y: -50, rot: 0 },
      { id: 7, letter: 'DIR', color: '#a855f7', bg: '#260e3b', x: 75,  y: -50, rot: 0 },
    ]);
  };

  return (
    <div className="gravity-demo-card">
      <div className="gravity-header">
        <div className="gravity-title-wrap">
          <div className="deck-tag-row">
            <span className="demo-badge new-idea-badge">NUEVA IDEA 04</span>
            <span className="demo-badge kinetic-badge">GRAVEDAD & FÍSICA</span>
          </div>
          <h3 className="demo-module-title">Bloques Tipográficos con Gravedad y Colisión</h3>
          <p className="demo-module-desc">
            Bloques tridimensionales táctiles de tu marca. Agárralos, lánzalos contra las paredes del contenedor o pulsa para activar la gravedad cero y verlos flotar ingrávidos por el espacio.
          </p>
        </div>

        <div className="gravity-controls-bar">
          <button
            type="button"
            className="gravity-btn"
            onClick={dropWithGravity}
          >
            ⬇ Caída con Gravedad
          </button>
          <button
            type="button"
            className="gravity-btn"
            onClick={zeroGravity}
          >
            🚀 Gravedad Cero
          </button>
          <button
            type="button"
            className="gravity-btn"
            onClick={alignName}
          >
            🔤 Alinear 'IKER'
          </button>
        </div>
      </div>

      {/* Physics Chamber */}
      <div ref={containerRef} className="gravity-chamber">
        <div className="chamber-grid" />
        <div className="chamber-watermark">IKER AUGUSTO</div>

        {blocks.map((b) => (
          <motion.div
            key={b.id}
            drag
            dragConstraints={containerRef}
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 450, bounceDamping: 18 }}
            whileDrag={{ scale: 1.15, zIndex: 100, cursor: 'grabbing' }}
            whileHover={{ scale: 1.08 }}
            animate={{
              x: b.x,
              y: b.y,
              rotate: b.rot,
            }}
            transition={{ type: 'spring', damping: 16, stiffness: 180 }}
            className="physics-letter-block"
            style={{
              color: b.color,
              backgroundColor: b.bg,
              borderColor: b.color,
              boxShadow: `0 15px 30px rgba(0, 0, 0, 0.7), 0 0 20px ${b.color}33`,
            }}
          >
            <span className="block-letter">{b.letter}</span>
            <div className="block-3d-bevel" />
          </motion.div>
        ))}

        <div className="chamber-ground">
          <span>SUELO DE COLISIÓN FÍSICA</span>
        </div>
      </div>

      <div className="gravity-footer-note">
        <span>💡 <em>Vanguardia lúdica:</em> Aporta al portfolio una energía y carácter interactivo brutal que ninguna web tradicional tiene.</span>
      </div>
    </div>
  );
}
