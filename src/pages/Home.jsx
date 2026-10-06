import React, { useEffect } from 'react';
import PageTransition from '../components/PageTransition';
import PlaybookHero from '../components/PlaybookHero';
import useScrollLock from '../hooks/useScrollLock';

export default function Home() {
  // Lock vertical scrolling on home so wheel/swipe exclusively drives the gallery
  useScrollLock(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PageTransition>
      <div style={{ width: '100%', height: '100dvh', overflow: 'hidden' }}>
        <PlaybookHero />
      </div>
    </PageTransition>
  );
}
