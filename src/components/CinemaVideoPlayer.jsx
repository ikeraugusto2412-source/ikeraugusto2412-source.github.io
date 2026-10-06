import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import './CinemaVideoPlayer.css';

// 64x36 px canvas sampling frame colors with requestAnimationFrame
// Upscaled via heavy CSS blur — exactly like YouTube Ambient Mode
const CANVAS_W = 64;
const CANVAS_H = 36;

export default function CinemaVideoPlayer({
  src,
  poster,
  title,
  blurAmount = 65,
  intensity = 0.85,
  ambientGlow = true,
  autoPlay = false,
  muted = false,
}) {
  const { dict } = useLanguage();
  const yt = dict?.youtubePlayer || {};
  const currentTitle = title || yt.videoTitle || 'Norway 4K — The Nordic Fjords & Endless Highways [Video Blog]';

  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);
  const controlsTimeout = useRef(null);
  const toastTimeout = useRef(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAmbientActive, setIsAmbientActive] = useState(ambientGlow);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(muted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTheater, setIsTheater] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);

  // Scrubber hover state
  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isHoveringScrubber, setIsHoveringScrubber] = useState(false);

  // YouTube Watch Page Interaction states
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [liked, setLiked] = useState(false);
  const [disliked, setDisliked] = useState(false);
  const [likesCount, setLikesCount] = useState(24810);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const triggerToast = (msg) => {
    setToastMessage(msg);
    clearTimeout(toastTimeout.current);
    toastTimeout.current = setTimeout(() => setToastMessage(''), 2500);
  };

  // Format mm:ss or hh:mm:ss
  const formatTime = (timeInSec) => {
    if (isNaN(timeInSec) || timeInSec < 0) return '0:00';
    const hrs = Math.floor(timeInSec / 3600);
    const mins = Math.floor((timeInSec % 3600) / 60);
    const secs = Math.floor(timeInSec % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handleSeek = (e) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleScrubberMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPosition(pos * 100);
    setHoverTime(pos * duration);
    setIsHoveringScrubber(true);
  };

  const handleScrubberMouseLeave = () => {
    setIsHoveringScrubber(false);
    setHoverTime(null);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
  };

  const changeSpeed = (speed) => {
    setPlaybackRate(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
    setIsSpeedMenuOpen(false);
    setIsSettingsOpen(false);
    triggerToast(`${yt.speed || 'Velocidad'}: ${speed === 1 ? (yt.normal || 'Normal') : speed + 'x'}`);
  };

  const toggleFullscreen = () => {
    const container = playerContainerRef.current;
    if (!container) return;
    if (document.fullscreenElement || document.webkitFullscreenElement) {
      (document.exitFullscreen || document.webkitExitFullscreen)?.call(document)?.catch?.(() => {});
      setIsFullscreen(false);
      return;
    }
    const request = container.requestFullscreen || container.webkitRequestFullscreen;
    if (request) {
      // Desktop / Android / iPad: element fullscreen keeps the custom controls
      Promise.resolve(request.call(container)).catch(() => {});
      setIsFullscreen(true);
    } else if (videoRef.current?.webkitEnterFullscreen) {
      // iPhone Safari only allows the native video player in fullscreen
      videoRef.current.webkitEnterFullscreen();
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (isPlaying && !isSettingsOpen) setShowControls(false);
    }, 2800);
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!(document.fullscreenElement || document.webkitFullscreenElement));
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
      clearTimeout(controlsTimeout.current);
      clearTimeout(toastTimeout.current);
    };
  }, []);

  // Pre-render poster onto ambient canvas on mount
  useEffect(() => {
    if (!poster) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = poster;
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        try {
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        } catch {
          // ignore
        }
      }
    };
  }, [poster]);

  // YouTube Ambient Mode real-time frame render loop
  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || !isAmbientActive) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      if (!video.paused && !video.ended && video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
        } catch {
          // ignore
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [isAmbientActive]);

  const handleLike = () => {
    if (liked) {
      setLiked(false);
      setLikesCount((prev) => prev - 1);
    } else {
      setLiked(true);
      setLikesCount((prev) => prev + 1);
      if (disliked) setDisliked(false);
      triggerToast(yt.likedToast || 'Añadido a tus vídeos que te gustan');
    }
  };

  const handleDislike = () => {
    if (disliked) {
      setDisliked(false);
    } else {
      setDisliked(true);
      if (liked) {
        setLiked(false);
        setLikesCount((prev) => prev - 1);
      }
    }
  };

  const handleSubscribe = () => {
    setIsSubscribed((prev) => {
      const next = !prev;
      triggerToast(next ? (yt.subAddedToast || '¡Suscripción añadida!') : (yt.subRemovedToast || 'Suscripción cancelada'));
      return next;
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    triggerToast(yt.copiedToast || 'Enlace copiado al portapapeles');
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`yt-ambient-wrapper ${isTheater ? 'theater-mode' : ''}`}>
      {/* Toast feedback */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            className="yt-toast"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ambient Glow Canvas — YouTube ambient mode.
          Surrounds video player and softly diffuses onto the YouTube title and description */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-hidden="true"
        className="yt-ambient-glow-canvas"
        style={{
          filter: `blur(${blurAmount}px)`,
          opacity: isAmbientActive && !isFullscreen ? intensity : 0,
        }}
      />

      {/* Main YouTube Video Player */}
      <div
        ref={playerContainerRef}
        className={`yt-player-box ${isFullscreen ? 'fullscreen' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && !isSettingsOpen && setShowControls(false)}
      >
        {/* Video element */}
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          preload="metadata"
          playsInline
          autoPlay={autoPlay}
          muted={muted}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
          className="yt-video-element"
        />

        {/* Big YouTube Red Play Button (Overlay when paused before play) */}
        <AnimatePresence>
          {!isPlaying && (
            <motion.div
              className="yt-big-play-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={togglePlay}
            >
              <div className="yt-big-play-button" aria-label={yt.playTooltip || 'Reproducir'}>
                <svg viewBox="0 0 68 48" width="68" height="48" className="yt-big-play-svg">
                  <path
                    className="yt-big-play-bg"
                    d="M66.52,7.74c-0.78-2.93-2.49-5.41-5.42-6.19C55.79,.13,34,0,34,0S12.21,.13,6.9,1.55 C3.97,2.33,2.27,4.81,1.48,7.74C0.06,13.05,0,24,0,24s0.06,10.95,1.48,16.26c0.78,2.93,2.49,5.41,5.42,6.19 C12.21,47.87,34,48,34,48s21.79-0.13,27.1-1.55c2.93-0.78,4.64-3.26,5.42-6.19C67.94,34.95,68,24,68,24S67.94,13.05,66.52,7.74z"
                  />
                  <path d="M 45,24 27,14 27,34" fill="#ffffff" />
                </svg>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* YouTube Top Title Bar */}
        <div className={`yt-player-top ${showControls || !isPlaying ? 'visible' : ''}`}>
          <div className="yt-top-title-wrap">
            <img src="/assets/profile/me.webp" alt="Iker Augusto" className="yt-top-channel-avatar" />
            <span className="yt-top-video-title">{currentTitle}</span>
          </div>
          <div className="yt-top-actions">
            <button className="yt-top-btn" onClick={handleShare} title={yt.share || 'Compartir'} aria-label={yt.share || 'Compartir'}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                <path d="M15 5.63 20.66 12 15 18.37V14h-1c-3.96 0-7.14 1-9.75 3.09 1.84-4.07 5.11-6.4 9.89-7.1l.86-.13V5.63M14 3v6C6.22 10.13 3.11 15.33 2 21c2.78-3.97 6.44-6 12-6v6l8-9-8-9z" />
              </svg>
            </button>
            <div className="yt-brand-pill">
              <span className="yt-red-dot" /> YouTube Ambient
            </div>
          </div>
        </div>

        {/* YouTube Bottom Controls Bar */}
        <div className={`yt-player-controls ${showControls || !isPlaying ? 'visible' : ''}`}>
          {/* Red Progress Bar / Scrubber */}
          <div
            className="yt-scrubber-container"
            onClick={handleSeek}
            onMouseMove={handleScrubberMouseMove}
            onMouseLeave={handleScrubberMouseLeave}
          >
            {/* Scrubber Hover Tooltip */}
            {isHoveringScrubber && hoverTime !== null && (
              <div
                className="yt-scrubber-tooltip"
                style={{ left: `${hoverPosition}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            <div className="yt-scrubber-track">
              {/* Buffer Bar */}
              <div
                className="yt-scrubber-buffer"
                style={{ width: `${Math.min(100, progressPct + 25)}%` }}
              />
              {/* Hover highlight */}
              {isHoveringScrubber && (
                <div
                  className="yt-scrubber-hover-fill"
                  style={{ width: `${hoverPosition}%` }}
                />
              )}
              {/* Played Bar (YouTube Red) */}
              <div className="yt-scrubber-played" style={{ width: `${progressPct}%` }} />
              {/* Red Thumb Circle */}
              <div className="yt-scrubber-thumb" style={{ left: `${progressPct}%` }} />
            </div>
          </div>

          {/* Controls Row */}
          <div className="yt-controls-row">
            {/* Left Controls */}
            <div className="yt-controls-left">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={togglePlay}
                className="yt-btn"
                title={isPlaying ? (yt.pauseTooltip || 'Pausa (k)') : (yt.playTooltip || 'Reproducir (k)')}
                aria-label={isPlaying ? (yt.pauseTooltip || 'Pausa') : (yt.playTooltip || 'Reproducir')}
              >
                {isPlaying ? (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Next track icon */}
              <button
                type="button"
                className="yt-btn"
                onClick={() => {
                  if (videoRef.current) videoRef.current.currentTime = 0;
                }}
                title={yt.restartTooltip || 'Volver a empezar'}
                aria-label={yt.restartTooltip || 'Volver a empezar'}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>

              {/* Volume */}
              <div className="yt-volume-wrapper">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="yt-btn"
                  title={isMuted || volume === 0 ? (yt.unmuteTooltip || 'Desactivar silencio (m)') : (yt.muteTooltip || 'Silenciar (m)')}
                  aria-label={isMuted || volume === 0 ? (yt.unmuteTooltip || 'Desactivar silencio (m)') : (yt.muteTooltip || 'Silenciar (m)')}
                >
                  {isMuted || volume === 0 ? (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                      <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77z" />
                    </svg>
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="yt-volume-slider"
                  aria-label="Volumen"
                />
              </div>

              {/* Time display */}
              <div className="yt-time-display">
                <span>{formatTime(currentTime)}</span>
                <span className="yt-time-sep">/</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Right Controls */}
            <div className="yt-controls-right">
              {/* Autoplay pill */}
              <div className="yt-autoplay-pill" title={yt.autoplay || 'Reproducción automática'}>
                <span className="yt-autoplay-thumb" />
              </div>

              {/* CC Subtitles */}
              <button type="button" className="yt-btn yt-btn-cc" title={yt.subtitlesTooltip || 'Subtítulos (c)'} aria-label={yt.subtitlesTooltip || 'Subtítulos (c)'}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M19 4H5a2 2 0 00-2 2v12a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zm-8 7H9.5v-.5h-2v3h2V13H11v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1zm7 0h-1.5v-.5h-2v3h2V13H18v1a1 1 0 01-1 1h-3a1 1 0 01-1-1v-4a1 1 0 011-1h3a1 1 0 011 1v1z" />
                </svg>
              </button>

              {/* Settings Gear */}
              <div className="yt-settings-wrapper">
                <button
                  type="button"
                  onClick={() => {
                    setIsSettingsOpen(!isSettingsOpen);
                    setIsSpeedMenuOpen(false);
                  }}
                  className={`yt-btn yt-settings-btn ${isSettingsOpen ? 'open' : ''}`}
                  title={yt.settingsTooltip || 'Settings'}
                  aria-label={yt.settingsTooltip || 'Settings'}
                  title={yt.settingsTooltip || 'Configuración'}
                  aria-label={yt.settingsTooltip || 'Configuración'}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z" />
                  </svg>
                </button>

                {/* YouTube Floating Settings Menu */}
                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      className="yt-menu-popup"
                      initial={{ opacity: 0, scale: 0.92, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15 }}
                    >
                      {!isSpeedMenuOpen ? (
                        <div className="yt-menu-list">
                          {/* Ambient Mode Toggle Item */}
                          <div
                            className="yt-menu-item"
                            onClick={() => {
                              setIsAmbientActive((prev) => {
                                const next = !prev;
                                triggerToast(next ? (yt.ambientOnToast || 'Modo ambiente activado') : (yt.ambientOffToast || 'Modo ambiente desactivado'));
                                return next;
                              });
                            }}
                          >
                            <div className="yt-menu-item-left">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="12" cy="12" r="4" fill={isAmbientActive ? 'currentColor' : 'none'} />
                                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
                              </svg>
                              <span>{yt.ambientMode || 'Modo ambiente'}</span>
                            </div>
                            <div className="yt-menu-item-right">
                              <span className={`yt-toggle-switch ${isAmbientActive ? 'active' : ''}`}>
                                <span className="yt-toggle-thumb" />
                              </span>
                            </div>
                          </div>

                          {/* Speed Item */}
                          <div className="yt-menu-item" onClick={() => setIsSpeedMenuOpen(true)}>
                            <div className="yt-menu-item-left">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M10 8v8l6-4-6-4zm9-5H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z" />
                              </svg>
                              <span>{yt.speed || 'Velocidad'}</span>
                            </div>
                            <div className="yt-menu-item-right">
                              <span className="yt-menu-value">{playbackRate === 1 ? (yt.normal || 'Normal') : playbackRate + 'x'}</span>
                              <span className="yt-arrow">›</span>
                            </div>
                          </div>

                          {/* Quality Item */}
                          <div className="yt-menu-item">
                            <div className="yt-menu-item-left">
                              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                                <path d="M19 4H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 11H9.5v-2h-2v2H6V9h1.5v2.5h2V9H11v6zm7-1c0 .55-.45 1-1 1h-4V9h4c.55 0 1 .45 1 1v4zm-1.5-3.5h-2v3h2v-3z" />
                              </svg>
                              <span>{yt.quality || 'Calidad'}</span>
                            </div>
                            <div className="yt-menu-item-right">
                              <span className="yt-menu-value yt-badge-4k">4K 2160p HDR</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="yt-menu-list">
                          <div className="yt-menu-header" onClick={() => setIsSpeedMenuOpen(false)}>
                            <span className="yt-arrow-back">‹</span>
                            <span>{yt.speed || 'Velocidad de reproducción'}</span>
                          </div>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                            <div
                              key={s}
                              className={`yt-menu-item ${playbackRate === s ? 'selected' : ''}`}
                              onClick={() => changeSpeed(s)}
                            >
                              <span className="yt-check">{playbackRate === s ? '✓' : ''}</span>
                              <span>{s === 1 ? (yt.normal || 'Normal') : `${s}x`}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Theater Mode Toggle */}
              <button
                type="button"
                onClick={() => setIsTheater(!isTheater)}
                className="yt-btn"
                title={isTheater ? (yt.defaultViewTooltip || 'Vista estándar (t)') : (yt.theaterTooltip || 'Modo cine (t)')}
                aria-label={isTheater ? (yt.defaultViewTooltip || 'Vista estándar (t)') : (yt.theaterTooltip || 'Modo cine (t)')}
              >
                <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  {isTheater ? (
                    <path d="M19 6H5c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H5V8h14v8z" />
                  ) : (
                    <path d="M19 7H5c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zm0 8H5V9h14v6z" />
                  )}
                </svg>
              </button>

              {/* Fullscreen */}
              <button
                type="button"
                onClick={toggleFullscreen}
                className="yt-btn"
                title={isFullscreen ? (yt.exitFullscreenTooltip || 'Salir de pantalla completa (f)') : (yt.fullscreenTooltip || 'Pantalla completa (f)')}
                aria-label={isFullscreen ? (yt.exitFullscreenTooltip || 'Salir de pantalla completa (f)') : (yt.fullscreenTooltip || 'Pantalla completa (f)')}
              >
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-14v3h3v2h-5V5h2z" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                    <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          YOUTUBE VIDEO INFORMATION CARD (Under the player)
          Bathed in the ambient glow from the video!
          ============================================================ */}
      <div className="yt-details-container">
        {/* Video Title */}
        <h1 className="yt-video-heading">{currentTitle}</h1>

        {/* Channel and Action Buttons Bar */}
        <div className="yt-channel-action-row">
          {/* Left: Channel profile */}
          <div className="yt-channel-info-left">
            <img
              src="/assets/profile/me.webp"
              alt="Iker Augusto"
              className="yt-channel-pfp"
              loading="lazy"
              decoding="async"
            />
            <div className="yt-channel-meta">
              <div className="yt-channel-name-row">
                <span className="yt-channel-name">Iker Augusto</span>
                <span className="yt-verified-badge" title="Verificado">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="#aaa">
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zM9.8 17.3l-4.2-4.1 1.4-1.4 2.8 2.7 7.4-7.4 1.4 1.4-8.8 8.8z" />
                  </svg>
                </span>
              </div>
              <span className="yt-channel-subs">{yt.subscribers || '142 K suscriptores'}</span>
            </div>

            {/* Subscribe button */}
            <button
              type="button"
              onClick={handleSubscribe}
              className={`yt-subscribe-btn ${isSubscribed ? 'subscribed' : ''}`}
            >
              {isSubscribed ? (
                <>
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z" />
                  </svg>
                  <span>{yt.subscribed || 'Suscrito'}</span>
                </>
              ) : (
                yt.subscribe || 'Suscribirme'
              )}
            </button>
          </div>

          {/* Right: Actions */}
          <div className="yt-action-buttons-right">
            {/* Likes / Dislikes pill */}
            <div className="yt-action-pill-group">
              <button
                type="button"
                onClick={handleLike}
                className={`yt-action-btn yt-like-btn ${liked ? 'active' : ''}`}
                title={yt.like || 'Me gusta'}
                aria-label={yt.like || 'Me gusta'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                </svg>
                <span>{likesCount.toLocaleString(dict?.youtubePlayer ? (yt.date?.includes('hace') ? 'es-ES' : 'en-US') : 'es-ES')}</span>
              </button>
              <div className="yt-pill-divider" />
              <button
                type="button"
                onClick={handleDislike}
                className={`yt-action-btn yt-dislike-btn ${disliked ? 'active' : ''}`}
                title={yt.dislike || 'No me gusta'}
                aria-label={yt.dislike || 'No me gusta'}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                  <path d="M15 3H6c-.83 0-1.54.5-1.84 1.22l-3.02 7.05c-.09.23-.14.47-.14.73v2c0 1.1.9 2 2 2h6.31l-.95 4.57-.03.32c0 .41.17.79.44 1.06L9.83 23l6.59-6.59c.36-.36.58-.86.58-1.41V5c0-1.1-.9-2-2-2zm4 0v12h4V3h-4z" />
                </svg>
              </button>
            </div>

            {/* Share button */}
            <button type="button" onClick={handleShare} className="yt-action-btn yt-pill-btn" title={yt.share || 'Compartir'} aria-label={yt.share || 'Compartir'}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M15 5.63 20.66 12 15 18.37V14h-1c-3.96 0-7.14 1-9.75 3.09 1.84-4.07 5.11-6.4 9.89-7.1l.86-.13V5.63M14 3v6C6.22 10.13 3.11 15.33 2 21c2.78-3.97 6.44-6 12-6v6l8-9-8-9z" />
              </svg>
              <span>{yt.share || 'Compartir'}</span>
            </button>

            {/* Download */}
            <button
              type="button"
              onClick={() => triggerToast(yt.downloadToast || 'Descarga no disponible')}
              className="yt-action-btn yt-pill-btn hide-on-mobile"
              title={yt.download || 'Descargar'}
              aria-label={yt.download || 'Descargar'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M17 18v2H7v-2h10zm-5-14 5 5h-4v7h-2V9H7l5-5z" transform="rotate(180 12 12)" />
              </svg>
              <span>{yt.download || 'Descargar'}</span>
            </button>

            {/* More options button */}
            <button
              type="button"
              className="yt-action-btn yt-pill-btn yt-pill-circle"
              onClick={() => triggerToast(yt.moreActions || 'Opciones de vídeo')}
              title={yt.moreActions || 'Más acciones'}
              aria-label={yt.moreActions || 'Más acciones'}
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <circle cx="5" cy="12" r="2" />
                <circle cx="12" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
              </svg>
            </button>
          </div>
        </div>

        {/* YouTube Description Card */}
        <div className="yt-description-box">
          <div className="yt-desc-header">
            <span className="yt-desc-views">{yt.views || '418.924 visualizaciones'}</span>
            <span className="yt-desc-date">{yt.date || 'hace 4 días'}</span>
            <span className="yt-desc-tag">#norway</span>
            <span className="yt-desc-tag">#trip</span>
          </div>

          <p className="yt-desc-body">
            {yt.descBody || 'Video blog in Norway · Trip in Norway 🇳🇴'}
          </p>
        </div>
      </div>
    </div>
  );
}

