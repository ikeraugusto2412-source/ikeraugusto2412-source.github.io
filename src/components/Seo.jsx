import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { splitLang } from '../lib/i18nPath';
import { metaFor, canonicalUrl, alternates } from '../lib/seoMeta';

const SITE_URL = (import.meta.env.VITE_SITE_URL || '').replace(/\/$/, '');

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setLink(selector, attrs) {
  let el = document.head.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
}

/**
 * Keeps <title>, description, Open Graph, canonical and hreflang in sync with the current page
 * while browsing. The build writes the same tags into each page's HTML (see seoMeta.js).
 */
export default function Seo() {
  const { pathname } = useLocation();
  const { lang, path } = splitLang(pathname);

  useEffect(() => {
    const origin = SITE_URL || window.location.origin;
    const meta = metaFor(path, lang);
    document.title = meta.title;
    setMeta('name', 'description', meta.description);
    setMeta('name', 'robots', meta.found ? 'index, follow' : 'noindex');
    setMeta('property', 'og:title', meta.title);
    setMeta('property', 'og:description', meta.description);
    setMeta('property', 'og:locale', lang === 'es' ? 'es_ES' : 'en_US');
    setMeta('property', 'og:url', canonicalUrl(origin, path, lang));
    setMeta('property', 'og:image', origin + meta.image);
    setLink('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl(origin, path, lang) });
    alternates(origin, path).forEach(({ hreflang, href }) =>
      setLink(`link[rel="alternate"][hreflang="${hreflang}"]`, { rel: 'alternate', hreflang, href }),
    );
  }, [path, lang]);

  return null;
}
