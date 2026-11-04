import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import './LiveVisitors.css';

/*
 * "3 viewing now · 1,248 visits" (after twomuch.studio), read from Umami through the
 * website's public share link — the same read-only data anyone with that link can see, so
 * no secret key is involved. Set VITE_UMAMI_SHARE_ID to the id at the end of the share URL
 * (cloud.umami.is/analytics/eu/share/<id>). Without it, or if Umami can't be reached, the
 * counter simply isn't shown.
 */
const SHARE_ID = import.meta.env.VITE_UMAMI_SHARE_ID;
const API = 'https://cloud.umami.is/analytics/eu/api';
const SINCE = Date.UTC(2026, 0, 1);
const POLL_MS = 30000;

const valueOf = (v) => (typeof v === 'object' && v !== null ? v.value : v);

let session = null; // { websiteId, token }, shared by every footer on the page

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

async function query(path) {
  const { websiteId, token } = await getSession();
  const r = await fetch(`${API}/websites/${websiteId}/${path}`, { headers: { 'x-umami-share-token': token } });
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}

export default function LiveVisitors() {
  const { dict, language } = useLanguage();
  const [online, setOnline] = useState(null);
  const [visits, setVisits] = useState(null);

  useEffect(() => {
    if (!SHARE_ID) return undefined;
    let stop = false;
    const loadActive = () =>
      query('active')
        .then((d) => !stop && setOnline(Number(d.visitors ?? d.x ?? valueOf(d)) || 0))
        .catch(() => {});
    query(`stats?startAt=${SINCE}&endAt=${Date.now()}`)
      .then((d) => !stop && setVisits(Number(valueOf(d.visits) ?? valueOf(d.pageviews)) || null))
      .catch(() => {});
    loadActive();
    const id = setInterval(() => document.visibilityState === 'visible' && loadActive(), POLL_MS);
    return () => {
      stop = true;
      clearInterval(id);
    };
  }, []);

  if (online === null && visits === null) return null;
  // The visitor reading this is always one of them
  const now = Math.max(1, online ?? 1);
  const t = dict.footer;

  return (
    <div className="live-visitors" aria-live="polite">
      <span className="live-visitors-dot" aria-hidden="true" />
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.strong key={now} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -8, opacity: 0 }}>
          {now}
        </motion.strong>
      </AnimatePresence>
      <span>{now === 1 ? t.liveOne : t.liveMany}</span>
      {visits !== null && (
        <>
          <span className="live-visitors-sep" aria-hidden="true" />
          <span>
            {visits.toLocaleString(language === 'es' ? 'es-ES' : 'en-GB')} {t.liveVisits}
          </span>
        </>
      )}
    </div>
  );
}
