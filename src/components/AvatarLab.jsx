import React, { useState, useRef, useMemo } from 'react';
import { Avatar } from '@bible-strong/avatar-react';
import '@bible-strong/avatar-react/styles.css';

import directorAvatar from '../data/creative-director.avatar.json';
import streetAvatar from '../data/creative-street.avatar.json';
import minimalAvatar from '../data/creative-minimal.avatar.json';
import './AvatarLab.css';

// ============================================================================
// ARQUETIPOS DEL CREATIVO (FORMAS Y SILUETAS ADAPTADAS)
// ============================================================================
const ARCHETYPES = [
  {
    id: 'director',
    name: 'El Director / Filmmaker',
    badge: 'CINE & VÍDEO',
    desc: 'Silueta estilizada con auriculares de estudio y gorro de rodaje. Concentrado, observador y analítico.',
    icon: '🎬',
    definition: directorAvatar,
    defaultAnimation: 'idle',
  },
  {
    id: 'street',
    name: 'Fotógrafo Callejero',
    badge: 'STREET & FOTO',
    desc: 'Con gorro beanie dockworker de lana doblada. Ojos ágiles y mirada atenta para capturar el instante decisivo.',
    icon: '📸',
    definition: streetAvatar,
    defaultAnimation: 'curious',
  },
  {
    id: 'minimal',
    name: 'Diseñador / Artista',
    badge: 'ARTE VISUAL',
    desc: 'Escultura contemporánea de líneas puras y cuello alto. Inspirado en figuras de arte y diseño editorial.',
    icon: '🎨',
    definition: minimalAvatar,
    defaultAnimation: 'thinking',
  },
];

// ============================================================================
// OUTFITS & PALETAS DE COLOR DEL CREATIVO
// ============================================================================
const OUTFITS = [
  {
    id: 'all-black',
    name: 'Total Black',
    styleLabel: 'El clásico outfit de creativo',
    colors: { body: '#14151a', eyes: '#ffffff' },
    previewBorder: '#ffffff',
  },
  {
    id: 'charcoal-amber',
    name: 'Grafito & Ámbar',
    styleLabel: 'Luz cálida de estudio',
    colors: { body: '#24252b', eyes: '#f59e0b' },
    previewBorder: '#f59e0b',
  },
  {
    id: 'studio-raw',
    name: 'Lienzo Crudo',
    styleLabel: 'Papel baritado & marfil',
    colors: { body: '#e5e2db', eyes: '#1c1917' },
    previewBorder: '#1c1917',
  },
  {
    id: 'midnight-cyan',
    name: 'Midnight & Cyan',
    styleLabel: 'Luz de monitor de edición',
    colors: { body: '#0d1017', eyes: '#38bdf8' },
    previewBorder: '#38bdf8',
  },
];

// ============================================================================
// ESTADOS DE ÁNIMO Y PENSAMIENTOS DEL CREATIVO
// ============================================================================
const CREATIVE_MOODS = [
  {
    key: 'idle',
    label: 'Observando la escena',
    icon: '👁️',
    quote: 'Observando los detalles que los demás suelen pasar por alto.',
  },
  {
    key: 'thinking',
    label: 'Brainstorming de ideas',
    icon: '🧠',
    quote: '¿Y si eliminamos lo superfluo y dejamos solo la pura esencia?',
  },
  {
    key: 'celebrate',
    label: '¡Momento Eureka!',
    icon: '💡',
    quote: '¡Exactamente esa es la idea! Ya lo veo con total claridad.',
  },
  {
    key: 'happy',
    label: 'Inspiración plena',
    icon: '✨',
    quote: 'La luz, el contraste y la composición encajan a la perfección.',
  },
  {
    key: 'curious',
    label: 'Curiosidad visual',
    icon: '🔍',
    quote: 'Buscando ángulos imprevistos y nuevas perspectivas.',
  },
  {
    key: 'working',
    label: 'En estado de flow',
    icon: '⚡',
    quote: 'Absorto en pleno proceso de creación... no interrumpir.',
  },
  {
    key: 'sleeping',
    label: 'Pausa para café',
    icon: '☕',
    quote: 'A veces el mejor salto creativo surge tras tomarse un respiro.',
  },
  {
    key: 'waking',
    label: 'Vuelta al proyecto',
    icon: '🌅',
    quote: 'Mente despejada, ojos frescos y listos para crear.',
  },
];

export default function AvatarLab({ size = 260 }) {
  const avatarRef = useRef(null);
  const stageRef = useRef(null);

  // Estados
  const [activeArchetype, setActiveArchetype] = useState(ARCHETYPES[0]);
  const [activeOutfit, setActiveOutfit] = useState(OUTFITS[0]);
  const [currentMood, setCurrentMood] = useState(CREATIVE_MOODS[0]);
  const [activeAnimation, setActiveAnimation] = useState('idle');
  const [activeExpression, setActiveExpression] = useState(null);
  const [isEyeTracking, setIsEyeTracking] = useState(true);
  const [interactiveQuote, setInteractiveQuote] = useState(CREATIVE_MOODS[0].quote);
  const [pulseClick, setPulseClick] = useState(false);

  // Definición reactiva con la forma del arquetipo y los colores del outfit
  const dynamicDefinition = useMemo(() => {
    return {
      ...activeArchetype.definition,
      name: `${activeArchetype.name} (${activeOutfit.name})`,
      colors: activeOutfit.colors,
    };
  }, [activeArchetype, activeOutfit]);

  // Selección de arquetipo
  const handleSelectArchetype = (archetype) => {
    setActiveArchetype(archetype);
    setActiveAnimation(archetype.defaultAnimation);
    setActiveExpression(null);
    const matchingMood = CREATIVE_MOODS.find((m) => m.key === archetype.defaultAnimation) || CREATIVE_MOODS[0];
    setCurrentMood(matchingMood);
    setInteractiveQuote(matchingMood.quote);
  };

  // Selección de estado de ánimo
  const handleSelectMood = (mood) => {
    setCurrentMood(mood);
    setActiveExpression(null);
    setActiveAnimation(mood.key);
    setInteractiveQuote(mood.quote);
    avatarRef.current?.play(mood.key);
  };

  // Seguimiento de mirada del creativo hacia el cursor del usuario
  const handleStageMouseMove = (e) => {
    if (!isEyeTracking || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = e.clientX - centerX;
    const dy = e.clientY - centerY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 40) {
      if (activeExpression !== 'neutral') {
        setActiveAnimation(null);
        setActiveExpression('neutral');
      }
      return;
    }

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);

    let targetExpr = 'neutral';
    if (angle >= -45 && angle <= 45) {
      targetExpr = 'playful-right';
    } else if (angle > 45 && angle < 135) {
      targetExpr = 'downward-gaze';
    } else if (angle >= 135 || angle <= -135) {
      targetExpr = 'attentive-left';
    } else {
      targetExpr = 'upward-side-glance';
    }

    if (targetExpr !== activeExpression) {
      setActiveAnimation(null);
      setActiveExpression(targetExpr);
    }
  };

  const handleStageMouseLeave = () => {
    if (isEyeTracking) {
      setActiveAnimation(currentMood.key);
      setActiveExpression(null);
    }
  };

  // Clic en el creativo: reacción amigable y cambio de pensamiento
  const handleCreativeClick = () => {
    setPulseClick(true);
    setTimeout(() => setPulseClick(false), 200);

    // Lista de pensamientos espontáneos al interactuar
    const spontaneousThoughts = [
      '¡Me encanta esa idea! Vamos a darle forma.',
      'El secreto no está en la herramienta, sino en la mirada.',
      '¿Probamos un encuadre más cinematográfico?',
      'Menos ruido, más narrativa visual.',
      '¡Buen ojo! Eso tiene mucho potencial.',
    ];
    const randomThought = spontaneousThoughts[Math.floor(Math.random() * spontaneousThoughts.length)];
    setInteractiveQuote(randomThought);

    // Reacciona alegre
    setActiveAnimation('celebrate');
    setActiveExpression(null);
  };

  return (
    <div className="creative-lab-root">
      {/* ── SELECTOR PRINCIPAL DE ARQUETIPOS DE FORMA ── */}
      <div className="creative-archetypes-bar">
        <span className="archetypes-label">ELIGE EL ARQUETIPO CREATIVO:</span>
        <div className="archetypes-pills">
          {ARCHETYPES.map((arch) => {
            const isSelected = activeArchetype.id === arch.id;
            return (
              <button
                key={arch.id}
                type="button"
                className={`archetype-pill-btn ${isSelected ? 'is-active' : ''}`}
                onClick={() => handleSelectArchetype(arch)}
              >
                <span className="pill-icon">{arch.icon}</span>
                <span className="pill-name">{arch.name}</span>
                <span className="pill-badge">{arch.badge}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ESCENARIO PRINCIPAL DEL PERSONAJE ── */}
      <div className="creative-stage-card">
        {/* Descripción del arquetipo activo */}
        <div className="stage-persona-intro">
          <div className="persona-meta">
            <span className="persona-icon">{activeArchetype.icon}</span>
            <div>
              <h3 className="persona-title">{activeArchetype.name}</h3>
              <p className="persona-desc">{activeArchetype.desc}</p>
            </div>
          </div>
          <button
            type="button"
            className={`eye-tracking-toggle ${isEyeTracking ? 'enabled' : ''}`}
            onClick={() => setIsEyeTracking((v) => !v)}
            title="Activa o desactiva si el creativo sigue tu cursor con la mirada"
          >
            <span className="toggle-dot" />
            MIRADA INTERACTIVA: {isEyeTracking ? 'ACTIVA' : 'FIJA'}
          </button>
        </div>

        {/* Lienzo del Avatar */}
        <div
          ref={stageRef}
          className={`creative-avatar-stage ${pulseClick ? 'is-pulsing' : ''}`}
          onMouseMove={handleStageMouseMove}
          onMouseLeave={handleStageMouseLeave}
          onClick={handleCreativeClick}
          title="Haz clic para interactuar con el creativo"
        >
          {/* Círculo sutil de foco escénico */}
          <div className="avatar-ambient-glow" />

          {/* Renderizado oficial con @bible-strong/avatar-react */}
          <div className="avatar-render-wrap">
            <Avatar
              ref={avatarRef}
              definition={dynamicDefinition}
              animation={activeAnimation || undefined}
              expression={activeExpression || undefined}
              defaultAnimation={activeArchetype.defaultAnimation}
              size={size}
              ariaLabel={activeArchetype.name}
            />
          </div>

          {/* Diálogo / Pensamiento del Creativo */}
          <div className="creative-thought-bubble">
            <span className="thought-quote-mark">“</span>
            <span className="thought-text">{interactiveQuote}</span>
            <span className="thought-quote-mark">”</span>
          </div>

          <span className="stage-interact-tip">Toca al creativo para interactuar</span>
        </div>
      </div>

      {/* ── ESTADOS DE ÁNIMO Y PROCESO CREATIVO ── */}
      <div className="creative-control-block">
        <div className="block-header">
          <span className="block-title">ESTADO DE ÁNIMO & ACTITUD</span>
          <span className="block-meta">HAZ CLIC PARA CAMBIAR SU REACCIÓN</span>
        </div>
        <div className="moods-grid">
          {CREATIVE_MOODS.map((mood) => {
            const isSelected = currentMood.key === mood.key;
            return (
              <button
                key={mood.key}
                type="button"
                className={`mood-card-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => handleSelectMood(mood)}
              >
                <span className="mood-icon">{mood.icon}</span>
                <span className="mood-label">{mood.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── PALETAS DE COLOR / OUTFITS ── */}
      <div className="creative-control-block">
        <div className="block-header">
          <span className="block-title">ESTILO & OUTFIT</span>
          <span className="block-meta">COLORES Y PERSONALIDAD VISUAL</span>
        </div>
        <div className="outfits-grid">
          {OUTFITS.map((outfit) => {
            const isSelected = activeOutfit.id === outfit.id;
            return (
              <button
                key={outfit.id}
                type="button"
                className={`outfit-card-btn ${isSelected ? 'is-selected' : ''}`}
                onClick={() => setActiveOutfit(outfit)}
              >
                <div className="outfit-swatch-cluster">
                  <div
                    className="outfit-swatch-body"
                    style={{ backgroundColor: outfit.colors.body }}
                  >
                    <div
                      className="outfit-swatch-eye"
                      style={{ backgroundColor: outfit.colors.eyes }}
                    />
                  </div>
                </div>
                <div className="outfit-info">
                  <span className="outfit-name">{outfit.name}</span>
                  <span className="outfit-label">{outfit.styleLabel}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── EJEMPLO DE CÓDIGO DIRECTO ── */}
      <div className="creative-embed-box">
        <div className="embed-header">
          <span className="embed-tag">CÓDIGO LISTO PARA USAR EN CUALQUIER PÁGINA</span>
          <span className="embed-file">src/data/creative-director.avatar.json</span>
        </div>
        <pre className="embed-code">
{`import { Avatar } from '@bible-strong/avatar-react';
import creativeAvatar from './data/creative-director.avatar.json';

export function CreativeCompanion() {
  return (
    <Avatar
      definition={creativeAvatar}
      defaultAnimation="idle"
      size={200}
      ariaLabel="El Director Creativo"
    />
  );
}`}
        </pre>
      </div>
    </div>
  );
}
