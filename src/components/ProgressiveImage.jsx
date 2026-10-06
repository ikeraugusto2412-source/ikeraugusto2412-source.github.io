import React, { useState } from 'react';

export default function ProgressiveImage({ src, alt, className = '', onClick, style }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      onClick={onClick}
      onLoad={() => setLoaded(true)}
      style={{
        ...style,
        opacity: loaded ? 1 : 0.85,
        transition: 'opacity 0.3s ease',
      }}
    />
  );
}
