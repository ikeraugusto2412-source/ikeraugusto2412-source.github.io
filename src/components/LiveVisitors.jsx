import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import './LiveVisitors.css';

/*
 * "2 viewing now · 8 people have seen it" for one gallery (after twomuch.studio), read from
 * Umami through the website's public share link — the same read-only data anyone with that
 * link can see, so no secret key is involved. Set VITE_UMAMI_SHARE_ID to the id at the end of
 * the share URL (cloud.umami.is/share/<id>). Without it, or if Umami can't be reached, the
 * counter simply isn't shown.
 *
 * `path` is matched as "contains", so /project/x, /es/project/x and their trailing-slash
 * variants all count. "Now" is people on that gallery in the last 5 minutes (Umami's own
 * definition of active), since its realtime counter can't be filtered by page.
 */
const SHARE_ID = import.meta.env.VITE_UMAMI_SHARE_ID;
const API = 'https://cloud.umami.is/analytics/eu/api';
const SINCE = Date.UTC(2026, 0, 1);
const ACTIVE_MS = 5 * 60 * 1000;
const POLL_MS = 30000;

let session = null; // { websiteId, token }, shared by every counter on the page

async function getSession() {
  if (!session) {
    session = fetch(`${API}/share/${SHARE_ID}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(({ websiteId, token }) => ({ websiteId, token }));
    session.catch(() => {
      session = null;
    });
  }
  return session;
}

async function visitorsOn(path, startAt) {
  const { websiteId, token } = await getSession();
  const qs = new URLSearchParams({ startAt, endAt: Date.now(), path: `c.${path}` });
  // Umami only accepts a share token together with the share-context header
  const r = await fetch(`${API}/websites/${websiteId}/stats?${qs}`, {
    headers: { 'x-umami-share-token': token, 'x-umami-share-context': '1' },
  });
  if (!r.ok) throw new Error(String(r.status));
  const { visitors } = await r.json();
  return Number(typeof visitors === 'object' ? visitors?.value : visitors) || 0;
}

export default function LiveVisitors({ path }) {
  const { dict, language } = useLanguage();
  const t = dict.projectDetail;
  const [now, setNow] = useState(null);
  const [seen, setSeen] = useState(null);

  useEffect(() => {
    if (!SHARE_ID || !path) return undefined;
    let stop = false;
    const loadNow = () =>
      visitorsOn(path, Date.now() - ACTIVE_MS)
        .then((n) => !stop && setNow(n))
        .catch(() => {});
    visitorsOn(path, SINCE)
      .then((n) => !stop && setSeen(n))
      .catch(() => {});
    loadNow();
    const id = setInterval(() => document.visibilityState === 'visible' && loadNow(), POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, [path]);

  if (seen === null && now === null) return null;
  // The visitor reading this is always one of them (their own visit may not be counted yet)
  const viewing = Math.max(1, now ?? 1);
  const people = Math.max(viewing, seen ?? 0);
  const fmt = (n) => n.toLocaleString(language === 'es' ? 'es-ES' : 'en-GB');

  return (
    <div className="live-visitors" aria-live="polite">
      <span className="live-visitors-dot" aria-hidden="true" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.strong key={viewing} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
          {fmt(viewing)}
        </motion.strong>
      </AnimatePresence>
      <span>{t.liveNow}</span>
      <span className="live-visitors-sep" aria-hidden="true" />
      <strong>{fmt(people)}</strong>
      <span>{people === 1 ? t.seenOne : t.seenMany}</span>
    </div>
  );
}
