const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

function createWavBuffer(samples, channels = 1) {
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = channels * bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

/**
 * 1. EDITORIAL INTRO SOUND
 * A soft, warm, elegant ambient chord opening:
 * Low velvet sub swell (F2 ~87Hz + C3 ~130Hz) fading in smoothly,
 * topped by a crystalline harmonic chime (C6 ~1046Hz, G6 ~1568Hz) that gently floats and decays.
 * Elegant, calm, ultra-top luxury portfolio aesthetic. Zero harshness.
 */
function generateIntroSound() {
  const duration = 2.2; // 2.2 seconds
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;

    // Sub swell: slow gentle attack (0 -> 0.7s) then smooth warm decay
    let swellEnv = 0;
    if (t < 0.7) {
      swellEnv = 0.5 * (1 - Math.cos(Math.PI * (t / 0.7))); // smooth Hann curve
    } else {
      swellEnv = Math.exp(-(t - 0.7) * 1.6);
    }

    const sub = (
      Math.sin(2 * Math.PI * 87.31 * t) * 0.45 + // F2
      Math.sin(2 * Math.PI * 130.81 * t) * 0.35 + // C3
      Math.sin(2 * Math.PI * 174.61 * t) * 0.20   // F3
    ) * swellEnv;

    // Crystalline Chime: rises gently at t = 0.35s and floats down
    let chime = 0;
    if (t > 0.35) {
      const tc = t - 0.35;
      const chimeEnv = Math.exp(-tc * 2.2) * (1 - Math.exp(-tc * 15));
      chime = (
        Math.sin(2 * Math.PI * 1046.50 * tc) * 0.45 + // C6
        Math.sin(2 * Math.PI * 1567.98 * tc) * 0.35 + // G6
        Math.sin(2 * Math.PI * 2093.00 * tc) * 0.15 + // C7
        Math.sin(2 * Math.PI * 2637.02 * tc) * 0.08   // E7 (warm major shimmer)
      ) * chimeEnv;
    }

    // Gentle high-frequency air whisper
    const air = (Math.random() * 2 - 1) * 0.015 * swellEnv;

    samples[i] = (sub * 0.45 + chime * 0.38 + air) * 0.75;
  }
  return samples;
}

/**
 * 2. PAPER / CARD SLIDE SOUND
 * The physical, delicate friction of fine-art photo cardstock sliding smoothly across paper.
 * High-precision filtered friction with micro-granular texture. Ultra subtle.
 */
function generatePaperSlideSound() {
  const duration = 0.22; // 220ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  let b0 = 0, b1 = 0, b2 = 0; // simple IIR state

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;

    // Organic envelope: soft rise in 20ms, sustained friction, gentle 60ms taper
    let env = 0;
    if (t < 0.03) {
      env = t / 0.03;
    } else {
      env = Math.exp(-(t - 0.03) * 11);
    }

    // Granular micro-flutter (paper fibers catching slightly)
    const grain = 1 + 0.35 * Math.sin(2 * Math.PI * 180 * t) + 0.2 * Math.sin(2 * Math.PI * 520 * t);
    const rawNoise = (Math.random() * 2 - 1) * grain;

    // Resonant bandpass filter around 1600Hz (paper sliding frequency)
    b0 = 0.88 * b0 + rawNoise * 0.12;
    b1 = 0.82 * b1 + b0 * 0.18;
    b2 = 0.76 * b2 + b1 * 0.24;

    const paperFriction = (b0 - b2) * 1.8;

    // Soft low-end air draft (thumb moving across card)
    const lowAir = Math.sin(2 * Math.PI * 140 * t) * Math.exp(-t * 22) * 0.2;

    samples[i] = (paperFriction * 0.8 + lowAir) * env * 0.32;
  }
  return samples;
}

/**
 * 3. REAL ANALOG CAMERA SHUTTER
 * Authentic twin-curtain mechanical shutter snap (Leica / Hasselblad feel).
 * 0ms: front blade snap + aperture catch.
 * 42ms: rear curtain slap + body latch.
 */
function generateCameraShutterSound() {
  const duration = 0.14; // 140ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;

    // Transient 1: Blade release (0 -> 40ms)
    let t1 = 0;
    if (t < 0.045) {
      const e1 = Math.exp(-t * 180);
      const noise1 = (Math.random() * 2 - 1) * e1 * 0.6;
      const snap1 = Math.sin(2 * Math.PI * 2400 * t) * e1 * 0.4;
      t1 = noise1 + snap1;
    }

    // Transient 2: Rear curtain catch (42ms -> end)
    let t2 = 0;
    if (t >= 0.038) {
      const dt = t - 0.038;
      const e2 = Math.exp(-dt * 130);
      const thud = Math.sin(2 * Math.PI * 340 * dt) * Math.exp(-dt * 70) * 0.7;
      const metallic = Math.sin(2 * Math.PI * 1850 * dt) * e2 * 0.45;
      const spring = (Math.random() * 2 - 1) * e2 * 0.55;
      t2 = thud + metallic + spring;
    }

    samples[i] = (t1 + t2) * 0.55;
  }
  return samples;
}

const outDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'intro.wav'), createWavBuffer(generateIntroSound()));
fs.writeFileSync(path.join(outDir, 'paper-slide.wav'), createWavBuffer(generatePaperSlideSound()));
fs.writeFileSync(path.join(outDir, 'camera-shutter.wav'), createWavBuffer(generateCameraShutterSound()));

console.log('✅ Generated studio editorial sounds: intro.wav, paper-slide.wav, camera-shutter.wav');
