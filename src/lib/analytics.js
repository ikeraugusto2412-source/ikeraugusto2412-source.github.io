/*
 * Privacy-friendly visit statistics with Umami (https://cloud.umami.is): no cookies, so no
 * consent banner. Only active in the published build when VITE_UMAMI_WEBSITE_ID is set.
 * Umami follows the app's page changes on its own; ?foto=… is ignored so opening photos in
 * the lightbox does not count as new pages, and visits are only counted on the real domain.
 */
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const SITE_URL = import.meta.env.VITE_SITE_URL;

if (import.meta.env.PROD && WEBSITE_ID) {
  const script = document.createElement('script');
  script.defer = true;
  script.src = 'https://cloud.umami.is/script.js';
  script.dataset.websiteId = WEBSITE_ID;
  script.dataset.excludeSearch = 'true';
  if (SITE_URL) script.dataset.domains = new URL(SITE_URL).hostname;
  document.head.appendChild(script);
}
