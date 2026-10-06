// Web Audio API Synthesizer for Mechanical / Analog Camera Sounds
// 100% synthesized in real time — zero external audio files, zero latency, ultra lightweight.

class AnalogAudioEngine {
  constructor() {
    this.ctx = null;
    this.isEnabled = false;
    this.volume = 0.6;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
  }

  toggleSound(forceState) {
    this.isEnabled = typeof forceState === 'boolean' ? forceState : !this.isEnabled;
    if (this.isEnabled) {
      this.init();
      this.playTactileClick(0.5);
    }
    return this.isEnabled;
  }

  // 1. Mechanical Shutter Click (Leica M-series dual-curtain slap)
  playShutter() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // Part A: Opening curtain click (sharp snap)
    this._createClick(now, 1800, 0.015, 0.8 * this.volume);
    this._createNoiseThud(now + 0.005, 120, 0.035, 0.5 * this.volume);

    // Part B: Closing curtain snap (delay ~40ms to simulate 1/250s feel)
    this._createClick(now + 0.045, 1400, 0.012, 0.6 * this.volume);
    this._createNoiseThud(now + 0.05, 95, 0.04, 0.4 * this.volume);
  }

  // 2. Film Advance Lever Ratchet (Mechanical teeth advancing 35mm film)
  playFilmAdvance() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const teethCount = 6;
    for (let i = 0; i < teethCount; i++) {
      const t = now + i * 0.032;
      const freq = 1900 + (i % 2) * 350;
      this._createClick(t, freq, 0.008, (0.35 + (i / teethCount) * 0.2) * this.volume);
    }
    // Final satisfying latch clack
    this._createNoiseThud(now + 0.22, 140, 0.05, 0.45 * this.volume);
  }

  // 3. Crisp Studio Tactile Click (For toggles, switches, filters)
  playTactileClick(volFactor = 1) {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    this._createClick(now, 2600, 0.006, 0.45 * this.volume * volFactor);
    this._createNoiseThud(now, 280, 0.015, 0.25 * this.volume * volFactor);
  }

  // 4. High-Speed Motor Drive Burst (3 rapid frames)
  playBurstDrive() {
    if (!this.isEnabled) return;
    this.init();
    if (!this.ctx) return;

    for (let i = 0; i < 3; i++) {
      setTimeout(() => {
        this.playShutter();
      }, i * 110);
    }
  }

  // Helper: High-frequency transient click
  _createClick(time, freq, duration, gainVal) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(80, time + duration);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }

  // Helper: Low-frequency mechanical body resonance / thud
  _createNoiseThud(time, freq, duration, gainVal) {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + duration);

    gain.gain.setValueAtTime(gainVal, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(time);
    osc.stop(time + duration);
  }
}

export const soundFx = new AnalogAudioEngine();
