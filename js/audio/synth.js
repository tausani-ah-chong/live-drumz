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

// ─── Synthesis (works with any AudioContext, live or offline) ──

function buildNoiseBuffer(ctx) {
  const size = ctx.sampleRate * 1.0;
  const buf = ctx.createBuffer(1, size, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function kick(ctx, t = 0) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(150, t);
  osc.frequency.exponentialRampToValueAtTime(40, t + 0.3);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(1, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.55);
}

function snare(ctx, t = 0) {
  const noise = buildNoiseBuffer(ctx);

  const osc = ctx.createOscillator();
  const oscGain = ctx.createGain();
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, t);
  oscGain.gain.setValueAtTime(0, t);
  oscGain.gain.linearRampToValueAtTime(0.4, t + 0.003);
  oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);
  osc.connect(oscGain);
  oscGain.connect(ctx.destination);
  osc.start(t);
  osc.stop(t + 0.22);

  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = noise;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = 1000;
  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0, t);
  noiseGain.gain.linearRampToValueAtTime(0.6, t + 0.003);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.28);
  noiseSrc.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(ctx.destination);
  noiseSrc.start(t);
  noiseSrc.stop(t + 0.32);
}

function hihat(ctx, t = 0) {
  const noiseSrc = ctx.createBufferSource();
  noiseSrc.buffer = buildNoiseBuffer(ctx);
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = 8000;
  filter.Q.value = 1.5;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.5, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  noiseSrc.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  noiseSrc.start(t);
  noiseSrc.stop(t + 0.15);
}

function clap(ctx, t = 0) {
  [0, 0.01, 0.022].forEach((offset) => {
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buildNoiseBuffer(ctx);
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    const st = t + offset;
    gain.gain.setValueAtTime(0, st);
    gain.gain.linearRampToValueAtTime(0.6, st + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.001, st + 0.14);
    noiseSrc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noiseSrc.start(st);
    noiseSrc.stop(st + 0.18);
  });
}

// ─── Pre-rendered buffers ──────────────────────────────────

const DURATIONS = { kick: 0.6, snare: 0.4, hihat: 0.2, clap: 0.25 };
const buffers = {};

async function renderSound(fn, duration) {
  const sr = 44100;
  const offline = new OfflineAudioContext(1, Math.ceil(sr * duration), sr);
  fn(offline, 0);
  return offline.startRendering();
}

export async function prerender() {
  const [k, s, h, c] = await Promise.all([
    renderSound(kick,  DURATIONS.kick),
    renderSound(snare, DURATIONS.snare),
    renderSound(hihat, DURATIONS.hihat),
    renderSound(clap,  DURATIONS.clap),
  ]);
  buffers.kick  = k;
  buffers.snare = s;
  buffers.hihat = h;
  buffers.clap  = c;
}

// ─── Instant playback from pre-rendered buffer ─────────────

export function playSound(name) {
  const buf = buffers[name];
  if (!buf) return;
  const ctx = getContext();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(getMaster());
  src.start();
}
