# Clippis - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat functionality. Built with Electron, SolidJS, and Web Audio API.

## Overview

Clippis demonstrates spatial audio positioning where sound sources have virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** — Sounds get quieter as they move further away (inverse square law)
- **Stereo panning** — Sounds pan left/right based on horizontal position relative to the listener

## Features

- **The Tent** — Interactive 2D visualization to test spatial audio with oscillator tones
- **Voice Room** — (Coming soon) Real-time voice chat with WebRTC
- **Settings** — Configure audio devices, volume, and processing options
- **Modern Architecture** — Lazy-loaded routes, global state, CSS Modules, `@/` path aliases

## Tech Stack

| Component         | Technology                                 |
| ----------------- | ------------------------------------------ |
| Desktop Framework | Electron 40                                |
| Build System      | Vite + Electron Forge                      |
| UI Framework      | SolidJS + @solidjs/router (lazy loading)   |
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
├── renderer.tsx               # App entry with lazy-loaded routes
├── components/
│   ├── ui/                    # Reusable UI components
│   │   ├── Button.tsx         # Button with variants (primary, success, danger, etc.)
│   │   ├── Slider.tsx         # Range input with label and value display
│   │   ├── Section.tsx        # Card container with title
│   │   ├── SelectField.tsx    # Dropdown with label
│   │   └── Toggle.tsx         # Checkbox with title and description
│   ├── audio/                 # Audio-specific components
│   │   ├── TentRoom.tsx       # Main spatial audio interface
│   │   ├── Listener.tsx       # The "you" icon in the room
│   │   └── SoundSource.tsx    # Draggable sound source circles
│   └── layout/                # Layout components
│       ├── App.tsx            # App layout with sidebar + main content
│       └── Sidebar.tsx        # Navigation sidebar
├── pages/                     # Route pages (lazy-loaded)
│   ├── Tent.tsx               # The Tent - spatial audio playground
│   ├── VoiceRoom.tsx          # Voice chat page (placeholder)
│   └── Settings.tsx           # Audio settings page
├── stores/
│   └── audio.ts               # Global audio state (SolidJS signals)
├── lib/
│   └── spatial-audio.ts       # Spatial audio math utilities (tested)
└── styles/
    └── variables.css          # CSS custom properties (colors, spacing, etc.)
```

### Import Aliases

The project uses `@/` as a path alias to `src/`:

```tsx
// Instead of relative paths like:
import { Button } from "../../components/ui";

// Use the alias:
import { Button } from "@/components/ui";
```

See [`src/components/README.md`](src/components/README.md) for component documentation.

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

### Phase 1: The Tent Enhancements
- [ ] Waveform options (sine, square, sawtooth, triangle)
- [ ] Looping/continuous sound sources
- [ ] Keyboard controls for listener movement
- [x] Draggable sound sources
- [ ] Preset scenarios (surround test, stereo test)

### Phase 2: Voice Integration
- [ ] Microphone input capture
- [ ] Voice activity detection (VAD)
- [ ] Local audio processing preview

### Phase 3: Multiplayer
- [ ] WebRTC peer-to-peer connections
- [ ] Signaling server for room coordination
- [ ] Avatar/user representation in room

### Phase 4: Advanced Audio
- [ ] HRTF (Head-Related Transfer Function) for true 3D audio
- [ ] Room acoustics simulation (reverb, echo)
- [ ] Audio quality settings (bitrate, sample rate)

## License

MIT
