/*
 * Language lives in the URL: English at the root (/works), Spanish under /es (/es/works).
 * Shared links therefore open in the language they were copied in, and Google can index both.
 */
export const LANGS = ['en', 'es'];
export const DEFAULT_LANG = 'en';

/** '/es/works' → { lang: 'es', path: '/works' }; '/works' → { lang: 'en', path: '/works' } */
export function splitLang(pathname) {
  const clean = pathname.length > 1 ? pathname.replace(/\/+$/, '') : pathname;
  if (clean === '/es' || clean.startsWith('/es/')) {
    return { lang: 'es', path: clean.slice(3) || '/' };
  }
  return { lang: DEFAULT_LANG, path: clean || '/' };
}

/** ('/works', 'es') → '/es/works'; ('/', 'es') → '/es'; ('/works', 'en') → '/works' */
export function localize(path, lang) {
  if (lang !== 'es') return path;
  return path === '/' ? '/es' : `/es${path}`;
}
