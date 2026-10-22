/*
 * Privacy-friendly visit counter (GoatCounter: no cookies, so no consent banner needed).
 * Only active in the published build and when VITE_GOATCOUNTER_CODE is set
 * (the "code" of https://<code>.goatcounter.com). Counts every page change of the app.
 */
const CODE = import.meta.env.VITE_GOATCOUNTER_CODE;
const ENABLED = import.meta.env.PROD && Boolean(CODE);
let queued = [];

if (ENABLED) {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = `https://${CODE}.goatcounter.com/count`;
  // We count route changes ourselves; don't also count the first load automatically
  script.dataset.goatcounterSettings = JSON.stringify({ no_onload: true });
  script.addEventListener('load', () => {
    queued.forEach((path) => window.goatcounter?.count?.({ path }));
    queued = [];
  });
  document.head.appendChild(script);
}

export function trackPageView(path) {
  if (!ENABLED) return;
  if (window.goatcounter?.count) window.goatcounter.count({ path });
  else queued.push(path);
}
