import React, { forwardRef, useEffect, useId, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { playSound } from '../audio/sound';
import './AppleSwitch.css';

const switchSizes = {
  sm: {
    trackX: 44,
    trackY: 24,
    thumbX: 20,
    thumbY: 18,
    padding: 3,
  },
  md: {
    trackX: 58,
    trackY: 32,
    thumbX: 28,
    thumbY: 24,
    padding: 4,
  },
  lg: {
    trackX: 72,
    trackY: 38,
    thumbX: 34,
    thumbY: 28,
    padding: 5,
  },
};

const switchTones = {
  neutral: {
    off: 'rgba(120, 120, 128, 0.32)',
    on: '#34c759',
    thumb: '#ffffff',
    glow: 'rgba(52, 199, 89, 0.38)',
  },
  accent: {
    off: 'rgba(120, 120, 128, 0.32)',
    on: '#ffffff',
    thumb: '#111111',
    glow: 'rgba(255, 255, 255, 0.4)',
  },
  monochrome: {
    off: 'rgba(255, 255, 255, 0.15)',
    on: 'rgba(255, 255, 255, 0.85)',
    thumb: '#0a0a0a',
    glow: 'rgba(255, 255, 255, 0.3)',
  },
};

const thumbSpring = {
  stiffness: 700,
  damping: 48,
  mass: 0.55,
};

const grabSpring = {
  stiffness: 500,
  damping: 25,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const AppleSwitch = forwardRef(function AppleSwitch(
  {
    checked,
    defaultChecked = false,
    onCheckedChange,
    label,
    description,
    size = 'md',
    tone = 'neutral',
    labelSide = 'right',
    className = '',
    style,
    disabled = false,
    id,
    type = 'button',
    onClick,
    onPointerCancel,
    onPointerDown,
    onPointerLeave,
    onPointerMove,
    onPointerUp,
    ...props
  },
  ref
) {
  const generatedId = useId();
  const switchId = id ?? generatedId;
  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked));
  const currentChecked = checked ?? uncontrolledChecked;

  // Toggle sound fires on the state change itself, so tap, drag and external
  // changes (e.g. the ES/EN labels) all sound exactly once
  const prevChecked = useRef(currentChecked);
  useEffect(() => {
    if (prevChecked.current === currentChecked) return;
    prevChecked.current = currentChecked;
    playSound(currentChecked ? 'toggle-on' : 'toggle-off');
  }, [currentChecked]);

  const metrics = switchSizes[size] ?? switchSizes.md;
  const colors = switchTones[tone] ?? switchTones.neutral;

  const thumbTravel = metrics.trackX - metrics.thumbX - metrics.padding * 2;
  const targetX = useMotionValue(currentChecked ? thumbTravel : 0);
  const thumbX = useSpring(targetX, thumbSpring);

  const grabTarget = useMotionValue(0);
  const grabProgress = useSpring(grabTarget, grabSpring);

  const thumbWidth = useTransform(
    grabProgress,
    [0, 1],
    [metrics.thumbX, metrics.thumbX + metrics.padding * 3.5]
  );
  const thumbHeight = useTransform(
    grabProgress,
    [0, 1],
    [metrics.thumbY, metrics.thumbY + metrics.padding * 1.5]
  );

  const thumbOffsetX = useTransform(
    [thumbX, thumbWidth],
    ([x, w]) => x - (w - metrics.thumbX) / 2
  );

  const liquidOpacity = useTransform(grabProgress, [0, 1], [0, 0.75]);
  const liquidScale = useTransform(grabProgress, [0, 1], [0.85, 1.08]);
  const thumbOpacity = useTransform(grabProgress, [0, 1], [1, 0.3]);

  const dragStartX = useRef(0);
  const dragStartThumbX = useRef(0);
  const isDragging = useRef(false);
  const activePointerId = useRef(null);
  const suppressNextClick = useRef(false);

  const activeProgress = useTransform(thumbX, [0, thumbTravel], [0, 1]);
  const fillOpacity = useTransform(activeProgress, [0, 1], [0, 1]);
  const glowOpacity = useTransform(activeProgress, [0, 0.7, 1], [0, 0.2, 0.3]);
  const glowScale = useTransform(activeProgress, [0, 1], [0.85, 1]);

  useEffect(() => {
    if (activePointerId.current !== null) return;
    targetX.set(currentChecked ? thumbTravel : 0);
  }, [currentChecked, thumbTravel, targetX]);

  const setChecked = (next) => {
    if (next === currentChecked) {
      targetX.set(next ? thumbTravel : 0);
      return;
    }

    if (checked === undefined) {
      setUncontrolledChecked(next);
    }

    targetX.set(next ? thumbTravel : 0);
    onCheckedChange?.(next);
  };

  const handlePointerDown = (event) => {
    onPointerDown?.(event);
    if (event.defaultPrevented || disabled) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch (_) {
      // ignore
    }

    activePointerId.current = event.pointerId;
    grabTarget.set(1);
    dragStartX.current = event.clientX;
    dragStartThumbX.current = thumbX.get();
    targetX.set(dragStartThumbX.current);
    isDragging.current = false;
  };

  const handlePointerMove = (event) => {
    onPointerMove?.(event);
    if (event.defaultPrevented || disabled) return;
    if (activePointerId.current !== null && event.pointerId !== activePointerId.current) {
      return;
    }
    if (!event.currentTarget.hasPointerCapture?.(event.pointerId)) return;

    const deltaX = event.clientX - dragStartX.current;

    if (Math.abs(deltaX) > 3) {
      isDragging.current = true;
    }

    if (!isDragging.current) return;
    event.preventDefault();

    const nextX = dragStartThumbX.current + deltaX;
    targetX.set(clamp(nextX, 0, thumbTravel));
  };

  const handlePointerUp = (event) => {
    onPointerUp?.(event);
    if (activePointerId.current !== null && event.pointerId !== activePointerId.current) {
      return;
    }
    try {
      if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
    } catch (_) {
      // ignore
    }

    activePointerId.current = null;
    grabTarget.set(0);

    if (!isDragging.current) return;

    isDragging.current = false;
    suppressNextClick.current = true;
    setChecked(targetX.get() >= thumbTravel / 2);
  };

  const handlePointerCancel = (event) => {
    onPointerCancel?.(event);
    activePointerId.current = null;
    isDragging.current = false;
    grabTarget.set(0);
    targetX.set(currentChecked ? thumbTravel : 0);
  };

  const handleClick = (event) => {
    onClick?.(event);
    if (event.defaultPrevented || disabled) return;

    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      event.preventDefault();
      return;
    }

    setChecked(!currentChecked);
  };

  useEffect(() => {
    const stopFromWindow = () => {
      if (!isDragging.current && activePointerId.current === null) return;
      const wasDragging = isDragging.current;
      isDragging.current = false;
      activePointerId.current = null;
      grabTarget.set(0);
      if (!wasDragging) return;
      suppressNextClick.current = true;
      setChecked(targetX.get() >= thumbTravel / 2);
    };

    window.addEventListener('pointerup', stopFromWindow);
    window.addEventListener('pointercancel', stopFromWindow);
    window.addEventListener('blur', stopFromWindow);

    return () => {
      window.removeEventListener('pointerup', stopFromWindow);
      window.removeEventListener('pointercancel', stopFromWindow);
      window.removeEventListener('blur', stopFromWindow);
    };
  });

  const switchEl = (
    <button
      id={switchId}
      ref={ref}
      type={type}
      role="switch"
      aria-checked={currentChecked}
      data-sound="none"
      disabled={disabled}
      onClick={handleClick}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={(event) => onPointerLeave?.(event)}
      aria-label={typeof label === 'string' ? label : props['aria-label'] || 'Apple Switch'}
      className={`apple-switch-track ${className} ${disabled ? 'is-disabled' : ''}`}
      style={{
        width: metrics.trackX,
        height: metrics.trackY,
        ...style,
      }}
      {...props}
    >
      {/* Outer Atmospheric Glow */}
      <motion.span
        className="apple-switch-glow"
        style={{
          backgroundColor: colors.glow,
          opacity: glowOpacity,
          scale: glowScale,
        }}
      />

      {/* Track Base & Fill */}
      <span className="apple-switch-track-inner">
        <span
          className="apple-switch-track-off"
          style={{
            backgroundColor: colors.off,
          }}
        />
        <motion.span
          className="apple-switch-track-on"
          style={{
            backgroundColor: colors.on,
            opacity: fillOpacity,
          }}
        />
      </span>

      {/* Liquid Blur Layer */}
      <motion.span
        className="apple-switch-liquid-blur"
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          y: '-50%',
          x: thumbOffsetX,
          marginLeft: metrics.padding,
          width: thumbWidth,
          height: thumbHeight,
          opacity: liquidOpacity,
          scale: liquidScale,
        }}
      />

      {/* Physical Thumb - Guaranteed 100% Centered via y: -50% */}
      <motion.span
        className="apple-switch-thumb"
        style={{
          position: 'absolute',
          left: 0,
          top: '50%',
          y: '-50%',
          x: thumbOffsetX,
          marginLeft: metrics.padding,
          width: thumbWidth,
          height: thumbHeight,
          backgroundColor: colors.thumb,
          opacity: thumbOpacity,
        }}
      />
    </button>
  );

  if (!label) return switchEl;

  return (
    <label
      htmlFor={switchId}
      className={`apple-switch-label-wrap ${labelSide === 'left' ? 'is-left' : 'is-right'} ${
        disabled ? 'is-disabled' : ''
      }`}
    >
      {labelSide === 'left' && (
        <span className="apple-switch-text-col is-left">
          <span className="apple-switch-label">{label}</span>
          {description && <span className="apple-switch-description">{description}</span>}
        </span>
      )}
      {switchEl}
      {labelSide === 'right' && (
        <span className="apple-switch-text-col is-right">
          <span className="apple-switch-label">{label}</span>
          {description && <span className="apple-switch-description">{description}</span>}
        </span>
      )}
    </label>
  );
});

export default AppleSwitch;
