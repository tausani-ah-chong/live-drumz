import { sounds } from './audio/synth.js';
import { ensurePlaying } from './youtube.js';

const KEY_MAP = {
  q: 'kick',
  w: 'snare',
  e: 'hihat',
  r: 'clap',
};

function triggerPad(el) {
  const sound = el.dataset.sound;
  if (!sounds[sound]) return;

  // First tap unblocks autoplay
  ensurePlaying();

  // Fire sound — new nodes each call so taps always overlap
  sounds[sound]();

  // Visual flash: remove any existing active class first so rapid taps re-trigger the animation
  el.classList.remove('pad--active');
  // Force reflow so the class removal takes effect before re-adding
  void el.offsetWidth;
  el.classList.add('pad--active');
  setTimeout(() => el.classList.remove('pad--active'), 80);
}

export function initPads() {
  const pads = document.querySelectorAll('.pad');

  pads.forEach((pad) => {
    // touchstart fires before pointerdown on mobile — use it for lowest latency
    pad.addEventListener('touchstart', (e) => {
      e.preventDefault(); // prevents 300ms click delay and scroll
      triggerPad(pad);
    }, { passive: false });

    // pointerdown handles mouse (and touch on non-touch-event browsers)
    pad.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // already handled by touchstart
      e.preventDefault();
      triggerPad(pad);
    });
  });

  // Keyboard fallback
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const sound = KEY_MAP[e.key.toLowerCase()];
    if (!sound) return;
    const pad = document.querySelector(`.pad[data-sound="${sound}"]`);
    if (pad) triggerPad(pad);
  });
}
