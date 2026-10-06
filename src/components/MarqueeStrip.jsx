import React from 'react';
import './MarqueeStrip.css';

const WORDS = [
  'PHOTOGRAPHY', 'FILMMAKER', 'SPORT', 'IKER AUGUSTO',
  'PORTRAIT', 'STREET', 'DOCUMENTARY', 'CINEMATIC',
  'PHOTOGRAPHY', 'FILMMAKER', 'SPORT', 'IKER AUGUSTO',
  'PORTRAIT', 'STREET', 'DOCUMENTARY', 'CINEMATIC',
];

export default function MarqueeStrip() {
  return (
    <div className="marquee-strip" aria-hidden="true">
      <div className="marquee-track">
        {WORDS.map((word, i) => (
          <span key={i} className="marquee-word">
            {word} <span className="marquee-dot">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}
