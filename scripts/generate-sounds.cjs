const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;

/**
 * Creates a valid 16-bit PCM WAV buffer from float samples (-1.0 to 1.0)
 */
function createWavBuffer(samples) {
  const numChannels = 1;
  const bitsPerSample = 16;
  const bytesPerSample = bitsPerSample / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = SAMPLE_RATE * blockAlign;
  const dataSize = samples.length * bytesPerSample;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF identifier
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // "fmt " chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // "data" chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write 16-bit PCM samples
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    // Clamp to -1.0 .. 1.0
    const s = Math.max(-1, Math.min(1, samples[i]));
    const intSample = s < 0 ? s * 0x8000 : s * 0x7FFF;
    buffer.writeInt16LE(Math.round(intSample), offset);
    offset += 2;
  }

  return buffer;
}

// 1. MODERN TACTILE CLICK / TAP (Apple-style subtle ceramic/glass UI click)
function generateModernClick() {
  const duration = 0.045; // 45ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    // Transient pop + body resonance around 1400Hz decaying into 800Hz
    const freq = 1400 * Math.exp(-t * 80);
    const tone = Math.sin(2 * Math.PI * freq * t);
    // Subtle wooden/glass knock at 320Hz
    const knock = Math.sin(2 * Math.PI * 320 * t) * 0.4;
    // Fast exponential decay
    const env = Math.exp(-t * 90);
    // Tiny click impulse at start
    const impulse = i < 8 ? (Math.random() * 2 - 1) * 0.8 : 0;

    samples[i] = (tone * 0.6 + knock + impulse) * env * 0.45;
  }
  return samples;
}

// 2. CAMERA SHUTTER / LENS SNAP (Realistic high-end mirrorless shutter: curtain open + blade snap + mechanical settle)
function generateCameraShutter() {
  const duration = 0.16; // 160ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;

    // Part 1: Front curtain snap (t: 0 -> 0.04)
    let frontSnap = 0;
    if (t < 0.045) {
      const t1 = t;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t1 * 140);
      const tone1 = Math.sin(2 * Math.PI * 2200 * t1) * Math.exp(-t1 * 180);
      const body1 = Math.sin(2 * Math.PI * 480 * t1) * Math.exp(-t1 * 100);
      frontSnap = (noise * 0.7 + tone1 * 0.5 + body1 * 0.6);
    }

    // Part 2: Rear curtain snap & blade catch (t: 0.048 -> 0.16)
    let rearSnap = 0;
    if (t >= 0.045) {
      const t2 = t - 0.045;
      const noise = (Math.random() * 2 - 1) * Math.exp(-t2 * 120);
      const metallic = Math.sin(2 * Math.PI * 3100 * t2) * Math.exp(-t2 * 160);
      const thud = Math.sin(2 * Math.PI * 280 * t2) * Math.exp(-t2 * 60);
      const spring = Math.sin(2 * Math.PI * 950 * t2) * Math.exp(-t2 * 80) * 0.3;
      rearSnap = (noise * 0.8 + metallic * 0.5 + thud * 0.7 + spring);
    }

    samples[i] = (frontSnap + rearSnap) * 0.55;
  }
  return samples;
}

// 3. MODERN NOTIFICATION POP / CHIME (Soft harmonic marimba double-tone for toasts & copy success)
function generateSoftPop() {
  const duration = 0.18; // 180ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;

    // Harmonic chords: Note 1 (E6 ~ 1318Hz) then Note 2 (A6 ~ 1760Hz) slightly offset
    // Note 1: 0 -> end
    const env1 = Math.exp(-t * 28);
    const n1 = (
      Math.sin(2 * Math.PI * 1046.5 * t) + // C6
      0.4 * Math.sin(2 * Math.PI * 2093 * t) // Octave
    ) * env1;

    // Note 2: kicks in at 0.035s (high shimmer G6 ~ 1568Hz)
    let n2 = 0;
    if (t > 0.035) {
      const t2 = t - 0.035;
      const env2 = Math.exp(-t2 * 24);
      n2 = (
        Math.sin(2 * Math.PI * 1567.98 * t2) +
        0.35 * Math.sin(2 * Math.PI * 3136 * t2)
      ) * env2 * 0.85;
    }

    samples[i] = (n1 * 0.6 + n2 * 0.7) * 0.4;
  }
  return samples;
}

// 4. SUBTLE HOVER TICK (Ultra-short, silky smooth micro-click at -20dB)
function generateHoverTick() {
  const duration = 0.015; // 15ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const tone = Math.sin(2 * Math.PI * 2400 * t);
    const env = Math.exp(-t * 400); // Very fast decay
    samples[i] = tone * env * 0.12; // Ultra subtle
  }
  return samples;
}

// 5. CRISP TOGGLE SWITCH (Sleek mechanical switch for toggle / language change)
function generateToggleSwitch() {
  const duration = 0.06; // 60ms
  const length = Math.floor(SAMPLE_RATE * duration);
  const samples = new Float32Array(length);

  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const freq = 1800 * Math.exp(-t * 70);
    const tone = Math.sin(2 * Math.PI * freq * t);
    const click = (Math.random() * 2 - 1) * Math.exp(-t * 180) * 0.5;
    const env = Math.exp(-t * 75);
    samples[i] = (tone * 0.7 + click) * env * 0.35;
  }
  return samples;
}

// Output directory
const outDir = path.join(__dirname, '..', 'public', 'audio');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(path.join(outDir, 'click.wav'), createWavBuffer(generateModernClick()));
fs.writeFileSync(path.join(outDir, 'shutter.wav'), createWavBuffer(generateCameraShutter()));
fs.writeFileSync(path.join(outDir, 'pop.wav'), createWavBuffer(generateSoftPop()));
fs.writeFileSync(path.join(outDir, 'tick.wav'), createWavBuffer(generateHoverTick()));
fs.writeFileSync(path.join(outDir, 'toggle.wav'), createWavBuffer(generateToggleSwitch()));

console.log('✅ Generated 5 modern UI audio files in public/audio/');
