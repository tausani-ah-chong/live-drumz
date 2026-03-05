import { initPlayer, togglePlay, seekBy, unMute, ensurePlaying } from './youtube.js';
import { initPads } from './pads.js';
import { getContext } from './audio/context.js';
import { prerender } from './audio/synth.js';

// Start YouTube muted (autoplay works in all browsers when muted)
initPlayer();

// Init pad event listeners
initPads();

// Transport controls
document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
document.getElementById('btn-back').addEventListener('click', () => seekBy(-10));
document.getElementById('btn-fwd').addEventListener('click', () => seekBy(10));

// ─── Orientation toggle ─────────────────────────────────────
document.getElementById('btn-orientation').addEventListener('click', () => {
  document.body.classList.toggle('force-landscape');
});

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
