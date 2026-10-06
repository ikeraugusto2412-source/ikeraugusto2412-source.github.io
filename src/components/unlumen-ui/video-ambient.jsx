import React, { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

// Low resolution for the canvas — the blur hides any pixel detail anyway.
const CANVAS_W = 64;
const CANVAS_H = 36;

export function VideoAmbient({
  src,
  poster,
  blurAmount = 60,
  intensity = 0.85,
  autoPlay = false,
  muted = false,
  className,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw poster initially if present so glow exists before play starts
    if (poster) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = poster;
      img.onload = () => {
        try {
          ctx.drawImage(img, 0, 0, CANVAS_W, CANVAS_H);
        } catch {
          // ignore
        }
      };
    }

    const draw = () => {
      // Only paint when the video has pixel data to show.
      if (!video.paused || video.readyState >= 2) {
        try {
          ctx.drawImage(video, 0, 0, CANVAS_W, CANVAS_H);
        } catch {
          // Ignore cross-origin canvas restrictions; video playback should continue.
        }
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [poster]);

  return (
    <div
      className={cn("relative w-full", className)}
      style={{
        position: "relative",
        width: "100%",
        overflow: "visible",
      }}
    >
      {/* Glow canvas — same approach as YouTube's ambient mode.
          Canvas drawImage() runs in the normal paint cycle, so adjacent
          elements repaint automatically without composite-layer tricks. */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        aria-hidden="true"
        className="pointer-events-none rounded-xl"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: `blur(${blurAmount}px)`,
          opacity: intensity,
          transform: "scale(1.08)",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />
      {/* Main video */}
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        controls
        playsInline
        preload="metadata"
        autoPlay={autoPlay}
        muted={muted}
        className="relative w-full rounded-xl"
        style={{
          position: "relative",
          zIndex: 1,
          width: "100%",
          display: "block",
        }}
      />
    </div>
  );
}

export default VideoAmbient;
