import { getContext } from './context.js';

// ─── Master bus ────────────────────────────────────────────
let masterGain = null;
let compressor = null;

function getMaster() {
  const ctx = getContext();
  if (!masterGain) {
    compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.knee.value = 6;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;
    compressor.connect(ctx.destination);

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.9;
    masterGain.connect(compressor);
  }
  return masterGain;
}

// ─── Noise buffer (pre-cached per context) ─────────────────
let _noiseBuffer = null;

function getNoiseBuffer() {
  const ctx = getContext();
  if (!_noiseBuffer) {
    const bufferSize = ctx.sampleRate * 1.0; // 1s of noise, reused by all voices
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    _noiseBuffer = buffer;
  }
  return _noiseBuffer;
}

function noiseSource() {
  const ctx = getContext();
  const src = ctx.createBufferSource();
  src.buffer = getNoiseBuffer();
  // Random offset into the buffer so rapid taps sound different
  src.loop = false;
  return src;
}

// ─── Kick ──────────────────────────────────────────────────

export function kick() {
  const ctx = getContext();
  const master = getMaster();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);

  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(1, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);

  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.55);
}

// ─── Snare ─────────────────────────────────────────────────

export function snare() {
  const ctx = getContext();
  const master = getMaster();
  const t = ctx.currentTime;

  // Tone
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, t);
  oscGain.gain.setValueAtTime(0, t);
  oscGain.gain.linearRampToValueAtTime(0.4, t + 0.003);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(t);
  osc.stop(t + 0.22);

  // Noise
  const noise = noiseSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.6, t + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  noise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(t);
  noise.stop(t + 0.32);
}

// ─── Hi-hat ────────────────────────────────────────────────

export function hihat() {
  const ctx = getContext();
  const master = getMaster();
  const t = ctx.currentTime;

  const noise = noiseSource();
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 8000;
  filter.Q.value = 1.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.5, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start(t);
  noise.stop(t + 0.15);
}

// ─── Clap ──────────────────────────────────────────────────

export function clap() {
  const ctx = getContext();
  const master = getMaster();
  const t = ctx.currentTime;

  [0, 0.01, 0.022].forEach((offset) => {
    const noise = noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    const st = t + offset;
    gain.gain.setValueAtTime(0, st);
    gain.gain.linearRampToValueAtTime(0.6, st + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(st);
    noise.stop(st + 0.18);
  });
}

export const sounds = { kick, snare, hihat, clap };
