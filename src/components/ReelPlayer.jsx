import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { sileo } from 'sileo';
import { useLanguage } from '../context/LanguageContext';
import { playSound } from '../audio/sound';
import { commentsEnabled, listComments } from '../lib/comments';
import ReelComments from './ReelComments';
import './ReelPlayer.css';

/*
 * A vertical video shown the way it would look as an Instagram reel: header, action rail on the
 * right, account + caption + audio at the bottom and a thin progress bar. It plays muted and
 * looped while on screen, like the app: tap toggles the sound, double-tap likes (big heart),
 * press and hold pauses. Comments are real (ReelComments); like / save only live in this visit,
 * and there are no made-up counts.
 */
const INSTAGRAM = 'https://www.instagram.com/ikeraugusto_ph/';
const HOLD_MS = 260;

// The 4K file only for tall, sharp screens on a connection that isn't saving data
function pickSource(sources) {
  const bySize = [...sources].sort((a, b) => a.height - b.height);
  const big = window.innerHeight * (window.devicePixelRatio || 1) >= 2200 && !navigator.connection?.saveData;
  return (big ? bySize[bySize.length - 1] : bySize[0])?.src;
}

const Icon = {
  heart: (filled) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M16.8 3.9c-1.9 0-3.6 1-4.8 2.6-1.2-1.6-2.9-2.6-4.8-2.6C4.2 3.9 2 6.4 2 9.4c0 5.6 8.3 10.5 9.6 11.2.3.2.6.2.8 0C13.7 19.9 22 15 22 9.4c0-3-2.2-5.5-5.2-5.5Z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
  comment: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20.7 16.9A9.5 9.5 0 1 0 17 20.6L21.5 22Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 3 9.2 10.1M22 3l-7.9 18-4.9-10.9L2 6.6Z" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
  save: (filled) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19 21 12 14.9 5 21V3h14Z" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.6" fill="currentColor" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
      <circle cx="19" cy="12" r="1.6" fill="currentColor" />
    </svg>
  ),
  camera: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h2l1.5-2h6l1.5 2h2A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.6" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  ),
  sound: (on) => (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4Z" fill="currentColor" />
      {on ? (
        <path d="M15.5 9a4.2 4.2 0 0 1 0 6M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      ) : (
        <path d="m15.5 9.5 5 5m0-5-5 5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      )}
    </svg>
  ),
  note: (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M9 18V5l11-2v13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <circle cx="6.5" cy="18" r="2.5" fill="currentColor" />
      <circle cx="17.5" cy="16" r="2.5" fill="currentColor" />
    </svg>
  ),
};

export default function ReelPlayer({ project, sources, poster, caption, description, avatar }) {
  const { dict } = useLanguage();
  const t = dict.reel;
  const boxRef = useRef(null);
  const videoRef = useRef(null);
  const holdTimer = useRef(null);
  const tapTimer = useRef(null);
  const held = useRef(false);
  const [src] = useState(() => pickSource(sources));
  const [muted, setMuted] = useState(true);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hearts, setHearts] = useState([]);
  const [soundFlash, setSoundFlash] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  // Real number of comments under the icon (nothing shown while there are none)
  useEffect(() => {
    if (!commentsEnabled || !project) return undefined;
    let stop = false;
    listComments(project).then((rows) => !stop && setCommentCount(rows.length)).catch(() => {});
    return () => { stop = true; };
  }, [project]);

  // Plays only while on screen, like the feed
  useEffect(() => {
    const video = videoRef.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.5 },
    );
    io.observe(boxRef.current);
    return () => io.disconnect();
  }, []);

  useEffect(() => () => {
    clearTimeout(holdTimer.current);
    clearTimeout(tapTimer.current);
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;
    video.muted = !video.muted;
    setMuted(video.muted);
    setSoundFlash((n) => n + 1);
    if (video.paused) video.play().catch(() => {});
  };

  const like = (x, y) => {
    setLiked(true);
    playSound('click');
    const id = Date.now();
    setHearts((h) => [...h, { id, x, y, r: Math.random() * 30 - 15 }]);
    setTimeout(() => setHearts((h) => h.filter((v) => v.id !== id)), 900);
  };

  // Tap = sound, double tap = like, press and hold = pause
  const onPointerDown = () => {
    held.current = false;
    holdTimer.current = setTimeout(() => {
      held.current = true;
      videoRef.current.pause();
      setPaused(true);
    }, HOLD_MS);
  };
  const onPointerUp = (e) => {
    clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      videoRef.current.play().catch(() => {});
      setPaused(false);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - r.left;
    const y = e.clientY - r.top;
    if (tapTimer.current) {
      clearTimeout(tapTimer.current);
      tapTimer.current = null;
      like(x, y);
    } else {
      tapTimer.current = setTimeout(() => {
        tapTimer.current = null;
        toggleSound();
      }, 240);
    }
  };
  const onPointerCancel = () => {
    clearTimeout(holdTimer.current);
    if (held.current) {
      held.current = false;
      videoRef.current.play().catch(() => {});
      setPaused(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: caption, url }).catch(() => {});
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      sileo.success({ title: dict.projectDetail.linkCopiedTitle, description: dict.projectDetail.linkCopiedDesc });
    } catch {
      sileo.error({ title: dict.projectDetail.linkCopyFailed, description: url });
    }
  };

  return (
    <div className="reel" ref={boxRef}>
      <video
        ref={videoRef}
        className="reel-video"
        src={src}
        poster={poster}
        muted={muted}
        loop
        playsInline
        preload="metadata"
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime / (e.currentTarget.duration || 1))}
      />

      {/* Tap surface (behind the buttons) */}
      <div
        className="reel-tap"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        onPointerLeave={onPointerCancel}
        onContextMenu={(e) => e.preventDefault()}
        role="button"
        tabIndex={0}
        aria-label={muted ? t.soundOn : t.soundOff}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleSound();
          }
        }}
      />

      <div className="reel-shade reel-shade--top" />
      <div className="reel-shade reel-shade--bottom" />

      <div className="reel-top">
        <strong>{t.header}</strong>
        <span className="reel-icon">{Icon.camera}</span>
      </div>

      <AnimatePresence>
        {soundFlash > 0 && (
          <motion.span
            key={soundFlash}
            className="reel-sound-flash"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.9] }}
            transition={{ duration: 0.9, times: [0, 0.15, 0.7, 1] }}
            aria-hidden="true"
          >
            {Icon.sound(!muted)}
          </motion.span>
        )}
      </AnimatePresence>

      {hearts.map((h) => (
        <motion.span
          key={h.id}
          className="reel-heart"
          style={{ left: h.x, top: h.y, rotate: h.r }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.25, 1, 1.1], opacity: [0, 1, 1, 0], y: [0, 0, 0, -60] }}
          transition={{ duration: 0.85, times: [0, 0.2, 0.55, 1] }}
          aria-hidden="true"
        >
          {Icon.heart(true)}
        </motion.span>
      ))}

      {paused && <span className="reel-paused" aria-hidden="true" />}

      <div className="reel-rail">
        <button type="button" className={liked ? 'is-liked' : ''} onClick={() => { setLiked((v) => !v); if (!liked) playSound('click'); }} aria-pressed={liked} aria-label={t.like}>
          <motion.span key={String(liked)} initial={{ scale: liked ? 0.6 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
            {Icon.heart(liked)}
          </motion.span>
          <small>{t.like}</small>
        </button>
        <button type="button" onClick={() => setCommentsOpen(true)} aria-label={t.comment} aria-expanded={commentsOpen}>
          {Icon.comment}
          <small>{commentCount > 0 ? commentCount : t.comment}</small>
        </button>
        <button type="button" onClick={share} aria-label={t.share}>
          {Icon.send}
          <small>{t.share}</small>
        </button>
        <button type="button" className={saved ? 'is-saved' : ''} onClick={() => setSaved((v) => !v)} aria-pressed={saved} aria-label={t.save}>
          {Icon.save(saved)}
        </button>
        <span className="reel-more" aria-hidden="true">{Icon.more}</span>
        <img className="reel-audio-thumb" src={avatar} alt="" />
      </div>

      <div className="reel-bottom">
        <div className="reel-account">
          <img src={avatar} alt="" />
          <strong>ikeraugusto_ph</strong>
          <a href={INSTAGRAM} target="_blank" rel="noopener noreferrer" className="reel-follow">{t.follow}</a>
        </div>
        <p className={`reel-caption ${expanded ? 'is-open' : ''}`}>
          {caption}
          {description && !expanded && (
            <button type="button" onClick={() => setExpanded(true)}>… {t.more}</button>
          )}
          {expanded && <span className="reel-desc"> {description}</span>}
        </p>
        <div className="reel-audio">
          <span className="reel-icon reel-icon--sm">{Icon.note}</span>
          <span className="reel-audio-track">
            <span>ikeraugusto_ph · {t.audio}</span>
            <span aria-hidden="true">ikeraugusto_ph · {t.audio}</span>
          </span>
        </div>
      </div>

      <button type="button" className="reel-mute" onClick={toggleSound} aria-label={muted ? t.soundOn : t.soundOff}>
        {Icon.sound(!muted)}
      </button>

      <AnimatePresence>
        {commentsOpen && (
          <ReelComments project={project} onClose={() => setCommentsOpen(false)} onCount={setCommentCount} />
        )}
      </AnimatePresence>

      <div className="reel-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progress})` }} />
      </div>
    </div>
  );
}
