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
| `js/youtube.js` | YouTube IFrame API wrapper — playlist/video loading, track switching, volume, BT sync seek |
| `js/pads.js` | Drum pad event handling (touch, mouse, keyboard: Q/W/E/R) |
| `js/audio/synth.js` | Synthesizes kick, snare, hihat, clap via Web Audio API; pre-renders to buffers at startup |
| `js/audio/context.js` | Singleton `AudioContext` with iOS/Safari resume helper |

### Key patterns

- **Pre-rendered audio**: All 4 drum sounds are synthesised once into `AudioBuffer`s using `OfflineAudioContext` on app start, then played back from buffers for zero-latency triggering. Do not switch to live synthesis.

- **Transparent overlay for touch**: `#video-overlay` is a transparent `div` that sits above the YouTube `<iframe>` to intercept swipe/touch events that the iframe would otherwise swallow. Swipe up/down on this overlay calls `nextVideo()` / `prevVideo()`.

- **Bluetooth sync**: The BT slider (±1000 ms) compensates for Bluetooth speaker latency by seeking the YouTube player with `seekTo()` on every pad hit.

- **iOS audio**: `AudioContext` must be resumed inside a user-gesture handler. The start overlay tap triggers `resumeContext()` before any sound plays.
