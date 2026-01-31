# Clippis Tent - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat functionality. Built with Electron, SolidJS, and Web Audio API.

## Overview

Clippis Tent demonstrates spatial audio positioning where sound sources have virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** - Sounds get quieter as they move further away (inverse square law)
- **Stereo panning** - Sounds pan left/right based on horizontal position relative to the listener

## Features

- **Spatial Audio Room** - Interactive 2D visualization with moveable listener and sound sources
- **Real-time Audio Processing** - Web Audio API with distance attenuation and stereo panning
- **Settings Page** - Configure audio devices, volume, and processing options
- **Modern UI** - Sidebar navigation, CSS Modules, design tokens
- **Production Architecture** - Component-based structure with global state management

## Tech Stack

| Component         | Technology                                 |
| ----------------- | ------------------------------------------ |
| Desktop Framework | Electron 40                                |
| Build System      | Vite + Electron Forge                      |
| UI Framework      | SolidJS + @solidjs/router                  |
| Styling           | CSS Modules + CSS Custom Properties        |
| Audio             | Web Audio API (oscillators, stereo panner) |
| Testing           | Vitest                                     |
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
├── main.ts                    # Electron main process
├── preload.ts                 # Preload script for IPC
├── renderer.tsx               # App entry with routing
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx
│   │   └── Slider.tsx
│   ├── audio/                 # Audio-specific components
│   │   ├── AudioRoom.tsx
│   │   ├── Listener.tsx
│   │   └── SoundSource.tsx
│   └── layout/                # Layout components
│       ├── Shell.tsx
│       └── Sidebar.tsx
├── pages/                     # Page components
│   ├── Home.tsx               # Main audio room page
│   └── Settings.tsx           # Audio settings page
├── stores/
│   └── audio.ts               # Global audio state
├── lib/
│   └── spatial-audio.ts       # Spatial audio utilities
└── styles/
    └── variables.css          # CSS custom properties
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
