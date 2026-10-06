import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import Footer from '../components/Footer';
import AvatarLab from '../components/AvatarLab';

export default function AvatarPage() {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div style={{ paddingTop: '7.5rem', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="container" style={{ flex: 1, paddingBottom: '5rem', width: '100%', minWidth: 0 }}>
          {/* Header editorial */}
          <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
              <Link
                to="/"
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.72rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: 'rgba(255,255,255,0.5)',
                  textDecoration: 'none',
                }}
              >
                ← PORTFOLIO / LAB
              </Link>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#ffffff',
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '0.2rem 0.6rem',
                  borderRadius: '4px',
                }}
              >
                IK® LAB · COMPAÑERO ARTÍSTICO PROCEDURAL
              </span>
            </div>

            <h1
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(2.2rem, 5vw, 3.8rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.05,
                color: '#ffffff',
                margin: '0 0 1rem 0',
                textTransform: 'uppercase',
              }}
            >
              El Creativo
            </h1>

            <p
              style={{
                fontFamily: 'var(--font-sans)',
                fontSize: '1.05rem',
                color: 'rgba(255, 255, 255, 0.68)',
                maxWidth: '680px',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              Un alter ego interactivo que encarna la mente del artista, director y fotógrafo. Formas geométricas esculturales adaptadas (auriculares de estudio, gorro de rodaje, siluetas contemporáneas), estados de pensamiento espontáneos y seguimiento de mirada sensible a tu cursor.
            </p>
          </div>

          {/* Estudio interactivo */}
          <AvatarLab size={280} />
        </div>

        <Footer />
      </div>
    </PageTransition>
  );
}
