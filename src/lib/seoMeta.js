import { translations } from '../data/translations.js';
import { projects } from '../data/projects.js';
import { LANGS, localize } from './i18nPath.js';

/*
 * Title, description and share image of every page, in both languages. Used by <Seo> in the
 * browser and by the build (vite.config.js), which writes one HTML file per page so link
 * previews (WhatsApp, Instagram, X…) and search engines see the right data without JavaScript.
 */

// Menu labels are written in capitals ("SOBRE MÍ"); a title reads better as "Sobre mí"
function sentenceCase(text, lang) {
  if (text !== text.toLocaleUpperCase(lang)) return text;
  const lower = text.toLocaleLowerCase(lang);
  return lower.charAt(0).toLocaleUpperCase(lang) + lower.slice(1);
}

/** Pages that exist for every language (path without the language prefix). */
export const STATIC_PATHS = ['/', '/works', '/about', '/contact', ...projects.map((p) => `/project/${p.id}`)];

/** Share image of a project, generated at build time from its cover. */
export const projectOgImage = (id) => `/og/${id}.jpg`;

export function metaFor(path, lang) {
  const dict = translations[lang] ?? translations.en;
  const page = (label, description, image = '/og-image.jpg') => ({
    title: `${sentenceCase(label, lang)} — ${dict.seo.siteName}`,
    description,
    image,
    found: true,
  });

  if (path === '/') return { title: dict.seo.defaultTitle, description: dict.seo.defaultDescription, image: '/og-image.jpg', found: true };
  if (path === '/works') return page(dict.nav.work, dict.seo.worksDescription);
  if (path === '/about') return page(dict.nav.about, dict.seo.aboutDescription);
  if (path === '/contact') return page(dict.nav.contact, dict.seo.contactDescription);

  const projectId = path.match(/^\/project\/([^/]+)$/)?.[1];
  const project = projectId && projects.find((p) => p.id === projectId);
  if (project) {
    return page(project.title, project.description?.[lang] ?? project.description?.en, projectOgImage(project.id));
  }
  return { ...page(dict.projectDetail.pageNotFound, dict.seo.defaultDescription), found: false };
}

/** Canonical address of a page. Static hosts serve /works/index.html as /works/, so keep the slash. */
export function canonicalUrl(origin, path, lang) {
  const localized = localize(path, lang);
  return `${origin}${localized === '/' ? '/' : `${localized}/`}`;
}

/** hreflang alternates: the same page in each language plus x-default (English). */
export function alternates(origin, path) {
  return [
    ...LANGS.map((l) => ({ hreflang: l, href: canonicalUrl(origin, path, l) })),
    { hreflang: 'x-default', href: canonicalUrl(origin, path, 'en') },
  ];
}
