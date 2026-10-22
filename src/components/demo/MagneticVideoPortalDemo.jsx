import React, { useState, useRef, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import './MagneticVideoPortalDemo.css';

const PROJECTS_PORTAL = [
  {
    id: 'salomon',
    num: '01',
    title: 'SALOMON EQUIPE',
    category: 'Commercial Action · Winter Sports',
    video: '/assets/Noruega/Video/norway-1080p.mp4',
    poster: '/assets/salomon/webp/portada.webp',
    client: 'Salomon Snowboards',
    year: '2026',
    color: '#ff3b30'
  },
  {
    id: 'norway',
    num: '02',
    title: 'NORWAY EXPEDITIONS',
    category: 'Cinematic Documentary · 4K Drone',
    video: '/assets/Noruega/Video/norway-1080p.mp4',
    poster: '/assets/Noruega/webp/_6M25407.webp',
    client: 'Nordic Travel Board',
    year: '2025',
    color: '#00e5ff'
  },
  {
    id: 'london',
    num: '03',
    title: 'LONDON STREET CULTURE',
    category: 'Editorial Fashion & Streetwear',
    video: '/assets/Noruega/Video/norway-1080p.mp4',
    poster: '/assets/london/webp/_6M25608.webp',
    client: 'Urban Vanguard',
    year: '2025',
    color: '#ff0055'
  },
  {
    id: 'tour',
    num: '04',
    title: 'PELOTON DYNAMICS',
    category: 'High-Velocity Sports Cinematography',
    video: '/assets/Noruega/Video/norway-1080p.mp4',
    poster: '/assets/tour-de-france/webp/_6M21261.webp',
    client: 'Tour de France / Sitges',
    year: '2024',
    color: '#ffcc00'
  }
];

export default function MagneticVideoPortalDemo() {
  const [activeProject, setActiveProject] = useState(null);
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Smooth spring physics for the floating portal
  const springConfig = { damping: 20, stiffness: 220, mass: 0.6 };
  const smoothX = useSpring(0, springConfig);
  const smoothY = useSpring(0, springConfig);

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setCursorPos({ x, y });
    smoothX.set(x);
    smoothY.set(y);
  };

  return (
    <div
      ref={containerRef}
      className="portal-demo-card"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setActiveProject(null)}
    >
      <div className="portal-header">
        <div className="portal-title-wrap">
          <div className="portal-tag-row">
            <span className="demo-badge modern-badge">VANGUARDIA DIGITAL 01</span>
            <span className="demo-badge luxury-badge">EDITORIAL / MODA</span>
          </div>
          <h3 className="demo-module-title">Portal de Vídeo Magnético & Tipografía Cinética</h3>
          <p className="demo-module-desc">
            Estética de estudio creativo internacional (Balenciaga, Studio Freight, Highsnobiety). Pasa el ratón por los titulares: un portal de vídeo 4K flotante sigue el cursor con inercia elástica fluida.
          </p>
        </div>
      </div>

      {/* Avant-Garde Project Rows List */}
      <div className="portal-list">
        {PROJECTS_PORTAL.map((proj) => {
          const isHovered = activeProject?.id === proj.id;
          return (
            <div
              key={proj.id}
              className={`portal-row ${isHovered ? 'active-row' : ''}`}
              onMouseEnter={() => setActiveProject(proj)}
            >
              <div className="portal-row-left">
                <span className="portal-num">{proj.num}</span>
                <span className="portal-title">{proj.title}</span>
              </div>
              <div className="portal-row-right">
                <span className="portal-cat">{proj.category}</span>
                <span className="portal-year">{proj.year}</span>
                <span className="portal-arrow">↗</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Magnetic Video Portal Window */}
      {activeProject && (
        <motion.div
          className="magnetic-floating-portal"
          style={{
            x: smoothX,
            y: smoothY,
          }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="portal-glass-bezel">
            <video
              src={activeProject.video}
              autoPlay
              loop
              muted
              playsInline
              className="portal-video-stream"
            />
            <div className="portal-overlay-tags">
              <span className="portal-live-dot" style={{ background: activeProject.color }} />
              <span className="portal-client-tag">{activeProject.client}</span>
              <span className="portal-fps-tag">4K 60FPS</span>
            </div>
          </div>
        </motion.div>
      )}

      <div className="portal-footer-note">
        <span>💡 <em>Impacto visual:</em> Transforma una lista de trabajos aburrida en un escaparate interactivo magnético donde el cliente previsualiza el metraje instantáneamente.</span>
      </div>
    </div>
  );
}
