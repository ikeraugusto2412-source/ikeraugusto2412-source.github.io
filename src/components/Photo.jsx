import React from 'react';
import { responsiveImg, avifSrcSet, placeholderUrl } from '../lib/images';

// <picture> must not affect layout: the <img> keeps sizing and styling as if it were alone
const PICTURE_STYLE = { display: 'contents' };

/**
 * A site photo: AVIF for browsers that support it, WebP srcset otherwise, real width/height,
 * and (with `blur`) the photo's blurred preview painted behind it until it loads.
 * `as` swaps the <img> for another component with the same props (e.g. motion.img).
 */
export default function Photo({ src, sizes = '100vw', blur = false, as: Img = 'img', style, ...rest }) {
  const img = responsiveImg(src, sizes);
  const avif = avifSrcSet(src);
  const preview = blur ? placeholderUrl(src) : null;
  const photoStyle = preview
    ? {
        backgroundImage: `url(${preview})`,
        backgroundSize: 'cover',
        backgroundPosition: style?.objectPosition ?? 'center',
        ...style,
      }
    : style;

  return (
    <picture style={PICTURE_STYLE}>
      {avif && <source type="image/avif" srcSet={avif} sizes={sizes} />}
      <Img {...img} {...rest} style={photoStyle} />
    </picture>
  );
}
