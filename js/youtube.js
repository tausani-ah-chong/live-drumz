const DEFAULT_VIDEO_ID = 'pvf_Qv4rmLM';

let player = null;
let onReadyCallback = null;

// Load YouTube IFrame API script once
function loadAPI() {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    window.onYouTubeIframeAPIReady = resolve;
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  });
}

export async function initPlayer(videoId = DEFAULT_VIDEO_ID, onReady) {
  onReadyCallback = onReady;
  await loadAPI();

  player = new YT.Player('yt-player', {
    videoId,
    playerVars: {
      autoplay: 1,
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
        if (onReadyCallback) onReadyCallback();
      },
      onStateChange(event) {
        const btn = document.getElementById('btn-play-pause');
        if (!btn) return;
        // YT.PlayerState.PLAYING = 1
        btn.textContent = event.data === 1 ? '⏸' : '▶';
      },
    },
  });
}

export function togglePlay() {
  if (!player) return;
  const state = player.getPlayerState();
  // 1 = playing, 2 = paused, -1 = unstarted, 0 = ended, 3 = buffering
  if (state === 1) {
    player.pauseVideo();
  } else {
    player.playVideo();
  }
}

export function seekBy(seconds) {
  if (!player) return;
  const current = player.getCurrentTime() || 0;
  player.seekTo(Math.max(0, current + seconds), true);
}
