let player = null;
let btDelayMs = 0;

function loadAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { resolve(); return; }
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

export async function initPlayer() {
  await loadAPI();

  player = new YT.Player('yt-player', {
    playerVars: {
      list: 'PLDIoUOhQQPlXFSnCfj8HuVhOUSC0QwxYD&si=Zr41O2KhtNSIjue6',
      listType: 'playlist',
      autoplay: 1,
      mute: 1,
      controls: 0,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      disablekb: 1,
      fs: 0,
      iv_load_policy: 3,
    },
    events: {
      onReady(event) {
        event.target.playVideo();
      },
      onStateChange(event) {
        const btn = document.getElementById('btn-play-pause');
        if (!btn) return;
        btn.textContent = event.data === YT.PlayerState.PLAYING ? '⏸' : '▶';
      },
    },
  });
}

export function unMute() {
  if (!player) return;
  player.unMute();
  player.setVolume(100);
}

export function togglePlay() {
  if (!player) return;
  if (player.getPlayerState() === YT.PlayerState.PLAYING) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

export function ensurePlaying() {
  if (!player) return;
  if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
    player.playVideo();
  }
}

export function prevVideo() {
  if (!player) return;
  player.previousVideo();
}

export function nextVideo() {
  if (!player) return;
  player.nextVideo();
}

export function applyBtDelay(ms) {
  if (!player) return;
  const delta = ms - btDelayMs;
  btDelayMs = ms;
  if (delta === 0) return;
  player.seekTo(Math.max(0, (player.getCurrentTime() || 0) + delta / 1000), true);
}
