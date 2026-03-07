# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Serving

No build step. Serve directly as a static site:

```sh
npx serve .
# or
python3 -m http.server
```

The app requires an HTTP server (not `file://`) because it uses ES modules.

## Architecture

Zero external dependencies — pure vanilla JS ES modules, no npm, no bundler, no framework.

| File | Role |
|------|------|
| `js/main.js` | Entry point; imports all modules and wires up event listeners |
| `js/youtube.js` | YouTube IFrame API wrapper — playlist/video loading, track switching, volume |
| `js/pads.js` | Drum pad event handling (touch, mouse, keyboard: Q/W/E/R) |
| `js/audio/synth.js` | Synthesizes kick, snare, hihat, clap via Web Audio API; pre-renders to buffers at startup |
| `js/audio/context.js` | Singleton `AudioContext` with iOS/Safari resume helper |

### Key patterns

- **Pre-rendered audio**: All 4 drum sounds are synthesised once into `AudioBuffer`s using `OfflineAudioContext` on app start, then played back from buffers for zero-latency triggering. Do not switch to live synthesis.

- **Transparent overlay for touch**: `#video-overlay` is a transparent `div` that sits above the YouTube `<iframe>` to intercept swipe/touch events. Swipe up/down (portrait) or left/right (force-landscape) animates the video container out and calls `nextVideo()` / `prevVideo()`. The axis is detected at `touchstart` via `document.body.classList.contains('force-landscape')`.

- **iOS audio**: `AudioContext` must be resumed synchronously inside a user-gesture handler. `unMute()` must also be called inside the same gesture — calling it from a promise callback causes iOS to pause the video. Drum buffers are pre-rendered at page load via `OfflineAudioContext` (no user gesture required) so they are ready before the first pad tap. The `start-tap-btn` is a `<div>` not a `<button>` to prevent iOS Safari ghost clicks bleeding through to the YouTube iframe.

- **YouTube player rebuild**: `loadFromUrl()` destroys and recreates the YT player instead of calling `loadPlaylist()`, which is unreliable during active playback.
