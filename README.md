# Clippis Tent - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat functionality. Built with Electron, SolidJS, and Web Audio API.

## Overview

Clippis Tent demonstrates spatial audio positioning where sound sources have virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** - Sounds get quieter as they move further away (inverse square law)
- **Stereo panning** - Sounds pan left/right based on horizontal position relative to the listener

## Features

- Interactive 2D audio room visualization
- Click-to-move listener positioning
- Multiple sound sources with unique frequencies
- Real-time spatial audio processing via Web Audio API
- Master volume control
- Demo modes for testing directional audio

## Tech Stack

| Component         | Technology                                 |
| ----------------- | ------------------------------------------ |
| Desktop Framework | Electron 40                                |
| Build System      | Vite + Electron Forge                      |
| UI Framework      | SolidJS                                    |
| Audio             | Web Audio API (oscillators, stereo panner) |
| Package Manager   | pnpm                                       |

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/Omi/clippis_tent.git
cd clippis_tent

# Install dependencies
pnpm install

# Start development server
pnpm start
```

### Scripts

| Command        | Description                             |
| -------------- | --------------------------------------- |
| `pnpm start`   | Run in development mode with hot reload |
| `pnpm package` | Package the app for distribution        |
| `pnpm make`    | Build platform-specific installers      |
| `pnpm lint`    | Run ESLint                              |
| `pnpm test`    | Run unit tests                          |

## Architecture

```
src/
├── main.ts              # Electron main process
├── preload.ts           # Preload script for IPC
├── renderer.tsx         # SolidJS app entry point
├── components/
│   └── App.tsx          # Main UI component
├── lib/
│   └── spatial-audio.ts # Spatial audio utilities
└── index.css            # Global styles
```

### Spatial Audio Model

The spatial audio system uses a simplified 2D model:

```
                    ┌─────────────────────────┐
                    │                         │
                    │    🔊 Sound Source      │
                    │     (x: -1, y: 2)       │
                    │           │             │
                    │      distance = √((dx)² + (dy)²)
                    │           │             │
                    │           ▼             │
                    │    🎧 Listener          │
                    │     (x: 0, y: 0)        │
                    │                         │
                    └─────────────────────────┘

Volume = 1 / (1 + distance) × masterVolume
Pan    = clamp(dx / 3, -1, 1)
```

## Roadmap

- [ ] Microphone input capture
- [ ] WebRTC peer-to-peer connections
- [ ] Voice activity detection
- [ ] HRTF (Head-Related Transfer Function) for true 3D audio
- [ ] Room acoustics simulation (reverb, echo)
- [ ] Avatar/user representation

## License

MIT
