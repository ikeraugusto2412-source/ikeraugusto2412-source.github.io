import React, { useEffect, useRef, useState } from 'react';
import { playSound } from '../audio/sound';
import './Preloader.css';

const GREETINGS = [
  { word: 'Hello', code: 'en' },
  { word: 'Hola', code: 'es' },
  { word: 'Bonjour', code: 'fr' },
  { word: 'Ciao', code: 'it' },
  { word: 'Olá', code: 'pt' },
  { word: 'Hallo', code: 'de' },
  { word: 'Hej', code: 'sv' },
  { word: 'Konnichiwa', code: 'ja' },
];

/** Detect browser language code (e.g. 'es', 'en', 'fr') */
function getDetectedLanguage() {
  if (typeof window === 'undefined' || !window.navigator) return 'en';
  const langs = window.navigator.languages || [window.navigator.language || 'en'];
  for (const l of langs) {
    const code = l.split('-')[0].toLowerCase();
    if (GREETINGS.some((g) => g.code === code)) {
      return code;
    }
  }
  return 'en';
}

/** Cubic easing: smooth start, rapid wheel spin, gentle deceleration onto final word */
function easeInOutCubic(t) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

const SEEN_KEY = 'ik-preloader-seen';

/** Only play the intro once per browser session */
function hasSeenPreloader() {
  try {
    return sessionStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

export default function Preloader({ onComplete }) {
  const [visible, setVisible] = useState(() => !hasSeenPreloader());
  const [exiting, setExiting] = useState(false);
  const itemRefs = useRef([]);

  // Build reel: other greetings spinning through, then target word, then trailing words
  const detectedCode = getDetectedLanguage();
  const targetGreeting = GREETINGS.find((g) => g.code === detectedCode) || GREETINGS[0];
  const otherGreetings = GREETINGS.filter((g) => g.code !== detectedCode);

  // 3 spinning cycles before the target word, followed by trailing words
  const wordList = [
    ...otherGreetings,
    ...otherGreetings,
    ...otherGreetings,
    targetGreeting,
    ...otherGreetings,
  ];

  const startProgress = 1;
  const targetProgress = otherGreetings.length * 3; // Index of the target word

  useEffect(() => {
    if (!visible) return undefined;

    // Lock scroll during preloader (class-based so page-level locks are left untouched)
    const root = document.documentElement;
    root.classList.add('is-preloading');
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* storage unavailable: intro simply plays again next time */
    }

    // Word spacing follows the rendered font size, so the drum scales on every screen
    const fontPx = parseFloat(getComputedStyle(itemRefs.current[0]).fontSize) || 20;
    const spacing = fontPx * 2.05;

    let animationFrameId;
    let lastTickWord = startProgress;
    let startTime = null;
    const spinDuration = 2400; // ms to spin and decelerate smoothly
    const holdDuration = 450;  // ms to stay on final word before curtain exit

    const updateWheel = (progress) => {
      itemRefs.current.forEach((el, i) => {
        if (!el) return;
        const diff = i - progress;
        const absDiff = Math.abs(diff);

        if (absDiff > 3.2) {
          el.style.opacity = '0';
          el.style.visibility = 'hidden';
          return;
        }

        el.style.visibility = 'visible';

        // Opacity tiers (matching swagg optical hierarchy)
        let opacity = 0;
        if (absDiff <= 1) {
          opacity = 1 - absDiff * 0.62;
        } else if (absDiff <= 2) {
          opacity = 0.38 - (absDiff - 1) * 0.26;
        } else {
          opacity = Math.max(0, 0.12 * (1 - (absDiff - 2)));
        }

        // Blur tiers
        let blur = 0;
        if (absDiff <= 1) {
          blur = absDiff * 3;
        } else if (absDiff <= 2) {
          blur = 3 + (absDiff - 1) * 4;
        } else {
          blur = 7 + (absDiff - 2) * 4;
        }

        // 3D cylindrical drum perspective & tilt
        const y = diff * spacing;
        const rotX = Math.max(-50, Math.min(50, -diff * 18));
        const scale = Math.max(0.78, 1 - absDiff * 0.07);

        el.style.transform = `translate(-50%, -50%) translateY(${y}px) rotateX(${rotX}deg) scale(${scale})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.filter = `blur(${blur.toFixed(1)}px)`;
      });
    };

    // Initial positioning
    updateWheel(startProgress);

    const step = (now) => {
      if (!startTime) startTime = now;
      const elapsed = now - startTime;
      const progressRatio = Math.min(1, elapsed / spinDuration);
      const easedRatio = easeInOutCubic(progressRatio);

      const currentProgress = startProgress + (targetProgress - startProgress) * easedRatio;
      updateWheel(currentProgress);

      const centredWord = Math.round(currentProgress);
      if (centredWord !== lastTickWord) {
        lastTickWord = centredWord;
        playSound('preloader-tick');
      }

      if (progressRatio < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        // Spin finished: brief hold on the target language, then launch curtain exit
        setTimeout(() => {
          setExiting(true);
          setTimeout(() => {
            setVisible(false);
            root.classList.remove('is-preloading');
            if (onComplete) onComplete();
          }, 750); // Matches CSS curtain exit
        }, holdDuration);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(animationFrameId);
      root.classList.remove('is-preloading');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once on mount
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`preloader-overlay ${exiting ? 'exiting' : ''}`}
      aria-hidden="true"
    >
      <div className="preloader-drum-stage">
        <div className="preloader-vignette preloader-vignette--top" />
        <div className="preloader-wheel">
          {wordList.map((item, idx) => (
            <span
              key={`${item.code}-${idx}`}
              ref={(el) => (itemRefs.current[idx] = el)}
              className="preloader-word"
            >
              {item.word}
            </span>
          ))}
        </div>
        <div className="preloader-vignette preloader-vignette--bottom" />
      </div>
    </div>
  );
}
