import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Reveal, RevealItem } from './motion/Reveal';
import DrawLine from './DrawLine';
import './Footer.css';

export default function Footer() {
  const { dict } = useLanguage();

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <Reveal className="footer-content">
          <RevealItem as="h2">
            {dict.footer.title1}<br />{dict.footer.title2}
            <DrawLine trigger="inView" duration={550} delay={200} className="draw-line--accent" />
          </RevealItem>

          <RevealItem className="footer-links">
            <a href="mailto:ikeraugusto2412@gmail.com" className="footer-link">
              <span className="footer-link-text">ikeraugusto2412@gmail.com</span>
              <span className="footer-link-arrow">→</span>
            </a>
            <a href="https://www.instagram.com/ikeraugusto_ph/" target="_blank" rel="noopener noreferrer" className="footer-link">
              <span className="footer-link-text">Instagram</span>
              <span className="footer-link-arrow">→</span>
            </a>
          </RevealItem>
        </Reveal>
      </div>

      {/* Editorial bottom bar — Untitled Film style */}
      <div className="footer-editorial-bar">
        <span className="footer-bar-copy">©{new Date().getFullYear()} {dict.footer.rights} | "IKER AUGUSTO."</span>
        <span className="footer-bar-center">{dict.footer.photoFilm}</span>
        <span className="footer-bar-location">{dict.footer.location}</span>
      </div>
    </footer>
  );
}
