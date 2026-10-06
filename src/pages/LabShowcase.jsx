import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import SideBySideShowcase from '../components/demo/SideBySideShowcase';
import PhysicsStickersDemo from '../components/demo/PhysicsStickersDemo';
import './LabShowcase.css';

export default function LabShowcase() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <motion.main
      className="lab-page-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Hero Header */}
      <section className="lab-hero container">
        <div className="lab-hero-top">
          <span className="lab-tag">IK® CREATIVE LAB · SELECCIÓN FINAL</span>
          <div className="lab-safety-pill">
            <span className="safety-dot" /> Entorno 100% aislado · Web oficial protegida
          </div>
        </div>

        <h1 className="lab-title">Tus Dos Elecciones Favoritas</h1>
        <p className="lab-subtitle">
          Filtrado exclusivo con los dos únicos componentes que has seleccionado para tu portfolio: el nuevo comparador <strong>Side By Side Slide</strong> de Léo (@unlumen-ui) con física de resorte (*spring physics*), y el <strong>Sandbox de Stickers & Sellos Gráficos</strong> con física de inercia y rebote.
        </p>

        {/* Quick Nav Anchor Pills */}
        <div className="lab-anchors-row">
          <a href="#slider" className="lab-anchor-pill highlight-pill">01. Side By Side Slide (Léo)</a>
          <a href="#stickers" className="lab-anchor-pill highlight-pill">02. Sandbox de Stickers con Física</a>
          <Link to="/avatar" className="lab-anchor-pill highlight-pill">03. El Creativo (Avatar Lab)</Link>
        </div>
      </section>

      {/* Modules Stack */}
      <div className="lab-modules-stack container">
        {/* Component 1: Side By Side Slide by Léo (@unlumen-ui/side-by-side-slide) */}
        <section id="slider" className="lab-section">
          <SideBySideShowcase />
        </section>

        {/* Component 2: Physics Stickers Sandbox */}
        <section id="stickers" className="lab-section">
          <PhysicsStickersDemo />
        </section>

        {/* Feedback Callout Banner */}
        <div className="lab-feedback-banner">
          <div className="feedback-content">
            <span className="feedback-badge">LISTOS PARA PRODUCCIÓN</span>
            <h2 className="feedback-title">¿Pasamos estos dos componentes a tu web oficial?</h2>
            <p className="feedback-desc">
              El <strong>Side By Side Slide</strong> con física de resortes ya está implementado con el componente oficial de Léo y listo para integrarse en la página de proyectos (como en Salomon o Noruega), y el <strong>Sandbox de Stickers</strong> para enriquecer tu sección About o Works con máxima interacción.
            </p>
          </div>
          <div className="feedback-actions">
            <Link to="/" className="feedback-link-home">
              ← Volver al Inicio
            </Link>
            <Link to="/works" className="feedback-link-works">
              Ver Trabajos →
            </Link>
          </div>
        </div>
      </div>
    </motion.main>
  );
}
