import { initPlayer, togglePlay, prevVideo, nextVideo, unMute, ensurePlaying, loadFromUrl } from './youtube.js';
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

// ─── YouTube URL load panel ─────────────────────────────────
const btnLoad    = document.getElementById('btn-load');
const ytPanel    = document.getElementById('yt-load-panel');
const ytInput    = document.getElementById('yt-url-input');
const ytGo       = document.getElementById('yt-url-go');
const ytError    = document.getElementById('yt-load-error');

function closeLoadPanel() {
  btnLoad.classList.remove('load-active');
  ytPanel.hidden = true;
}

btnLoad.addEventListener('click', () => {
  const active = btnLoad.classList.toggle('load-active');
  ytPanel.hidden = !active;
  if (active) {
    ytError.hidden = true;
    setTimeout(() => ytInput.focus(), 50);
  }
});

function submitUrl() {
  const ok = loadFromUrl(ytInput.value.trim());
  if (ok) {
    ytInput.value = '';
    closeLoadPanel();
  } else {
    ytError.hidden = false;
  }
}

ytGo.addEventListener('click', submitUrl);
ytInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitUrl(); });

// Tapping the video overlay closes the panel if open
document.getElementById('video-overlay').addEventListener('click', () => {
  if (!ytPanel.hidden) closeLoadPanel();
});

// ─── Track switch helpers ───────────────────────────────────
function flashSwitch(dir) {
  const el = document.getElementById('switch-overlay');
  el.querySelector('.switch-arrow').innerHTML = dir === 'next'
    ? `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18,15 12,9 6,15"/></svg>`
    : `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6,9 12,15 18,9"/></svg>`;
  el.classList.add('active');
  setTimeout(() => el.classList.remove('active'), 350);
}

function doNext() { if (started) { flashSwitch('next'); nextVideo(); } }
function doPrev() { if (started) { flashSwitch('prev'); prevVideo(); } }

// ─── Swipe gesture (TikTok-style) ──────────────────────────
// Listeners go on #video-overlay (z-index 5, above the cross-origin iframe)
// so the iframe can never steal touch events and break subsequent swipes.
// Pad/transport areas sit above the overlay (z-index 20) so their touches
// never reach here — no exclusion logic needed.
const videoOverlay = document.getElementById('video-overlay');
let swipeY = 0, swipeX = 0;

videoOverlay.addEventListener('touchstart', (e) => {
  e.preventDefault(); // claim the touch — prevents browser routing it to the iframe
  swipeY = e.touches[0].clientY;
  swipeX = e.touches[0].clientX;
}, { passive: false }); // passive: false is required to call preventDefault

videoOverlay.addEventListener('touchend', (e) => {
  if (!started) return;
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
