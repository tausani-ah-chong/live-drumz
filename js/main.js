import { initPlayer, togglePlay, prevVideo, nextVideo, unMute, ensurePlaying, applyBtDelay } from './youtube.js';
import { initPads } from './pads.js';
import { getContext } from './audio/context.js';
import { prerender } from './audio/synth.js';

// Start YouTube muted (autoplay works in all browsers when muted)
initPlayer();

// Init pad event listeners
initPads();

// Transport: play/pause only (track switching is via swipe)
document.getElementById('btn-play-pause').addEventListener('click', togglePlay);

// ─── Orientation toggle ─────────────────────────────────────
document.getElementById('btn-orientation').addEventListener('click', () => {
  document.body.classList.toggle('force-landscape');
});

// ─── Bluetooth sync toggle + slider ────────────────────────
const btnBt    = document.getElementById('btn-bt');
const btPanel  = document.getElementById('bt-panel');
const btSlider = document.getElementById('bt-slider');
const btValue  = document.getElementById('bt-value');

btnBt.addEventListener('click', () => {
  const active = btnBt.classList.toggle('bt-active');
  btPanel.hidden = !active;
  if (!active) {
    btSlider.value = 0;
    btValue.textContent = '0 ms';
    applyBtDelay(0);
  }
});

btSlider.addEventListener('input', () => {
  const ms = Number(btSlider.value);
  btValue.textContent = ms === 0 ? '0 ms' : `${ms > 0 ? '+' : ''}${ms} ms`;
  applyBtDelay(ms);
});

// ─── Track switch helpers ───────────────────────────────────
function flashSwitch(dir) {
  const el = document.getElementById('switch-overlay');
  el.querySelector('.switch-arrow').textContent = dir === 'next' ? '↑' : '↓';
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 350);
}

function doNext() { if (started) { flashSwitch('next'); nextVideo(); } }
function doPrev() { if (started) { flashSwitch('prev'); prevVideo(); } }

// ─── Swipe gesture (TikTok-style) ──────────────────────────
let swipeY = 0, swipeX = 0, swipeTarget = null;

document.addEventListener('touchstart', (e) => {
  swipeY = e.touches[0].clientY;
  swipeX = e.touches[0].clientX;
  swipeTarget = e.target;
}, { passive: true });

document.addEventListener('touchend', (e) => {
  if (!started) return;
  if (swipeTarget?.closest('.pad, #transport, #btn-orientation, #bt-panel')) return;
  const dy = swipeY - e.changedTouches[0].clientY;
  const dx = swipeX - e.changedTouches[0].clientX;
  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) {
    dy > 0 ? doNext() : doPrev();
  }
}, { passive: true });

// ─── Mouse wheel / trackpad (desktop) ──────────────────────
let wheelCooldown = false;
document.addEventListener('wheel', (e) => {
  if (!started || wheelCooldown || Math.abs(e.deltaY) < 30) return;
  wheelCooldown = true;
  setTimeout(() => { wheelCooldown = false; }, 1000);
  e.deltaY > 0 ? doNext() : doPrev();
}, { passive: true });

// ─── Start overlay ─────────────────────────────────────────
const overlay = document.getElementById('start-overlay');
let started = false;

function handleStart() {
  if (started) return;
  started = true;

  // Resume AudioContext — must be called synchronously inside user gesture
  getContext().resume();

  // Dismiss overlay immediately so the user sees instant feedback
  overlay.style.opacity = '0';
  overlay.style.pointerEvents = 'none';
  setTimeout(() => overlay.remove(), 400);

  // Start video playing and unmute; pre-render drum sounds in background
  ensurePlaying();
  prerender().then(() => {
    unMute();
  });
}

// touchstart for speed on mobile; click as fallback
overlay.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleStart();
}, { passive: false });

overlay.addEventListener('click', handleStart);
