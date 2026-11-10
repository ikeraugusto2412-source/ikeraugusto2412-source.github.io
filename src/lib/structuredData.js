import { translations } from '../data/translations.js';
import { projects } from '../data/projects.js';
import { canonicalUrl, sentenceCase } from './seoMeta.js';

/*
 * schema.org data (JSON-LD) written into every published page at build time, so Google knows
 * who the site belongs to and what each page shows:
 * - every page: the site and the person (name, job, place, Instagram);
 * - galleries: the photos with author, copyright and licence page (Google Images can show the
 *   "Licensable" badge and credit), plus a breadcrumb Home › Works › gallery;
 * - video galleries: a VideoObject so the video can appear in video results.
 */
const INSTAGRAM = 'https://www.instagram.com/ikeraugusto_ph/';
const EMAIL = 'ikeraugusto2412@gmail.com';
const MAX_IMAGES = 20;

const JOB = { en: 'Photographer & Filmmaker', es: 'Fotógrafo y filmmaker' };
const KNOWS = {
  en: ['Photography', 'Filmmaking', 'Portrait photography', 'Event photography', 'Travel photography', 'Video editing'],
  es: ['Fotografía', 'Vídeo', 'Retrato', 'Fotografía de eventos', 'Fotografía de viajes', 'Edición de vídeo'],
};

const abs = (base, p) => base + encodeURI(p);

export function jsonLdFor(base, pagePath, lang) {
  const dict = translations[lang] ?? translations.en;
  const person = `${base}/#person`;
  const website = `${base}/#website`;
  const url = canonicalUrl(base, pagePath, lang);
  const legal = `${canonicalUrl(base, '/legal', lang)}#aviso`;
  const contact = canonicalUrl(base, '/contact', lang);

  const graph = [
    {
      '@type': 'WebSite',
      '@id': website,
      name: dict.seo.siteName,
      alternateName: dict.seo.defaultTitle,
      url: `${base}/`,
      inLanguage: ['en', 'es'],
      publisher: { '@id': person },
    },
    {
      '@type': 'Person',
      '@id': person,
      name: 'Iker Augusto',
      jobTitle: JOB[lang],
      description: dict.seo.defaultDescription,
      url: `${base}/`,
      image: `${base}/og-image.jpg`,
      email: `mailto:${EMAIL}`,
      address: { '@type': 'PostalAddress', addressLocality: 'Sitges', addressRegion: 'Barcelona', addressCountry: 'ES' },
      knowsAbout: KNOWS[lang],
      sameAs: [INSTAGRAM],
    },
  ];

  const crumbs = [{ name: dict.seo.siteName, url: canonicalUrl(base, '/', lang) }];

  const id = pagePath.match(/^\/project\/([^/]+)$/)?.[1];
  const project = id && projects.find((p) => p.id === id);
  if (project) {
    const description = project.description?.[lang] ?? project.description?.en;
    const year = String(project.year ?? '').match(/\d{4}/g)?.pop();
    const me = { '@type': 'Person', '@id': person, name: 'Iker Augusto' };
    const credit = {
      creator: me,
      creditText: 'Iker Augusto',
      copyrightNotice: `© ${year ?? ''} Iker Augusto`.replace('  ', ' '),
      copyrightHolder: me,
      license: legal,
      acquireLicensePage: contact,
    };
    const photos = [project.coverImage, ...(project.gridImages ?? [])]
      .filter((src, i, all) => src && all.indexOf(src) === i)
      .slice(0, MAX_IMAGES)
      .map((src) => ({ '@type': 'ImageObject', contentUrl: abs(base, src), ...credit }));

    graph.push({
      '@type': project.type === 'video' ? 'CollectionPage' : 'ImageGallery',
      '@id': `${url}#page`,
      url,
      name: project.title,
      description,
      inLanguage: lang,
      isPartOf: { '@id': website },
      author: { '@id': person },
      ...(year && { copyrightYear: Number(year) }),
      ...(project.location && { contentLocation: { '@type': 'Place', name: project.location } }),
      primaryImageOfPage: photos[0],
      image: photos,
    });

    const video = project.reel?.sources?.[0]?.src ?? project.videoSources?.[0]?.src ?? project.videoUrl;
    if (video && project.videoMeta) {
      graph.push({
        '@type': 'VideoObject',
        name: project.title,
        description,
        thumbnailUrl: [abs(base, project.reel?.poster ?? project.coverImage)],
        uploadDate: project.videoMeta.uploadDate,
        duration: project.videoMeta.duration,
        contentUrl: abs(base, video),
        embedUrl: url,
        inLanguage: lang,
        ...credit,
        author: { '@id': person },
      });
    }
    crumbs.push({ name: dict.nav.work, url: canonicalUrl(base, '/works', lang) }, { name: project.title, url });
  } else if (pagePath !== '/') {
    const label = { '/works': dict.nav.work, '/about': dict.nav.about, '/contact': dict.nav.contact, '/legal': dict.legal.title }[pagePath];
    if (label) crumbs.push({ name: label, url });
  }

  crumbs.forEach((c) => { c.name = sentenceCase(c.name, lang); });
  if (crumbs.length > 1) {
    graph.push({
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, item: c.url })),
    });
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}
