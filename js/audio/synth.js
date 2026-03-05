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

// ─── Helpers ───────────────────────────────────────────────

function noiseBuffer(ctx) {
  const bufferSize = ctx.sampleRate * 0.5;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

// ─── Kick ──────────────────────────────────────────────────

export function kick() {
  const ctx = getContext();
  const master = getMaster();
  const time = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, time);
  osc.frequency.exponentialRampToValueAtTime(40, time + 0.3);

  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(1, time + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.4);

  osc.connect(gain);
  gain.connect(master);

  osc.start(time);
  osc.stop(time + 0.45);
}

// ─── Snare ─────────────────────────────────────────────────

export function snare() {
  const ctx = getContext();
  const master = getMaster();
  const time = ctx.currentTime;

  // Tone layer
  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, time);
  oscGain.gain.setValueAtTime(0, time);
  oscGain.gain.linearRampToValueAtTime(0.4, time + 0.003);
  oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
  osc.connect(oscGain);
  oscGain.connect(master);
  osc.start(time);
  osc.stop(time + 0.2);

  // Noise layer
  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const noiseFilter = ctx.createBiquadFilter();
  noiseFilter.type = 'highpass';
  noiseFilter.frequency.value = 1000;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, time);
  noiseGain.gain.linearRampToValueAtTime(0.6, time + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.2);
  noise.connect(noiseFilter);
  noiseFilter.connect(noiseGain);
  noiseGain.connect(master);
  noise.start(time);
  noise.stop(time + 0.25);
}

// ─── Hi-hat ────────────────────────────────────────────────

export function hihat() {
  const ctx = getContext();
  const master = getMaster();
  const time = ctx.currentTime;

  const noise = ctx.createBufferSource();
  noise.buffer = noiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 8000;
  filter.Q.value = 1.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, time);
  gain.gain.linearRampToValueAtTime(0.5, time + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);
  noise.connect(filter);
  filter.connect(gain);
  gain.connect(master);
  noise.start(time);
  noise.stop(time + 0.1);
}

// ─── Clap ──────────────────────────────────────────────────

export function clap() {
  const ctx = getContext();
  const master = getMaster();
  const time = ctx.currentTime;

  [0, 0.01, 0.022].forEach((offset) => {
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    const t = time + offset;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.6, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    noise.start(t);
    noise.stop(t + 0.15);
  });
}

// ─── Sound map ─────────────────────────────────────────────

export const sounds = { kick, snare, hihat, clap };
