import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { addComment, commentsEnabled, listComments } from '../lib/comments';
import { playSound } from '../audio/sound';
import './ReelComments.css';

/*
 * The reel's comment sheet, like Instagram's: slides up over the video, lists the comments
 * (oldest first) and lets anyone add one with a name. The name is remembered on this device;
 * a short cooldown and a hidden honeypot field keep casual spam out.
 */
const NAME_KEY = 'ik-comment-name';
const LAST_KEY = 'ik-comment-last';
const COOLDOWN_MS = 30000;

const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } },
};

function timeAgo(iso, locale) {
  const s = (new Date(iso).getTime() - Date.now()) / 1000;
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'short' });
  const units = [['year', 31536000], ['month', 2592000], ['week', 604800], ['day', 86400], ['hour', 3600], ['minute', 60]];
  for (const [u, n] of units) if (Math.abs(s) >= n) return rtf.format(Math.round(s / n), u);
  return rtf.format(0, 'second');
}

const initial = (name) => (name.trim()[0] || '?').toUpperCase();
const hue = (name) => [...name].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7);

export default function ReelComments({ project, onClose, onCount }) {
  const { dict, language } = useLanguage();
  const t = dict.reel.comments;
  const locale = language === 'es' ? 'es-ES' : 'en-GB';
  const [items, setItems] = useState(null); // null = loading
  const [failed, setFailed] = useState(false);
  const [name, setName] = useState(() => store.get(NAME_KEY) || '');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!commentsEnabled) return undefined;
    let stop = false;
    listComments(project)
      .then((rows) => { if (!stop) { setItems(rows); onCount?.(rows.length); } })
      .catch(() => !stop && setFailed(true));
    return () => { stop = true; };
  }, [project, onCount]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [items]);

  const submit = async (e) => {
    e.preventDefault();
    if (sending || !name.trim() || !body.trim()) return;
    if (e.currentTarget.elements.website?.value) return; // honeypot: only bots fill it in
    const last = Number(store.get(LAST_KEY)) || 0;
    if (Date.now() - last < COOLDOWN_MS) {
      setNotice(t.wait);
      return;
    }
    setSending(true);
    setNotice('');
    try {
      const row = await addComment(project, name, body);
      store.set(NAME_KEY, name.trim());
      store.set(LAST_KEY, String(Date.now()));
      setItems((list) => {
        const next = [...(list ?? []), row];
        onCount?.(next.length);
        return next;
      });
      setBody('');
      playSound('click');
    } catch {
      setNotice(t.error);
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div
      className="reel-comments"
      role="dialog"
      aria-label={t.title}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 320, damping: 34 }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="reel-comments-head">
        <span className="reel-comments-grip" aria-hidden="true" />
        <strong>{t.title}</strong>
        <button type="button" onClick={onClose} aria-label={t.close}>×</button>
      </div>

      <div className="reel-comments-list" ref={listRef}>
        {!commentsEnabled && <p className="reel-comments-empty">{t.soon}</p>}
        {commentsEnabled && failed && <p className="reel-comments-empty">{t.loadError}</p>}
        {commentsEnabled && !failed && items === null && <p className="reel-comments-empty">…</p>}
        {items?.length === 0 && (
          <div className="reel-comments-empty">
            <b>{t.emptyTitle}</b>
            <span>{t.empty}</span>
          </div>
        )}
        {items?.map((c) => (
          <div key={c.id} className="reel-comment">
            <span className="reel-comment-avatar" style={{ background: `hsl(${hue(c.name)} 45% 38%)` }} aria-hidden="true">
              {initial(c.name)}
            </span>
            <div>
              <div className="reel-comment-meta">
                <b>{c.name}</b>
                <time dateTime={c.created_at}>{timeAgo(c.created_at, locale)}</time>
              </div>
              <p>{c.body}</p>
            </div>
          </div>
        ))}
      </div>

      {commentsEnabled && (
        <form className="reel-comments-form" onSubmit={submit}>
          {notice && <p className="reel-comments-notice" role="status">{notice}</p>}
          <input type="text" name="website" tabIndex={-1} autoComplete="off" className="reel-comments-hp" aria-hidden="true" />
          <div className="reel-comments-row">
            <span className="reel-comment-avatar" style={{ background: `hsl(${hue(name || '?')} 45% 38%)` }} aria-hidden="true">
              {initial(name || '?')}
            </span>
            <div className="reel-comments-fields">
              {!store.get(NAME_KEY) && (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 40))}
                  placeholder={t.namePlaceholder}
                  aria-label={t.namePlaceholder}
                  maxLength={40}
                  required
                />
              )}
              <input
                ref={inputRef}
                type="text"
                value={body}
                onChange={(e) => setBody(e.target.value.slice(0, 500))}
                placeholder={t.placeholder}
                aria-label={t.placeholder}
                maxLength={500}
                required
              />
            </div>
            <button type="submit" disabled={sending || !name.trim() || !body.trim()}>
              {sending ? '…' : t.post}
            </button>
          </div>
        </form>
      )}
    </motion.div>
  );
}
