import { initPlayer, togglePlay, seekBy } from './youtube.js';
import { initPads } from './pads.js';

// Init drum pads
initPads();

// Init YouTube player
initPlayer();

// Transport controls
document.getElementById('btn-play-pause').addEventListener('click', togglePlay);
document.getElementById('btn-back').addEventListener('click', () => seekBy(-10));
document.getElementById('btn-fwd').addEventListener('click', () => seekBy(10));
