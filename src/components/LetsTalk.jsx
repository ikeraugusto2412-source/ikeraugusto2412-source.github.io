import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useSpring } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { splitLang } from '../lib/i18nPath';
import { playSound } from '../audio/sound';
import './LetsTalk.css';

/*
 * Floating "let's talk" button (after noth.in): a round button with a spinning ring of text
 * that follows the page once you have scrolled a little, leans towards the mouse, and opens a
 * small menu with email, Instagram and the contact page. It steps aside on the contact page,
 * over the footer (which has the same links) and while the menu or a lightbox is open.
 */
const EMAIL = 'ikeraugusto2412@gmail.com';
const INSTAGRAM = 'https://www.instagram.com/ikeraugusto_ph/';

export default function LetsTalk() {
  const { dict, localePath } = useLanguage();
  const t = dict.letsTalk;
  const { pathname } = useLocation();
  const onContact = splitLang(pathname).path === '/contact';
  const [scrolled, setScrolled] = useState(false);
  const [overFooter, setOverFooter] = useState(false);
  const [locked, setLocked] = useState(false);
  const [open, setOpen] = useState(false);
  const x = useSpring(0, { stiffness: 220, damping: 16 });
  const y = useSpring(0, { stiffness: 220, damping: 16 });

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.6);
      const footer = document.querySelector('footer.footer');
      setOverFooter(Boolean(footer) && footer.getBoundingClientRect().top < window.innerHeight * 0.85);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [pathname]);

  useEffect(() => {
    const onLock = (e) => setLocked(Boolean(e.detail?.locked));
    window.addEventListener('scrolllockchange', onLock);
    return () => window.removeEventListener('scrolllockchange', onLock);
  }, []);

  // A new page starts with the menu closed
  const [openFor, setOpenFor] = useState(pathname);
  if (openFor !== pathname) {
    setOpenFor(pathname);
    setOpen(false);
  }

  const visible = scrolled && !overFooter && !locked && !onContact;

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const ring = `${t.ring} · ${t.ring} · ${t.ring} · `;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="lets-talk"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        >
          <AnimatePresence>
            {open && (
              <motion.nav
                className="lets-talk-menu"
                aria-label={t.ring}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                <a href={`mailto:${EMAIL}`}>{t.email}<span aria-hidden="true">↗</span></a>
                <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer">Instagram<span aria-hidden="true">↗</span></a>
                <Link to={localePath('/contact')}>{t.form}<span aria-hidden="true">→</span></Link>
              </motion.nav>
            )}
          </AnimatePresence>
          <motion.button
            type="button"
            className={`lets-talk-btn ${open ? 'is-open' : ''}`}
            style={{ x, y }}
            onPointerMove={(e) => {
              if (e.pointerType !== 'mouse') return;
              const r = e.currentTarget.getBoundingClientRect();
              x.set((e.clientX - r.left - r.width / 2) * 0.3);
              y.set((e.clientY - r.top - r.height / 2) * 0.3);
            }}
            onPointerLeave={() => {
              x.set(0);
              y.set(0);
            }}
            onClick={() => {
              playSound('click');
              setOpen((v) => !v);
            }}
            aria-expanded={open}
            aria-label={open ? t.close : t.ring}
          >
            <svg viewBox="0 0 100 100" className="lets-talk-ring" aria-hidden="true">
              <defs>
                <path id="lets-talk-circle" d="M50,50 m-37,0 a37,37 0 1,1 74,0 a37,37 0 1,1 -74,0" />
              </defs>
              <text>
                <textPath href="#lets-talk-circle" textLength="232">{ring}</textPath>
              </text>
            </svg>
            <span className="lets-talk-core" aria-hidden="true">{open ? '×' : '✉'}</span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
