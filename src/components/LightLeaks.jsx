import { motion } from 'framer-motion';
import React from 'react';

import './LightLeaks.css';

export default function LightLeaks() {
  return (
    <div className="light-leaks-container">
      <motion.div 
        animate={{
          opacity: [0.1, 0.4, 0.1],
          x: [0, 50, 0],
          y: [0, -30, 0],
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 15, repeat: Infinity }}
        className="leak leak-1"
      />
      <motion.div 
        animate={{
          opacity: [0, 0.3, 0],
          x: [0, -40, 0],
          y: [0, 60, 0]
        }}
        transition={{ duration: 25, repeat: Infinity, delay: 2 }}
        className="leak leak-2"
      />
      <motion.div 
        animate={{
          opacity: [0, 0.2, 0],
          scale: [1, 1.5, 1]
        }}
        transition={{ duration: 20, repeat: Infinity, delay: 5 }}
        className="leak leak-3"
      />
    </div>
  );
}
