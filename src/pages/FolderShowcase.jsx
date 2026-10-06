import React from 'react';
import Folder from '../components/Folder';
import useFolderSize from '../hooks/useFolderSize';
import PageTransition from '../components/PageTransition';

export default function FolderShowcase() {
  const folderSize = useFolderSize();
  const photoItems = [
    {
      image: '/assets/tour-de-france/webp/_6M21261.webp',
      title: 'Tour de France',
      tag: 'Sports',
    },
    {
      image: '/assets/salomon/webp/portada.webp',
      title: 'Huck Knife Pro',
      tag: 'Commercial',
    },
    {
      image: '/assets/london/webp/foto portada 2.webp',
      title: 'London 35mm',
      tag: 'Street',
    },
  ];

  return (
    <PageTransition>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#000000',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '120px 20px 80px',
          boxSizing: 'border-box',
          fontFamily: "var(--font-sans)",
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              color: '#888888',
              display: 'block',
              marginBottom: '10px',
            }}
          >
            Interactive 3D Component
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 5vw, 64px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              margin: '0 0 16px',
            }}
          >
            ARCHIVAL FOLDER
          </h1>
          <p style={{ color: '#999999', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
            Pasa el cursor por encima para abrir las tarjetas en abanico (<em>fan out</em>). Haz click para levantar la solapa 3D.
          </p>
        </div>

        {/* Main Folder with Photography Slides */}
        <div
          id="showcase-main-folder"
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '420px',
            marginBottom: '40px',
          }}
        >
          <Folder color="black" size={folderSize} items={photoItems} />
        </div>

        {/* Secondary Standard Folders Showcase */}
        <div
          style={{
            display: 'flex',
            gap: '60px',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginTop: '40px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666', marginBottom: '12px', display: 'block' }}>
              BLACK THEME (DEFAULT)
            </span>
            <Folder color="black" size="md" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666', marginBottom: '12px', display: 'block' }}>
              WHITE THEME
            </span>
            <Folder color="white" size="md" />
          </div>

          <div style={{ textAlign: 'center' }}>
            <span style={{ fontSize: '11px', color: '#666', marginBottom: '12px', display: 'block' }}>
              BLUE THEME
            </span>
            <Folder color="blue" size="md" />
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
