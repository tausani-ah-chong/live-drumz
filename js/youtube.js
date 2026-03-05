const DEFAULT_VIDEO_ID = 'pvf_Qv4rmLM';

let player = null;

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

export async function initPlayer(videoId = DEFAULT_VIDEO_ID) {
  await loadAPI();

  player = new YT.Player('yt-player', {
    videoId,
    playerVars: {
      autoplay: 1,
      mute: 1,        // muted autoplay works in all browsers
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

// Call inside a user gesture to unmute the video
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

export function seekBy(seconds) {
  if (!player) return;
  player.seekTo(Math.max(0, (player.getCurrentTime() || 0) + seconds), true);
}

export function ensurePlaying() {
  if (!player) return;
  if (player.getPlayerState() !== YT.PlayerState.PLAYING) {
    player.playVideo();
  }
}
