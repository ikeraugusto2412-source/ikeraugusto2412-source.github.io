import { motion, AnimatePresence, useMotionValue, animate } from 'framer-motion';
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import AppleSwitch from './AppleSwitch';
import { sileo } from 'sileo';
import DrawLine from './DrawLine';
import useScrollLock from '../hooks/useScrollLock';
import { pressable } from './motion/pressable';
import './Navbar.css';

/* ── Live clock ── */
function useLiveClock() {
  const [time, setTime] = useState(() =>
    new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  );
  useEffect(() => {
    const id = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

/* ── Overlay fade ── */
const overlayVariants = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit:    { opacity: 0, transition: { duration: 0.3, ease: [0.7, 0, 1, 1] } },
};

/* ── Each item clips up from below ── */
const clipVariants = {
  hidden:  { y: '110%' },
  visible: (i) => ({
    y: '0%',
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.05 + i * 0.08 },
  }),
  exit: (i) => ({
    y: '110%',
    transition: { duration: 0.4, ease: [0.7, 0, 1, 1], delay: (4 - 1 - i) * 0.04 },
  }),
};

export default function Navbar() {
  const { language, setLanguage, dict } = useLanguage();
  const [menuOpen, setMenuOpen]     = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(null);
  const clock    = useLiveClock();
  const navigate = useNavigate();

  const navItems = [
    { num: '01', label: dict.nav.home,    href: '/'        },
    { num: '02', label: dict.nav.work,    href: '/works'   },
    { num: '03', label: dict.nav.about,   href: '/about'   },
    { num: '04', label: dict.nav.contact, href: '/contact' },
  ];

  /* GMT offset: e.g. "GMT+2", "GMT-5", "GMT+5:30" */
  const tzLabel = (() => {
    const offset  = -new Date().getTimezoneOffset(); // minutes
    const sign    = offset >= 0 ? '+' : '-';
    const absH    = Math.floor(Math.abs(offset) / 60);
    const absM    = Math.abs(offset) % 60;
    return `GMT${sign}${absH}${absM ? `:${String(absM).padStart(2, '0')}` : ''}`;
  })();

  /* Refs for each nav item to measure vertical position */
  const itemRefs = useRef([]);

  /* Motion values for arrow Y position (percentage from top of viewport) */
  const arrowY = useMotionValue('50%');


  /* Lock page scroll while the overlay is open (released on close and on unmount) */
  useScrollLock(menuOpen);

  /* When hoveredIdx changes, move arrows to that item's vertical center */
  useEffect(() => {
    if (hoveredIdx === null) return;
    const el = itemRefs.current[hoveredIdx];
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const itemCenterY = rect.top + rect.height / 2;
    const pct = (itemCenterY / window.innerHeight) * 100;

    animate(arrowY, `${pct}%`, {
      duration: 0.45,
      ease: [0.16, 1, 0.3, 1],
    });
  }, [hoveredIdx, arrowY]);

  /* Navigate and close */
  const handleNavClick = (href) => {
    setMenuOpen(false);
    setHoveredIdx(null);
    setTimeout(() => {
      if (href.startsWith('/#')) {
        const id = href.slice(2);
        if (window.location.pathname !== '/') {
          navigate('/');
          setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 400);
        } else {
          document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        navigate(href);
      }
    }, 100);
  };

  /* Arrow click → navigate to hovered item */
  const handleArrowClick = () => {
    if (hoveredIdx !== null) handleNavClick(navItems[hoveredIdx].href);
  };

  const showArrows = hoveredIdx !== null;

  return (
    <>
      {/* ── Top bar ── */}
      <motion.nav
        className="navbar"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
      >
        <div className="navbar-container">
          <motion.button className="brand" onClick={() => handleNavClick('/')} {...pressable}>
            <span className="logo-text">"Ik."</span>
          </motion.button>

          <div className="navbar-clock">
            <span className="clock-time">{clock}</span>
            <span className="clock-tz">({tzLabel})</span>
          </div>

          <div className="navbar-right">
            <motion.button className="nav-cta desktop-only has-draw-line" onClick={() => handleNavClick('/works')} {...pressable}>
              {dict.nav.viewWork}
              <DrawLine trigger="hover" duration={320} />
            </motion.button>

            {/* Apple iOS Switch (Medium · Apple Green) for Language */}
            <div className="navbar-apple-switch-wrap" role="group" aria-label="Selector de idioma">
              <button
                type="button"
                className={`nav-switch-lang-label ${language === 'es' ? 'is-active' : ''}`}
                data-sound="none"
                onClick={() => {
                  if (language !== 'es') {
                    setLanguage('es');
                    sileo.info({ title: 'Idioma cambiado', description: 'Navegando en Español' });
                  }
                }}
                title="Cambiar a Español"
              >
                ES
              </button>
              <AppleSwitch
                size="md"
                tone="neutral"
                checked={language === 'en'}
                onCheckedChange={(checked) => {
                  const next = checked ? 'en' : 'es';
                  setLanguage(next);
                  sileo.info({
                    title: next === 'en' ? 'Language changed' : 'Idioma cambiado',
                    description: next === 'en' ? 'Now browsing in English' : 'Navegando en Español',
                  });
                }}
                aria-label="Cambiar idioma entre español e inglés"
              />
              <button
                type="button"
                className={`nav-switch-lang-label ${language === 'en' ? 'is-active' : ''}`}
                data-sound="none"
                onClick={() => {
                  if (language !== 'en') {
                    setLanguage('en');
                    sileo.info({ title: 'Language changed', description: 'Now browsing in English' });
                  }
                }}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            <motion.button
              id="nav-menu-toggle"
              className={`menu-toggle ${menuOpen ? 'open' : ''}`}
              data-sound={menuOpen ? 'menu-close' : 'menu-open'}
              onClick={() => { setMenuOpen(p => !p); setHoveredIdx(null); }}
              aria-label={menuOpen ? dict.nav.close : dict.nav.menu}
              aria-expanded={menuOpen}
              {...pressable}
            >
              <span className="menu-toggle-label">{menuOpen ? dict.nav.close : dict.nav.menu}</span>
              <span className="menu-toggle-icon"><span /><span /><span /></span>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* ── Full-screen overlay ── */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="bignav-overlay"
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
          >
            <div className="bignav-glow" aria-hidden="true" />
            <div className="bignav-grain" aria-hidden="true" />

            {/* LEFT arrow ▶ — follows hovered item vertically */}
            <AnimatePresence>
              {showArrows && (
                <motion.button
                  key="arrow-left"
                  className="bignav-arrow bignav-arrow--left"
                  style={{ top: arrowY, translateY: '-50%' }}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleArrowClick}
                  aria-label="Navegar"
                >
                  ▶
                </motion.button>
              )}
            </AnimatePresence>

            {/* RIGHT arrow ◀ — follows hovered item vertically */}
            <AnimatePresence>
              {showArrows && (
                <motion.button
                  key="arrow-right"
                  className="bignav-arrow bignav-arrow--right"
                  style={{ top: arrowY, translateY: '-50%' }}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 30 }}
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleArrowClick}
                  aria-label="Navegar"
                >
                  ◀
                </motion.button>
              )}
            </AnimatePresence>

            {/* Nav items — centered */}
            <nav className="bignav-inner">
              <ul
                className="bignav-list"
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {navItems.map(({ num, label, href }, i) => {
                  const isDimmed = hoveredIdx !== null && hoveredIdx !== i;

                  return (
                    <li
                      key={num}
                      className="bignav-item"
                      ref={el => { itemRefs.current[i] = el; }}
                    >
                      <div className="bignav-clip">
                        <motion.div
                          custom={i}
                          variants={clipVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                        >
                          <button
                            className={`bignav-link ${isDimmed ? 'is-dimmed' : ''}`}
                            onMouseEnter={() => setHoveredIdx(i)}
                            onClick={() => handleNavClick(href)}
                          >
                            <span className="bignav-num">[{num}]</span>
                            <span className="bignav-label has-draw-line">
                              {label}
                              <DrawLine trigger="hover" duration={450} strokeWidth={2} />
                            </span>
                          </button>
                        </motion.div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Footer */}
            <div className="bignav-footer">
              <span>{dict.nav.location}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
