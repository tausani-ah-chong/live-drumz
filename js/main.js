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

// ─── Animated video swipe ──────────────────────────────────
const videoContainer = document.getElementById('video-container');
const videoOverlay   = document.getElementById('video-overlay');
let swipeY = 0, swipeX = 0, swiping = false;

function setContainerY(y, animated) {
  videoContainer.style.transition = animated
    ? 'transform 0.18s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
    : 'none';
  videoContainer.style.transform = y === 0 ? '' : `translateY(${y}px)`;
}

function commitSwipe(dir) {
  const vh = window.innerHeight;
  const outY = dir === 'next' ? -vh : vh;
  const inY  = dir === 'next' ?  vh : -vh;

  setContainerY(outY, true);

  setTimeout(() => {
    dir === 'next' ? nextVideo() : prevVideo();
    setContainerY(inY, false);
    requestAnimationFrame(() => requestAnimationFrame(() => setContainerY(0, true)));
  }, 180);
}

videoOverlay.addEventListener('touchstart', (e) => {
  e.preventDefault();
  swipeY = e.touches[0].clientY;
  swipeX = e.touches[0].clientX;
  swiping = true;
  setContainerY(0, false);
}, { passive: false });

videoOverlay.addEventListener('touchmove', (e) => {
  if (!swiping || !started) return;
  const dy = e.touches[0].clientY - swipeY;
  const dx = e.touches[0].clientX - swipeX;
  if (Math.abs(dy) > Math.abs(dx)) {
    setContainerY(dy * 0.6, false); // 0.6 resistance feel
  }
}, { passive: true });

videoOverlay.addEventListener('touchend', (e) => {
  swiping = false;
  if (!started) return;
  const dy = swipeY - e.changedTouches[0].clientY;
  const dx = swipeX - e.changedTouches[0].clientX;
  if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx) * 1.5) {
    commitSwipe(dy > 0 ? 'next' : 'prev');
  } else {
    setContainerY(0, true); // spring back
  }
}, { passive: true });

// ─── Mouse wheel / trackpad (desktop) ──────────────────────
let wheelCooldown = false;
document.addEventListener('wheel', (e) => {
  if (!started || wheelCooldown || Math.abs(e.deltaY) < 30) return;
  wheelCooldown = true;
  setTimeout(() => { wheelCooldown = false; }, 1000);
  commitSwipe(e.deltaY > 0 ? 'next' : 'prev');
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
