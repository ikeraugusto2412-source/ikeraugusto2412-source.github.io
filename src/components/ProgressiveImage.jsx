import React from 'react';
import Photo from './Photo';

/**
 * Gallery photo: AVIF/WebP srcset with real width/height (so lazy loading only fetches what is
 * near the viewport) and a blurred preview until it loads. `priority` is for the page's hero
 * photo: loaded first instead of lazily. With `onClick` it behaves as a button, so keyboard
 * users can open it too.
 */
export default function ProgressiveImage({ src, alt, className = '', onClick, style, sizes = '100vw', priority = false }) {
  const interactive = onClick
    ? {
        onClick,
        role: 'button',
        tabIndex: 0,
        onKeyDown: (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(e);
          }
        },
      }
    : {};

  return (
    <Photo
      src={src}
      sizes={sizes}
      blur
      alt={alt}
      className={className}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      draggable={false}
      style={style}
      {...interactive}
    />
  );
}
