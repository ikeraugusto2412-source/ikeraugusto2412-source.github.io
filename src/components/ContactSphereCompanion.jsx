import React, { useState, useEffect, useRef } from 'react';
import { Avatar } from '@bible-strong/avatar-react';
import '@bible-strong/avatar-react/styles.css';
import contactBlobDefinition from '../data/contact-blob.avatar.json';
import { playSound } from '../audio/sound';
import './ContactSphereCompanion.css';

/**
 * ContactSphereCompanion
 * Una bola negra procedural interactiva (inspirada en @adrien.ninet / Bible Strong Avatar)
 * que reacciona en tiempo real a los campos del formulario de contacto.
 * Ubicada en el lateral izquierdo, grande y con seguimiento activo hacia el formulario.
 */
export default function ContactSphereCompanion({
  focusedField = null,
  formData = { name: '', email: '', company: '', timeline: '', message: '', source: '' },
  isTyping = false,
  submitted = false,
  size = 280,
}) {
  const avatarRef = useRef(null);
  const sphereRef = useRef(null);

  const [activeAnimation, setActiveAnimation] = useState('idle');
  const [activeExpression, setActiveExpression] = useState(null);
  const [bubbleText, setBubbleText] = useState('¡Hola! Escríbeme y charlemos sobre tu proyecto ✨');
  const [keyBounce, setKeyBounce] = useState(false);
  const [customQuote, setCustomQuote] = useState(null);
  const [responsiveSize, setResponsiveSize] = useState(size);
  const lastSoundRef = useRef(0);

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

  // Helper para cambiar a animación (limpiando expresión)
  const setAnimation = (anim) => {
    setActiveExpression(null);
    setActiveAnimation(anim);
  };

  // Helper para cambiar a expresión fija (limpiando animación)
  const setExpression = (expr) => {
    setActiveAnimation(null);
    setActiveExpression(expr);
  };

  // 1. Reacción al teclear (micro rebote y suave tick)
  useEffect(() => {
    if (isTyping) {
      setKeyBounce(true);
      const timer = setTimeout(() => setKeyBounce(false), 140);

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
  useEffect(() => {
    if (customQuote) {
      return;
    }

    // A. Formulario enviado
    if (submitted) {
      setAnimation('celebrate');
      setBubbleText(
        formData.name
          ? `¡Mensaje enviado con éxito! Gracias, ${formData.name}. En breve te respondo 🎉`
          : '¡Mensaje recibido! Te responderé en menos de 24 horas 🎉'
      );
      return;
    }

    // B. Reacción según el campo activo (mirando a la derecha hacia los inputs)
    switch (focusedField) {
      case 'name': {
        const nameLen = formData.name.trim().length;
        if (nameLen > 2) {
          setAnimation('happy');
          setBubbleText(`¡Hola, ${formData.name.trim()}! Qué buen nombre 😊`);
        } else if (nameLen > 0) {
          setExpression('playful-right');
          setBubbleText('Escribiendo tu nombre... 👀');
        } else {
          setExpression('far-right-glance');
          setBubbleText('¿Cómo te llamas? Encantado de conocerte 👋');
        }
        break;
      }

      case 'email': {
        const email = formData.email.trim();
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (isValid) {
          setAnimation('proud');
          setBubbleText('¡Email perfecto! Lo tengo anotado para responderte ✨');
        } else if (email.includes('@')) {
          setExpression('joyful-down-right');
          setBubbleText('Falta el dominio (ej: .com o .es) ✉️');
        } else if (email.length > 0) {
          setExpression('far-right-glance');
          setBubbleText('Revisando tu correo... ✍️');
        } else {
          setExpression('joyful-down-right');
          setBubbleText('¿A qué correo te respondo? ✉️');
        }
        break;
      }

      case 'company': {
        const comp = formData.company.trim();
        setAnimation('thinking');
        if (comp.length > 0) {
          setBubbleText(`Interesante marca: ${comp} 🏢`);
        } else {
          setBubbleText('¿Con qué marca, estudio o proyecto trabajamos? 🏢');
        }
        break;
      }

      case 'timeline': {
        const time = formData.timeline.trim();
        setExpression('asymmetric-down-right');
        if (time.length > 0) {
          setBubbleText(`Fechas anotadas: ${time} 🗓️`);
        } else {
          setBubbleText('¿Para qué fechas tienes pensado el proyecto? 🗓️');
        }
        break;
      }

      case 'message': {
        const msgLen = formData.message.trim().length;
        setAnimation('listening');
        if (msgLen > 80) {
          setBubbleText('¡Menudo proyecto! Me encanta la visión, sigue... 🔥');
        } else if (msgLen > 25) {
          setBubbleText('¡Suena fantástico! Leyendo con mucha atención... 🎯');
        } else if (msgLen > 0) {
          setBubbleText('Te leo atentamente... ✍️');
        } else {
          setBubbleText('Cuéntame todos los detalles que quieras sobre tu idea... ✍️');
        }
        break;
      }

      case 'source': {
        setExpression('asymmetric-down-right');
        setBubbleText('¿Cómo descubriste mi trabajo fotográfico? 🔍');
        break;
      }

      case 'submit': {
        setAnimation('excited');
        setBubbleText('¡Todo listo para conectar! Pulsa enviar 🚀');
        break;
      }

      default: {
        // En reposo (sin campo activo)
        const hasStarted = formData.name || formData.email || formData.message;
        if (hasStarted) {
          setAnimation('idle');
          setBubbleText('¡No te olvides de enviar el mensaje al terminar! 📬');
        } else {
          setAnimation('idle');
          setBubbleText('¡Hola! Escríbeme y charlemos sobre tu proyecto ✨');
        }
        break;
      }
    }
  }, [focusedField, formData, submitted, customQuote]);

  // 3. Seguimiento suave del ratón cuando no hay ningún campo activo
  useEffect(() => {
    if (focusedField !== null || submitted) return;

    const handleMouseMove = (e) => {
      if (!sphereRef.current) return;
      const rect = sphereRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 50) {
        if (activeExpression !== 'neutral') {
          setExpression('neutral');
        }
        return;
      }

      const angle = Math.atan2(dy, dx) * (180 / Math.PI);

      let targetExpr = 'neutral';
      if (angle >= -45 && angle <= 45) {
        targetExpr = 'playful-right';
      } else if (angle > 45 && angle < 135) {
        targetExpr = 'joyful-down-right';
      } else if (angle >= 135 || angle <= -135) {
        targetExpr = 'attentive-left';
      } else {
        targetExpr = 'upward-side-glance';
      }

      if (targetExpr !== activeExpression) {
        setExpression(targetExpr);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusedField, activeExpression, submitted]);

  // 4. Clic directo sobre la bola: reacción lúdica
  const handleSphereClick = () => {
    playSound('click');

    const funQuotes = [
      '¡Oye! Escribe en el formulario a mi derecha para contactar 😄',
      '¡Listo para crear algo increíble juntos! 🎬',
      'Observando cada detalle de tu mensaje... 👀',
      '¡Buen pulso! Sigamos con el formulario 🚀',
    ];
    const picked = funQuotes[Math.floor(Math.random() * funQuotes.length)];
    setCustomQuote(picked);
    setBubbleText(picked);
    setAnimation('celebrate');

    setTimeout(() => {
      setCustomQuote(null);
    }, 2800);
  };

  return (
    <div className="contact-sphere-widget">
      {/* Burbuja de pensamiento / reacción en tiempo real */}
      <div className="contact-sphere-bubble">
        <span className="bubble-sparkle">💬</span>
        <span className="bubble-text">{bubbleText}</span>
      </div>

      {/* La bola / esfera reactiva GRANDE */}
      <div
        ref={sphereRef}
        className={`contact-blob-sphere ${keyBounce ? 'is-typing-bounce' : ''}`}
        onClick={handleSphereClick}
        title="Toca a la bola interactiva"
        style={{ width: responsiveSize, height: responsiveSize }}
      >
        {/* Aura de brillo sutil en el fondo (glowing effect) */}
        <div className="blob-ambient-glow" />

        {/* Renderizado oficial del Avatar con forma de esfera */}
        <div className="blob-avatar-inner">
          <Avatar
            ref={avatarRef}
            definition={contactBlobDefinition}
            animation={activeAnimation || undefined}
            expression={activeExpression || undefined}
            defaultAnimation="idle"
            size={responsiveSize}
            ariaLabel="Bola interactiva de contacto"
          />
        </div>
      </div>
    </div>
  );
}
