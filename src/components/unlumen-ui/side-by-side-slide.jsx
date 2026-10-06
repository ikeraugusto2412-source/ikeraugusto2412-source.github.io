import React, { useRef, useCallback } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import './side-by-side-slide.css';

export function SideBySideSlide({
  beforeImage,
  afterImage,
  beforeAlt = 'Before',
  afterAlt = 'After',
  orientation = 'horizontal',
  initialPosition = 50,
  dividerColor = 'white',
  dividerWidth = 2,
  dividerShadow = '0 0 8px rgba(0,0,0,0.3)',
  showHandle = true,
  handleSize = 40,
  handleColor = 'white',
  cursor = 'none',
  springOptions = { stiffness: 300, damping: 30 },
  className = '',
  beforeStyle = {},
  afterStyle = {},
  beforeClassName = '',
  afterClassName = '',
  children,
}) {
  const containerRef = useRef(null);
  const isHorizontal = orientation === 'horizontal';

  const position = useMotionValue(initialPosition);
  const smoothPosition = useSpring(position, springOptions);

  // clip-path: inset() keeps the before image at full intrinsic scale without stretching or shifting
  const clipPath = useTransform(smoothPosition, (pos) => {
    const clamped = Math.max(0, Math.min(100, pos));
    if (isHorizontal) {
      return `inset(0 ${100 - clamped}% 0 0)`;
    }
    return `inset(0 0 ${100 - clamped}% 0)`;
  });

  const dividerOffset = useTransform(smoothPosition, (pos) => `${pos}%`);
  const dividerPositionStyle = isHorizontal
    ? { left: dividerOffset }
    : { top: dividerOffset };

  const handlePointerMove = useCallback(
    (clientX, clientY) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isHorizontal) {
        const offsetX = clientX - rect.left;
        const pct = (offsetX / rect.width) * 100;
        position.set(Math.max(0, Math.min(100, pct)));
      } else {
        const offsetY = clientY - rect.top;
        const pct = (offsetY / rect.height) * 100;
        position.set(Math.max(0, Math.min(100, pct)));
      }
    },
    [isHorizontal, position]
  );

  const onMouseMove = (e) => {
    handlePointerMove(e.clientX, e.clientY);
  };

  const onTouchMove = (e) => {
    if (e.touches && e.touches[0]) {
      handlePointerMove(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  const onPointerLeave = () => {
    // Springs back to initialPosition on leave
    position.set(initialPosition);
  };

  return (
    <div
      ref={containerRef}
      className={`unlumen-side-by-side ${className}`}
      style={{ cursor }}
      onMouseMove={onMouseMove}
      onMouseLeave={onPointerLeave}
      onTouchMove={onTouchMove}
      onTouchEnd={onPointerLeave}
    >
      {/* After image (Right / Bottom half / Background) */}
      <div className="unlumen-sbs-image-layer unlumen-sbs-after">
        <img
          src={afterImage}
          alt={afterAlt}
          className={`unlumen-sbs-img ${afterClassName}`}
          style={afterStyle}
          draggable="false"
        />
      </div>

      {/* Before image (Left / Top half with spring clipPath) */}
      <motion.div
        className="unlumen-sbs-image-layer unlumen-sbs-before"
        style={{ clipPath }}
      >
        <img
          src={beforeImage}
          alt={beforeAlt}
          className={`unlumen-sbs-img ${beforeClassName}`}
          style={beforeStyle}
          draggable="false"
        />
      </motion.div>

      {/* Optional custom overlays / labels passed as children */}
      {children}

      {/* Spring-animated divider line */}
      <motion.div
        className={`unlumen-sbs-divider ${isHorizontal ? 'horizontal' : 'vertical'}`}
        style={{
          ...dividerPositionStyle,
          backgroundColor: dividerColor,
          boxShadow: dividerShadow,
          ...(isHorizontal
            ? { width: `${dividerWidth}px` }
            : { height: `${dividerWidth}px` }),
        }}
      >
        {/* Circular Drag Handle */}
        {showHandle && (
          <div
            className="unlumen-sbs-handle"
            style={{
              width: `${handleSize}px`,
              height: `${handleSize}px`,
              backgroundColor: handleColor,
            }}
          >
            {isHorizontal ? (
              <svg
                viewBox="0 0 24 24"
                width={handleSize * 0.45}
                height={handleSize * 0.45}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="unlumen-sbs-handle-icon"
              >
                <polyline points="8 17 3 12 8 7" />
                <polyline points="16 7 21 12 16 17" />
              </svg>
            ) : (
              <svg
                viewBox="0 0 24 24"
                width={handleSize * 0.45}
                height={handleSize * 0.45}
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="unlumen-sbs-handle-icon"
              >
                <polyline points="17 8 12 3 7 8" />
                <polyline points="7 16 12 21 17 16" />
              </svg>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default SideBySideSlide;
