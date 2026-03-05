import { sounds } from './audio/synth.js';

const KEY_MAP = {
  q: 'kick',
  w: 'snare',
  e: 'hihat',
  r: 'clap',
};

function triggerPad(el) {
  const sound = el.dataset.sound;
  if (!sounds[sound]) return;
  sounds[sound]();
  el.classList.add('pad--active');
  setTimeout(() => el.classList.remove('pad--active'), 60);
}

export function initPads() {
  const pads = document.querySelectorAll('.pad');

  pads.forEach((pad) => {
    pad.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      triggerPad(pad);
    });
  });

  // Keyboard fallback (desktop / hardware keyboard on mobile)
  document.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    const sound = KEY_MAP[e.key.toLowerCase()];
    if (!sound) return;
    const pad = document.querySelector(`.pad[data-sound="${sound}"]`);
    if (pad) triggerPad(pad);
  });
}
