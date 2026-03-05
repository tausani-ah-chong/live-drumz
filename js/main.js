import { initPlayer, togglePlay, seekBy, unMute } from './youtube.js';
import { initPads } from './pads.js';
import { resumeContext } from './audio/context.js';
import { prerender } from './audio/synth.js';

// Start YouTube muted (autoplay works across all browsers when muted)
initPlayer();

// Init pad event listeners
initPads();

// Transport controls
document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
document.getElementById('btn-back').addEventListener('click', () => seekBy(-10));
document.getElementById('btn-fwd').addEventListener('click', () => seekBy(10));

// ─── Start overlay ─────────────────────────────────────────
// First tap: resume AudioContext, pre-render sounds, unmute video
const overlay = document.getElementById('start-overlay');

async function handleStart(e) {
  e.preventDefault();
  overlay.removeEventListener('touchstart', handleStart);
  overlay.removeEventListener('pointerdown', handleStart);

  // Resume AudioContext synchronously inside the user gesture
  await resumeContext();

  // Pre-render all drum sounds to AudioBuffers (~50ms)
  await prerender();

  // Unmute the video now that we have a user gesture
  unMute();

  // Fade out and remove the overlay
  overlay.classList.add('fade-out');
  overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
}

overlay.addEventListener('touchstart', handleStart, { passive: false });
overlay.addEventListener('pointerdown', handleStart);
