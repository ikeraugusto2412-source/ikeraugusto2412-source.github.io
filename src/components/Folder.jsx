import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { responsiveImg } from '../lib/images';
import './Folder.css';

const themes = {
  black: {
    backFill: '#0a0a0a',
    backInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.37 0',
    backInsetShadow: 'inset 0 0 6px 2px rgba(255,255,255,0.37)',
    flapFill: '#242424',
    flapFillOpacity: 0.35,
    flapStroke: 'rgba(255,255,255,0.22)',
    flapInsetColor: '0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.08 0',
    cardFill: '#F1F1F1',
    cardStroke: '#E0E0E0',
    cardLineFill: '#D4D4D4',
    cardInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0',
  },
  white: {
    backFill: '#ffffff',
    backInsetColor: '0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0 0.7 0 0 0 0.25 0',
    backInsetShadow: 'inset 0 0 6px 2px rgba(178,178,178,0.25)',
    flapFill: '#f5f5f5',
    flapFillOpacity: 0.85,
    flapStroke: '#d4d4d4',
    flapInsetColor: '0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0 0.6 0 0 0 0.15 0',
    cardFill: '#262626',
    cardStroke: '#404040',
    cardLineFill: '#737373',
    cardInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.15 0',
  },
  blue: {
    backFill: '#50B1FD',
    backInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.35 0',
    backInsetShadow: 'inset 0 0 6px 2px rgba(255,255,255,0.35)',
    flapFill: '#3a9ae8',
    flapFillOpacity: 0.45,
    flapStroke: '#7ec8ff',
    flapInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.12 0',
    cardFill: '#F1F1F1',
    cardStroke: '#E0E0E0',
    cardLineFill: '#D4D4D4',
    cardInsetColor: '0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 1 0',
  },
};

const sizeScales = {
  sm: 0.65,
  md: 1,
  lg: 1.25,
};

const BASE_WIDTH = 321;
const BASE_HEIGHT = 270;

const FLAP_PATH =
  'M0 25C0 11.1929 11.1929 0 25 0H136.084C143.044 0 149.689 2.90139 154.42 8.00608L178.08 33.5343C182.811 38.639 189.456 41.5404 196.416 41.5404H296C309.807 41.5404 321 52.7333 321 66.5404V216C321 229.807 309.807 241 296 241H25C11.1929 241 0 229.807 0 216V25Z';

const Card = ({ id, theme, item, isOpen }) => {
  const filterId = `filter0_i_card_${id}`;

  if (item && item.image) {
    return (
      <div className={`rare-folder-photo-card ${isOpen ? 'is-interactive' : ''}`} data-slot="folder-card">
        <div className="rare-folder-photo-frame">
          <img {...responsiveImg(item.image, '320px')} alt={item.title || ''} className="rare-folder-photo-img" loading="eager" decoding="async" />
          <div className="rare-folder-photo-overlay-glass" />
        </div>
        <div className="rare-folder-photo-info">
          {item.tag && <span className="rare-folder-photo-tag">{item.tag}</span>}
          {item.title && <span className="rare-folder-photo-title">{item.title}</span>}
          {item.desc && <span className="rare-folder-photo-desc">{item.desc}</span>}
        </div>
        {isOpen && (
          <div className="rare-folder-card-inspect-hint">
            <span>EXPAND ↗</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="rare-folder-card" data-slot="folder-card">
      <svg
        width="164"
        height="214"
        viewBox="0 0 164 214"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter={`url(#${filterId})`}>
          <rect
            width="163.078"
            height="213.262"
            rx="20"
            fill={theme.cardFill}
          />
        </g>
        <rect
          x="0.5"
          y="0.5"
          width="162.078"
          height="212.262"
          rx="19.5"
          stroke={theme.cardStroke}
        />
        <rect
          x="14.1193"
          y="31.2091"
          width="134.84"
          height="11.8892"
          rx="5.94459"
          fill={theme.cardLineFill}
        />
        {[60.9939, 75.1122, 89.2306, 103.349, 117.467, 131.586, 145.704, 159.823, 173.941].map((top, idx) => (
          <React.Fragment key={idx}>
            <rect
              width="64.5183"
              height="5.88276"
              rx="2.94138"
              transform={`matrix(1 -0.000409158 0.00201956 0.999998 14.8253 ${top})`}
              fill={theme.cardLineFill}
            />
            <rect
              width="64.5183"
              height="5.88276"
              rx="2.94138"
              transform={`matrix(1 -0.000461045 0.00179228 0.999998 84.4303 ${top - 0.032})`}
              fill={theme.cardLineFill}
            />
          </React.Fragment>
        ))}
        <defs>
          <filter
            id={filterId}
            x="0"
            y="0"
            width="166.078"
            height="218.262"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feColorMatrix
              in="SourceAlpha"
              type="matrix"
              values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
              result="hardAlpha"
            />
            <feMorphology
              radius="2"
              operator="erode"
              in="SourceAlpha"
              result={`effect1_innerShadow_${id}`}
            />
            <feOffset dx="3" dy="5" />
            <feGaussianBlur stdDeviation="3.05" />
            <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1" />
            <feColorMatrix type="matrix" values={theme.cardInsetColor} />
            <feBlend mode="normal" in2="shape" result={`effect1_innerShadow_${id}`} />
          </filter>
        </defs>
      </svg>
    </div>
  );
};

export default function Folder({
  color = 'black',
  size = 'md',
  items,
  openLabel,
  closeLabel,
  toggleLabel = 'Open or close the folder',
  onSelectCard,
  className = '',
  onClick,
  style,
  ...props
}) {
  const theme = themes[color] ?? themes.black;
  const scale = sizeScales[size] ?? 1;
  const [isHovered, setIsHovered] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleClick = (e) => {
    setIsOpen((prev) => !prev);
    if (onClick) onClick(e);
  };

  return (
    <div
      data-slot="folder"
      className={`rare-folder-container ${className}`}
      style={style}
      {...props}
    >
      <div
        className="rare-folder-interactive"
        style={{
          width: BASE_WIDTH * scale,
          height: BASE_HEIGHT * scale,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false);
          setIsOpen(false);
        }}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={toggleLabel}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <div
          className="rare-folder-stage"
          style={{
            width: BASE_WIDTH,
            height: BASE_HEIGHT,
            transform: `translate(-50%, -50%) scale(${scale})`,
            perspective: 1000,
          }}
        >
          {/* Back folder body */}
          <div className="rare-folder-back">
            <div
              className="rare-folder-back-body"
              style={{
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                backgroundColor: theme.backFill,
                boxShadow: theme.backInsetShadow,
              }}
            />
          </div>

          {/* Cards fanning out inside folder */}
          <div className="rare-folder-cards-wrap">
            {/* Left Card (Card 3) */}
            <motion.div
              className="rare-folder-card-motion"
              style={{ zIndex: isOpen ? 5 : 2 }}
              animate={{
                y: isOpen ? -185 : isHovered ? -42 : -18,
                x: isOpen ? -85 : isHovered ? -42 : -34,
                rotate: isOpen ? -14 : isHovered ? -9 : -6,
              }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 14,
                delay: isOpen ? 0.04 : 0,
              }}
              onClick={(e) => {
                if (isOpen && onSelectCard && items?.[2]) {
                  e.stopPropagation();
                  onSelectCard(items[2]);
                }
              }}
            >
              <Card id={3} theme={theme} item={items?.[2]} isOpen={isOpen} />
            </motion.div>

            {/* Right Card (Card 1) */}
            <motion.div
              className="rare-folder-card-motion"
              style={{ zIndex: isOpen ? 6 : 3 }}
              animate={{
                y: isOpen ? -185 : isHovered ? -34 : -12,
                x: isOpen ? 85 : isHovered ? 42 : 34,
                rotate: isOpen ? 14 : isHovered ? 12 : 8,
              }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 14,
                delay: isOpen ? 0.08 : 0,
              }}
              onClick={(e) => {
                if (isOpen && onSelectCard && items?.[0]) {
                  e.stopPropagation();
                  onSelectCard(items[0]);
                }
              }}
            >
              <Card id={1} theme={theme} item={items?.[0]} isOpen={isOpen} />
            </motion.div>

            {/* Center Card (Card 2) - Elevated highest in middle */}
            <motion.div
              className="rare-folder-card-motion"
              style={{ zIndex: isOpen ? 7 : 4 }}
              animate={{
                y: isOpen ? -210 : isHovered ? -38 : -16,
                x: isOpen ? 0 : 2,
                rotate: isOpen ? -1 : isHovered ? -1 : 1,
                scale: isOpen ? 1.04 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 14,
                delay: isOpen ? 0 : 0,
              }}
              onClick={(e) => {
                if (isOpen && onSelectCard && items?.[1]) {
                  e.stopPropagation();
                  onSelectCard(items[1]);
                }
              }}
            >
              <Card id={2} theme={theme} item={items?.[1]} isOpen={isOpen} />
            </motion.div>
          </div>

          {/* 3D Tilted Flap - Anchored without transform conflicts */}
          <div className="rare-folder-flap-anchor">
            <motion.div
              className="rare-folder-flap-motion"
              style={{
                transformOrigin: 'bottom center',
                transformStyle: 'preserve-3d',
                width: 321,
                height: 241,
              }}
              animate={{
                rotateX: isOpen ? -62 : isHovered ? -40 : -14,
              }}
              transition={{
                type: 'spring',
                stiffness: 140,
                damping: 15,
              }}
            >
              <div
                className="rare-folder-flap-glass"
                style={{
                  clipPath: `path('${FLAP_PATH}')`,
                  WebkitClipPath: `path('${FLAP_PATH}')`,
                }}
              />
              <svg
                className="rare-folder-flap-svg"
                width="321"
                height="241"
                viewBox="0 0 321 241"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g filter="url(#filter0_i_171_13)">
                  <path
                    d={FLAP_PATH}
                    fill={theme.flapFill}
                    fillOpacity={theme.flapFillOpacity}
                  />
                  <path
                    d="M25 0.5H136.084C142.905 0.5 149.417 3.3431 154.054 8.3457L177.713 33.874C182.539 39.0808 189.317 42.04 196.416 42.04H296C309.531 42.04 320.5 53.0092 320.5 66.54V216C320.5 229.531 309.531 240.5 296 240.5H25C11.469 240.5 0.5 229.531 0.5 216V25C0.5 11.469 11.469 0.5 25 0.5Z"
                    stroke={theme.flapStroke}
                  />
                </g>
                <defs>
                  <filter
                    id="filter0_i_171_13"
                    x="-25.4"
                    y="-25.4"
                    width="371.8"
                    height="291.8"
                    filterUnits="userSpaceOnUse"
                    colorInterpolationFilters="sRGB"
                  >
                    <feFlood floodOpacity="0" result="BackgroundImageFix" />
                    <feBlend
                      mode="normal"
                      in="SourceGraphic"
                      in2="BackgroundImageFix"
                      result="shape"
                    />
                    <feColorMatrix
                      in="SourceAlpha"
                      type="matrix"
                      values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
                      result="hardAlpha"
                    />
                    <feOffset />
                    <feGaussianBlur stdDeviation="2.65" />
                    <feComposite
                      in2="hardAlpha"
                      operator="arithmetic"
                      k2="-1"
                      k3="1"
                    />
                    <feColorMatrix type="matrix" values={theme.flapInsetColor} />
                    <feBlend
                      mode="normal"
                      in2="shape"
                      result="effect1_innerShadow_171_13"
                    />
                  </filter>
                </defs>
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Sleek status pill indicator */}
      <div className="rare-folder-status-pill">
        <span className={`rare-folder-status-dot ${isOpen ? 'is-active' : ''}`} />
        <span className="rare-folder-status-text">
          {isOpen
            ? (closeLabel || 'CLICK TO CLOSE DOSSIER')
            : (openLabel || 'CLICK TO UNLOCK ARCHIVE')}
        </span>
      </div>
    </div>
  );
}
