import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { projects } from './src/data/projects.js'
import { LANGS, localize } from './src/lib/i18nPath.js'
import { STATIC_PATHS, metaFor, canonicalUrl, alternates, projectOgImage } from './src/lib/seoMeta.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUT_DIR = path.resolve(__dirname, 'dist')

const escapeAttr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')

/** The built index.html with one page's language, title, description and share tags. */
function pageHtml(template, base, pagePath, lang, meta) {
  const setMeta = (html, attr, key, value) =>
    html.replace(new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`), `$1${escapeAttr(value)}$2`)

  let html = template
    .replace(/<html lang="[^"]*"/, `<html lang="${lang}"`)
    .replace(/<title>[^<]*<\/title>/, `<title>${escapeAttr(meta.title)}</title>`)
  html = setMeta(html, 'name', 'description', meta.description)
  html = setMeta(html, 'name', 'robots', meta.found ? 'index, follow' : 'noindex')
  html = setMeta(html, 'property', 'og:title', meta.title)
  html = setMeta(html, 'property', 'og:description', meta.description)
  html = setMeta(html, 'property', 'og:locale', lang === 'es' ? 'es_ES' : 'en_US')
  html = setMeta(html, 'property', 'og:image', base + meta.image)
  html = setMeta(html, 'property', 'og:image:alt', meta.title)

  const links = meta.found
    ? [
        `<meta property="og:url" content="${canonicalUrl(base, pagePath, lang)}" />`,
        `<link rel="canonical" href="${canonicalUrl(base, pagePath, lang)}" />`,
        ...alternates(base, pagePath).map(({ hreflang, href }) => `<link rel="alternate" hreflang="${hreflang}" href="${href}" />`),
      ]
    : []
  return html.replace('</head>', `    ${links.join('\n    ')}\n  </head>`)
}

/**
 * Build-time SEO for a static host (GitHub Pages):
 * - one HTML file per page and language (/works/index.html, /es/works/index.html…) so link
 *   previews and search engines get the right title, description and image without JavaScript;
 * - a 1200×630 share image per project, made from its cover;
 * - robots.txt, sitemap.xml (both languages) and 404.html (unknown URLs still load the app);
 * - drops macOS .DS_Store files from the output.
 * VITE_SITE_URL (e.g. https://ikeraugusto2412-source.github.io) makes the URLs absolute.
 */
function siteMeta(siteUrl) {
  const base = (siteUrl || '').replace(/\/$/, '')

  return {
    name: 'site-meta',
    apply: 'build',
    transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', base),
    generateBundle() {
      const robots = ['User-agent: *', 'Allow: /']
      if (base) robots.push('', `Sitemap: ${base}/sitemap.xml`)
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots.join('\n') + '\n' })

      if (base) {
        const urls = STATIC_PATHS.flatMap((p) => LANGS.map((l) => `  <url><loc>${canonicalUrl(base, p, l)}</loc></url>`))
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`,
        })
      }
    },
    async closeBundle() {
      const template = fs.readFileSync(path.join(OUT_DIR, 'index.html'), 'utf8')

      for (const lang of LANGS) {
        for (const pagePath of STATIC_PATHS) {
          const localized = localize(pagePath, lang)
          const file = path.join(OUT_DIR, localized === '/' ? 'index.html' : `${localized.slice(1)}/index.html`)
          fs.mkdirSync(path.dirname(file), { recursive: true })
          fs.writeFileSync(file, pageHtml(template, base, pagePath, lang, metaFor(pagePath, lang)))
        }
      }
      fs.writeFileSync(path.join(OUT_DIR, '404.html'), pageHtml(template, base, '/404', 'en', metaFor('/404', 'en')))

      // Share images for projects (cropped to the interesting part of the cover)
      await Promise.all(
        projects.map(async (p) => {
          const out = path.join(OUT_DIR, projectOgImage(p.id))
          fs.mkdirSync(path.dirname(out), { recursive: true })
          await sharp(path.join(__dirname, 'public', decodeURI(p.coverImage)))
            .resize(1200, 630, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 82, mozjpeg: true })
            .toFile(out)
        }),
      )

      const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name)
          if (entry.isDirectory()) walk(full)
          else if (entry.name === '.DS_Store') fs.rmSync(full)
        }
      }
      walk(OUT_DIR)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, 'VITE_')
  return {
    plugins: [react(), siteMeta(env.VITE_SITE_URL)],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
  }
})
