import React, { useEffect, useState } from 'react';
import { motion,  useSpring, useMotionValue } from 'framer-motion';
import './CustomCursor.css';

export default function CustomCursor() {
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const moveMouse = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleHoverStart = (e) => {
      if (e.target.closest('a') || e.target.closest('button') || e.target.closest('.project-card')) {
        setIsHovered(true);
      }
    };

    const handleHoverEnd = () => {
      setIsHovered(false);
    };

    window.addEventListener('mousemove', moveMouse);
    document.addEventListener('mouseover', handleHoverStart);
    document.addEventListener('mouseout', handleHoverEnd);

    return () => {
      window.removeEventListener('mousemove', moveMouse);
      document.removeEventListener('mouseover', handleHoverStart);
      document.removeEventListener('mouseout', handleHoverEnd);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className={`custom-cursor-ball ${isHovered ? 'hovered' : ''}`}
      style={{
        x: cursorX,
        y: cursorY,
        translateX: '-50%',
        translateY: '-50%'
      }}
    />
  );
}
