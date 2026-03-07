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

// ─── Pre-loaded buffers ────────────────────────────────────

const buffers = {};

const SOUNDS = [
  { name: 'kick',    file: 'sounds/kick.wav' },
  { name: 'snare',   file: 'sounds/snare.wav' },
  { name: 'hihat',   file: 'sounds/hihat.wav' },
  { name: 'clap',    file: 'sounds/clap.wav' },
  { name: 'sfx-fah',  file: 'sounds/sfx-fah.mp3' },
  { name: 'sfx-ack',  file: 'sounds/sfx-ack.mp3' },
  { name: 'sfx-boom', file: 'sounds/sfx-boom.mp3' },
  { name: 'sfx-pay',  file: 'sounds/sfx-pay.mp3' },
];

export async function prerender() {
  const ctx = getContext();
  await Promise.all(SOUNDS.map(async ({ name, file }) => {
    const res = await fetch(file);
    const arrayBuffer = await res.arrayBuffer();
    buffers[name] = await ctx.decodeAudioData(arrayBuffer);
  }));
}

// ─── Instant playback from pre-loaded buffer ───────────────

export function playSound(name) {
  const buf = buffers[name];
  if (!buf) return;
  const ctx = getContext();
  if (ctx.state === 'suspended') ctx.resume();
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(getMaster());
  src.start();
}
