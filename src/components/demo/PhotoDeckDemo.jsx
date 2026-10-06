import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './PhotoDeckDemo.css';

const INITIAL_PHOTOS = [
  {
    id: 1,
    url: '/assets/salomon/webp/portada.webp',
    title: 'Salomon Huck Knife Freestyle',
    tag: 'SALOMON 01',
    x: 0,
    y: 0,
    rot: -6,
  },
  {
    id: 2,
    url: '/assets/Noruega/webp/_6M25407.webp',
    title: 'Norway Fjord Horizon',
    tag: 'NORWAY 4K',
    x: 30,
    y: 15,
    rot: 8,
  },
  {
    id: 3,
    url: '/assets/london/webp/_6M25608.webp',
    title: 'London Underground Night',
    tag: 'LONDON STREET',
    x: -25,
    y: 25,
    rot: -12,
  },
  {
    id: 4,
    url: '/assets/tour-de-france/webp/_6M21261.webp',
    title: 'Peloton High Velocity',
    tag: 'TOUR SITGES',
    x: 45,
    y: -20,
    rot: 5,
  },
  {
    id: 5,
    url: '/assets/salomon/webp/_6M20776.webp',
    title: 'Powder Snow Spray',
    tag: 'EQUIPE ACTION',
    x: -15,
    y: -35,
    rot: -3,
  },
];

export default function PhotoDeckDemo() {
  const containerRef = useRef(null);
  const [layoutMode, setLayoutMode] = useState('scatter'); // 'scatter' | 'stack' | 'grid'
  const [photos, setPhotos] = useState(INITIAL_PHOTOS);
  const [topId, setTopId] = useState(5);

  const shufflePhotos = () => {
    setLayoutMode('scatter');
    setPhotos((prev) =>
      prev.map((p) => ({
        ...p,
        x: (Math.random() - 0.5) * 380,
        y: (Math.random() - 0.5) * 160,
        rot: (Math.random() - 0.5) * 30,
      }))
    );
  };

  const stackPhotos = () => {
    setLayoutMode('stack');
    setPhotos((prev) =>
      prev.map((p, idx) => ({
        ...p,
        x: (idx - 2) * 8,
        y: (idx - 2) * 6,
        rot: (idx - 2) * 4,
      }))
    );
  };

  const bringToFront = (id) => {
    setTopId(id);
  };

  return (
    <div className="photodeck-demo-card">
      <div className="photodeck-header">
        <div className="photodeck-title-wrap">
          <div className="deck-tag-row">
            <span className="demo-badge new-idea-badge">NUEVA IDEA 01</span>
            <span className="demo-badge tactile-badge">FÍSICA TÁCTIL</span>
          </div>
          <h3 className="demo-module-title">Mazo de Fotos Desparramables con Inercia</h3>
          <p className="demo-module-desc">
            Fotografías tratadas como impresiones físicas con borde editorial y cinta adhesiva. Agárralas, arrástralas por la mesa y lánzalas con inercia para descubrir la foto que hay debajo.
          </p>
        </div>

        <div className="deck-controls-bar">
          <button
            type="button"
            className="deck-btn"
            onClick={shufflePhotos}
          >
            🔀 Desparramar Fotos
          </button>
          <button
            type="button"
            className="deck-btn"
            onClick={stackPhotos}
          >
            📚 Apilar en Mazo
          </button>
        </div>
      </div>

      {/* Physics Table Stage */}
      <div ref={containerRef} className="photodeck-table-stage">
        <div className="table-watermark">IKER AUGUSTO · ARCHIVE DECK</div>

        {photos.map((item) => {
          const isTop = topId === item.id;
          return (
            <motion.div
              key={item.id}
              drag
              dragConstraints={containerRef}
              dragElastic={0.25}
              dragTransition={{ bounceStiffness: 400, bounceDamping: 25 }}
              whileDrag={{ scale: 1.08, cursor: 'grabbing', zIndex: 999 }}
              whileHover={{ scale: 1.03 }}
              onMouseDown={() => bringToFront(item.id)}
              onTouchStart={() => bringToFront(item.id)}
              animate={{
                x: item.x,
                y: item.y,
                rotate: item.rot,
                zIndex: isTop ? 100 : item.id,
              }}
              transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              className="draggable-photo-card"
            >
              {/* Scotch Tape Accent */}
              <div className="scotch-tape" />

              <div className="photo-card-inner">
                <img src={item.url} alt={item.title} className="photo-card-img" draggable="false" />
                <div className="photo-card-caption">
                  <span className="caption-tag">{item.tag}</span>
                  <span className="caption-title">{item.title}</span>
                </div>
              </div>
            </motion.div>
          );
        })}

        <div className="photodeck-prompt">
          <span>ARRASTRA, LANZA O REORDENA CUALQUIER FOTO</span>
        </div>
      </div>

      <div className="photodeck-footer-note">
        <span>💡 <em>Sensación física:</em> Igual que en el Sandbox de stickers que te ha gustado, aquí puedes jugar a desparramar y tirar las fotografías por la pantalla como en una mesa de trabajo real.</span>
      </div>
    </div>
  );
}
