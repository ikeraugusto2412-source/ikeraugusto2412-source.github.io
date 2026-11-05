import React, { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { Reveal, RevealItem } from './motion/Reveal';
import DrawLine from './DrawLine';
import './Footer.css';

/*
 * "LET'S CREATE / TOGETHER." rises letter by letter as the footer scrolls in
 * (after the "SAY HELLO." on daikifujita.com).
 */
function RisingLetter({ ch, start, progress }) {
  const y = useTransform(progress, [start, start + 0.22], ['105%', '0%']);
  return (
    <span className="footer-letter">
      <motion.span style={{ y }}>{ch === ' ' ? '\u00a0' : ch}</motion.span>
    </span>
  );
}

function RisingTitle({ lines }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] });
  const total = lines.join('').length;
  let index = 0;
  return (
    <span ref={ref} className="footer-title-rise" aria-hidden="true">
      {lines.map((line, l) => (
        <span key={l} className="footer-title-line">
          {[...line].map((ch, i) => {
            const start = reduceMotion ? -1 : (index++ / total) * 0.55;
            return <RisingLetter key={i} ch={ch} start={start} progress={scrollYProgress} />;
          })}
        </span>
      ))}
    </span>
  );
}

export default function Footer() {
  const { dict } = useLanguage();

  return (
    <footer id="contact" className="footer">
      <div className="container">
        <Reveal className="footer-content">
          <RevealItem as="h2" aria-label={`${dict.footer.title1} ${dict.footer.title2}`}>
            <RisingTitle key={dict.footer.title1} lines={[dict.footer.title1, dict.footer.title2]} />
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
