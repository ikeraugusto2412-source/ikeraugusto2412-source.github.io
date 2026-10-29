import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '@bible-strong/avatar-react';
import '@bible-strong/avatar-react/styles.css';
import contactBlobDefinition from '../data/contact-blob.avatar.json';
import { playSound } from '../audio/sound';
import { useLanguage } from '../context/LanguageContext';
import './ContactSphereCompanion.css';

/**
 * ContactSphereCompanion
 * Una bola negra procedural interactiva (inspirada en @adrien.ninet / Bible Strong Avatar)
 * que reacciona en tiempo real a los campos del formulario de contacto.
 * Ubicada en el lateral izquierdo, grande y con seguimiento activo hacia el formulario.
 */
const fill = (text, values) => text.replace(/\{(\w+)\}/g, (_, k) => values[k] ?? '');

/**
 * What the sphere says and does for the current form state — derived on every render,
 * so it always matches the form and the active language.
 * Returns { text, animation } or { text, expression }.
 */
function reactionFor({ focusedField, formData, submitted }, c) {
  if (submitted === 'sent') {
    return { animation: 'celebrate', text: formData.name ? fill(c.sentNamed, { name: formData.name }) : c.sent };
  }
  if (submitted === 'mailto') return { animation: 'celebrate', text: c.mailto };

  switch (focusedField) {
    case 'name': {
      const name = formData.name.trim();
      if (name.length > 2) return { animation: 'happy', text: fill(c.nameGreat, { name }) };
      if (name.length > 0) return { expression: 'playful-right', text: c.nameTyping };
      return { expression: 'far-right-glance', text: c.nameAsk };
    }
    case 'email': {
      const email = formData.email.trim();
      if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { animation: 'proud', text: c.emailValid };
      if (email.includes('@')) return { expression: 'joyful-down-right', text: c.emailDomain };
      if (email.length > 0) return { expression: 'far-right-glance', text: c.emailTyping };
      return { expression: 'joyful-down-right', text: c.emailAsk };
    }
    case 'company': {
      const company = formData.company.trim();
      return { animation: 'thinking', text: company ? fill(c.companyNoted, { company }) : c.companyAsk };
    }
    case 'timeline': {
      const timeline = formData.timeline.trim();
      return { expression: 'asymmetric-down-right', text: timeline ? fill(c.timelineNoted, { timeline }) : c.timelineAsk };
    }
    case 'message': {
      const len = formData.message.trim().length;
      const text = len > 80 ? c.messageLong : len > 25 ? c.messageMid : len > 0 ? c.messageShort : c.messageAsk;
      return { animation: 'listening', text };
    }
    case 'source':
      return { expression: 'asymmetric-down-right', text: c.sourceAsk };
    case 'submit':
      return { animation: 'excited', text: c.ready };
    default: {
      const started = formData.name || formData.email || formData.message;
      return { animation: 'idle', idle: true, text: started ? c.reminder : c.hello };
    }
  }
}

export default function ContactSphereCompanion({
  focusedField = null,
  formData = { name: '', email: '', company: '', timeline: '', message: '', source: '' },
  isTyping = false,
  submitted = false, // false | 'sent' | 'mailto'
  size = 280,
}) {
  const { dict } = useLanguage();
  const c = dict.contact.companion;
  const avatarRef = useRef(null);
  const sphereRef = useRef(null);

  const [customQuote, setCustomQuote] = useState(null);
  const [mouseExpression, setMouseExpression] = useState(null);
  const [responsiveSize, setResponsiveSize] = useState(size);
  const lastSoundRef = useRef(0);
  const quoteTimer = useRef(null);

  // Escalar responsivamente en móviles para que no desborde
  useEffect(() => {
    const updateSize = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 480) {
        setResponsiveSize(Math.min(size, 200));
      } else if (window.innerWidth < 768) {
        setResponsiveSize(Math.min(size, 230));
      } else {
        setResponsiveSize(size);
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize, { passive: true });
    return () => window.removeEventListener('resize', updateSize);
  }, [size]);

  useEffect(() => () => clearTimeout(quoteTimer.current), []);

  /*
   * Phones/tablets stack the sphere above the form, so while filling in the fields it is off
   * screen. Then a mini sphere + bubble docks at the top right and keeps reacting.
   */
  const [sphereOffscreen, setSphereOffscreen] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const dockRef = useRef(null);
  useEffect(() => {
    const el = sphereRef.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(([entry]) => setSphereOffscreen(!entry.isIntersecting));
    io.observe(el);
    const mq = window.matchMedia('(max-width: 1024px)');
    const onMq = () => setNarrow(mq.matches);
    onMq();
    mq.addEventListener('change', onMq);
    return () => {
      io.disconnect();
      mq.removeEventListener('change', onMq);
    };
  }, []);
  const docked = narrow && sphereOffscreen && focusedField !== null && !submitted;

  // With the on-screen keyboard open, keep the dock at the top of what is actually visible
  useEffect(() => {
    const vv = window.visualViewport;
    const dock = dockRef.current;
    if (!docked || !vv || !dock) return undefined;
    const place = () => dock.style.setProperty('--vv-top', `${vv.offsetTop}px`);
    place();
    vv.addEventListener('resize', place);
    vv.addEventListener('scroll', place);
    return () => {
      vv.removeEventListener('resize', place);
      vv.removeEventListener('scroll', place);
    };
  }, [docked]);

  // 1. Reacción al teclear (micro rebote y suave tick)
  useEffect(() => {
    const sphere = sphereRef.current;
    if (isTyping && sphere) {
      sphere.classList.add('is-typing-bounce');
      const timer = setTimeout(() => sphere.classList.remove('is-typing-bounce'), 140);

      // Tic mínimo al teclear (limitado para no saturar)
      const now = Date.now();
      if (now - lastSoundRef.current > 75) {
        lastSoundRef.current = now;
        playSound('hover');
      }

      return () => clearTimeout(timer);
    }
  }, [isTyping]);

  // 2. Reacción al estado del formulario (mirando hacia la derecha donde está el formulario)
  const reaction = reactionFor({ focusedField, formData, submitted }, c);

  // 3. Seguimiento suave del ratón cuando no hay ningún campo activo
  const tracking = reaction.idle && !customQuote;
  useEffect(() => {
    if (!tracking) return undefined;

    const handleMouseMove = (e) => {
      if (!sphereRef.current) return;
      const rect = sphereRef.current.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);

      let target = 'neutral';
      if (Math.sqrt(dx * dx + dy * dy) >= 50) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        if (angle >= -45 && angle <= 45) target = 'playful-right';
        else if (angle > 45 && angle < 135) target = 'joyful-down-right';
        else if (angle >= 135 || angle <= -135) target = 'attentive-left';
        else target = 'upward-side-glance';
      }
      setMouseExpression(target); // same value → React skips the render
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [tracking]);

  // 4. Clic directo sobre la bola: reacción lúdica
  const handleSphereClick = () => {
    playSound('click');
    setCustomQuote(c.quotes[Math.floor(Math.random() * c.quotes.length)]);
    clearTimeout(quoteTimer.current);
    quoteTimer.current = setTimeout(() => setCustomQuote(null), 2800);
  };

  let animation = reaction.animation ?? null;
  let expression = reaction.expression ?? null;
  if (customQuote) {
    animation = 'celebrate';
    expression = null;
  } else if (tracking && mouseExpression) {
    animation = null;
    expression = mouseExpression;
  }
  const bubbleText = customQuote ?? reaction.text;

  return (
    <>
    <div className="contact-sphere-widget">
      {/* Burbuja de pensamiento / reacción en tiempo real */}
      <div className="contact-sphere-bubble">
        <span className="bubble-sparkle">💬</span>
        <span className="bubble-text">{bubbleText}</span>
      </div>

      {/* La bola / esfera reactiva GRANDE */}
      <div
        ref={sphereRef}
        className="contact-blob-sphere"
        onClick={handleSphereClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSphereClick();
          }
        }}
        title={c.sphereHint}
        aria-label={c.sphereHint}
        style={{ width: responsiveSize, height: responsiveSize }}
      >
        {/* Aura de brillo sutil en el fondo (glowing effect) */}
        <div className="blob-ambient-glow" />

        {/* Renderizado oficial del Avatar con forma de esfera */}
        <div className="blob-avatar-inner">
          <Avatar
            ref={avatarRef}
            definition={contactBlobDefinition}
            animation={animation || undefined}
            expression={expression || undefined}
            defaultAnimation="idle"
            size={responsiveSize}
            ariaLabel={c.sphereLabel}
          />
        </div>
      </div>
    </div>

    {/* Mini companion docked at the top while the big sphere is scrolled away (phones/tablets) */}
    {createPortal(
      <div ref={dockRef} className={`contact-sphere-dock ${docked ? 'is-docked' : ''}`} aria-hidden="true">
        <div className="contact-sphere-dock-bubble">{bubbleText}</div>
        <div className="contact-sphere-dock-ball">
          {docked && (
            <Avatar
              definition={contactBlobDefinition}
              animation={animation || undefined}
              expression={expression || undefined}
              defaultAnimation="idle"
              size={56}
              ariaLabel=""
            />
          )}
        </div>
      </div>,
      document.body,
    )}
    </>
  );
}
