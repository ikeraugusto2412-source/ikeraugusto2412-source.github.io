import { thumbHashToDataURL } from 'thumbhash';
import imageMeta from '../data/imageMeta.json';

/*
 * Responsive photo helpers. `npm run images` writes smaller WebP/AVIF copies next to each photo
 * (/assets/ny/1.webp → /assets/ny/_w/1-640.webp, 1-640.avif, …, 1-full.avif) and records every
 * photo's real size and blurred preview (ThumbHash) in imageMeta.json: [width, height, hash].
 * Photos missing from the manifest fall back to the plain src.
 */
export const VARIANT_WIDTHS = [640, 1280];

const encode = (url) => encodeURI(url); // spaces in file names would break srcset

function variantUrl(src, suffix, ext = 'webp') {
  const slash = src.lastIndexOf('/');
  const name = src.slice(slash + 1).replace(/\.webp$/i, '');
  return `${src.slice(0, slash)}/_w/${name}-${suffix}.${ext}`;
}

/** Intrinsic [width, height] of a photo, or null if unknown. */
export function imageSize(src) {
  const meta = imageMeta[src];
  return meta ? [meta[0], meta[1]] : null;
}

/**
 * Props for an <img>: src, srcSet, sizes and width/height (so the browser reserves the
 * right space and lazy loading only fetches what is near the viewport).
 */
export function responsiveImg(src, sizes = '100vw') {
  const meta = imageMeta[src];
  if (!meta) return { src };
  const [w, h] = meta;
  const candidates = VARIANT_WIDTHS.filter((vw) => vw < w).map((vw) => `${encode(variantUrl(src, vw))} ${vw}w`);
  candidates.push(`${encode(src)} ${w}w`);
  return { src, srcSet: candidates.join(', '), sizes, width: w, height: h };
}

/** AVIF srcset for a <source type="image/avif">, or null when there are no AVIF copies. */
export function avifSrcSet(src) {
  const meta = imageMeta[src];
  if (!meta) return null;
  const w = meta[0];
  const candidates = VARIANT_WIDTHS.filter((vw) => vw < w).map((vw) => `${encode(variantUrl(src, vw, 'avif'))} ${vw}w`);
  candidates.push(`${encode(variantUrl(src, 'full', 'avif'))} ${w}w`);
  return candidates.join(', ');
}

/** Full-size AVIF of a photo (lightbox), or null. */
export function fullAvif(src) {
  return imageMeta[src] ? encode(variantUrl(src, 'full', 'avif')) : null;
}

/**
 * Smallest copy at least `minWidth` px wide — for places that take a single URL
 * (WebGL textures, video posters, canvas drawing).
 */
export function sizedSrc(src, minWidth) {
  const meta = imageMeta[src];
  if (!meta) return src;
  const fit = VARIANT_WIDTHS.find((vw) => vw >= minWidth && vw < meta[0]);
  return fit ? variantUrl(src, fit) : src;
}

const placeholderCache = new Map();

/** Blurred preview of a photo as a data: URL (decoded from its ThumbHash), or null. */
export function placeholderUrl(src) {
  const hash = imageMeta[src]?.[2];
  if (!hash) return null;
  if (!placeholderCache.has(src)) {
    const bytes = Uint8Array.from(atob(hash), (c) => c.charCodeAt(0));
    placeholderCache.set(src, thumbHashToDataURL(bytes));
  }
  return placeholderCache.get(src);
}
