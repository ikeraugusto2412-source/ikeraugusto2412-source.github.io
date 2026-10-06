import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import './PhysicsStickersDemo.css';

const INITIAL_STICKERS = [
  { id: 1, text: 'IK® 2026 OFFICIAL', type: 'badge-neon', x: 40, y: 50, rot: -8 },
  { id: 2, text: 'SALOMON ACTION', type: 'badge-pill', x: 260, y: 70, rot: 12 },
  { id: 3, text: '4K CINEMA / LOG-C', type: 'badge-hologram', x: 120, y: 190, rot: 5 },
  { id: 4, text: 'BARCELONA STUDIO', type: 'badge-stamp', x: 480, y: 60, rot: -15 },
  { id: 5, text: 'DIRECTOR OF PHOTOGRAPHY', type: 'badge-pill-dark', x: 340, y: 220, rot: -4 },
  { id: 6, text: '⚠ DO NOT CROSS · FILMING SET', type: 'badge-tape', x: 80, y: 320, rot: 3 },
  { id: 7, text: 'DA VINCI RESOLVE GRADE', type: 'badge-gold', x: 460, y: 310, rot: 10 },
];

export default function PhysicsStickersDemo() {
  const constraintsRef = useRef(null);
  const [resetKey, setResetKey] = useState(0);

  const resetStickers = () => {
    setResetKey((prev) => prev + 1);
  };

  return (
    <div className="physics-demo-card">
      <div className="physics-demo-header">
        <div className="physics-title-wrap">
          <div className="portal-tag-row">
            <span className="demo-badge modern-badge">VANGUARDIA DIGITAL 04</span>
            <span className="demo-badge fun-badge">PLAYGROUND INTERACTIVO</span>
          </div>
          <h3 className="demo-module-title">Sandbox de Stickers & Sellos Gráficos con Física</h3>
          <p className="demo-module-desc">
            Estética de estudio creativo de vanguardia (MSCHF, Studio Dumbar, Cactus Jack). Agarra, arrastra y lanza los sellos gráficos por la pantalla. Cuentan con inercia, rotación dinámica y elasticidad.
          </p>
        </div>

        <button
          type="button"
          className="physics-reset-btn"
          onClick={resetStickers}
        >
          ↺ Esparcir Stickers
        </button>
      </div>

      {/* Physics Interactive Bounds Stage */}
      <div ref={constraintsRef} className="physics-stage" key={resetKey}>
        <div className="physics-watermark">IKER AUGUSTO · CREATIVE DIRECTION</div>

        {INITIAL_STICKERS.map((stk) => (
          <motion.div
            key={stk.id}
            drag
            dragConstraints={constraintsRef}
            dragElastic={0.2}
            dragTransition={{ bounceStiffness: 400, bounceDamping: 20 }}
            whileDrag={{ scale: 1.15, zIndex: 100, cursor: 'grabbing' }}
            whileHover={{ scale: 1.05 }}
            initial={{ x: stk.x, y: stk.y, rotate: stk.rot, opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`draggable-sticker ${stk.type}`}
          >
            <span>{stk.text}</span>
            <div className="sticker-peel" />
          </motion.div>
        ))}

        <div className="physics-stage-prompt">
          <span>TOCA, ARRASTRA Y LANZA CUALQUIER STICKER</span>
        </div>
      </div>

      <div className="physics-footer-note">
        <span>💡 <em>Personalidad de marca:</em> Este tipo de interactividad desenfadada y dinámica transmite inmediatamente al cliente que eres un creador contemporáneo sin miedo a innovar.</span>
      </div>
    </div>
  );
}
