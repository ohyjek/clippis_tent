# Clippis - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat functionality. Built with Electron, SolidJS, and Web Audio API.

## Overview

Clippis demonstrates spatial audio positioning where sound sources have virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** — Sounds get quieter as they move further away (inverse square law)
- **Stereo panning** — Sounds pan left/right based on horizontal position relative to the listener

## Features

- **The Tent** — Interactive spatial audio playground with three tabbed demos:
  - **Listener Demo** — Move around and hear how distance/panning affects sound
  - **Speaker Direction** — Directional audio where facing affects who hears you
  - **Room Boundaries** — Walls that attenuate sound between rooms
- **Scenarios** — Preset configurations (surround, stereo, distance, campfire, orchestra)
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
| Testing           | Vitest + @solidjs/testing-library          |
| Package Manager   | pnpm (workspace monorepo)                  |

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

| Command             | Description                             |
| ------------------- | --------------------------------------- |
| `pnpm start`        | Run in development mode with hot reload |
| `pnpm package`      | Package the app for distribution        |
| `pnpm make`         | Build platform-specific installers      |
| `pnpm lint`         | Run ESLint                              |
| `pnpm test`         | Run all unit tests (129 tests)          |
| `pnpm test:watch`   | Run tests in watch mode                 |
| `pnpm test:ui`      | Run UI component tests only             |
| `pnpm typecheck`    | TypeScript type checking                |

### Testing

The project has **129 unit tests** covering:

- **Spatial audio library** (`src/lib/spatial-audio.ts`) — 67 tests for distance, panning, and wall attenuation calculations
- **UI components** (`packages/ui/`) — 62 tests for all 8 components using `@solidjs/testing-library`

```bash
# Run all tests
pnpm test

# Run tests with watch mode
pnpm test:watch
```

## Architecture

This is a **pnpm workspace monorepo** with the UI components extracted into a separate package.

```
clippis_tent/
├── packages/
│   └── ui/                        # @clippis/ui - Reusable UI component library
│       ├── src/components/
│       │   ├── Button/            # Button with variants (primary, success, danger)
│       │   ├── Slider/            # Range input with label and value display
│       │   ├── Section/           # Card container with title
│       │   ├── SelectField/       # Dropdown with label
│       │   ├── Tabs/              # Tab navigation component
│       │   ├── Toggle/            # Checkbox with title and description
│       │   ├── Toast/             # Toast notifications
│       │   └── ErrorBoundary/     # Error boundary with fallback UI
│       └── test/                  # Component test setup
├── src/
│   ├── main.ts                    # Electron main process
│   ├── preload.ts                 # Preload script for IPC
│   ├── renderer.tsx               # App entry with lazy-loaded routes
│   ├── components/
│   │   ├── ui/                    # App-specific UI wrappers (logging integration)
│   │   ├── audio/                 # Audio-specific components
│   │   │   ├── TentRoom.tsx       # Listener demo - distance/panning
│   │   │   ├── SpeakerDemo.tsx    # Speaking direction demo
│   │   │   ├── RoomDemo.tsx       # Room boundaries demo
│   │   │   ├── Listener.tsx       # The "you" icon in the room
│   │   │   └── SoundSource.tsx    # Draggable sound source circles
│   │   └── layout/                # Layout components
│   │       ├── App.tsx            # App layout with sidebar + main content
│   │       └── Sidebar.tsx        # Navigation sidebar
│   ├── pages/                     # Route pages (lazy-loaded)
│   │   ├── Tent.tsx               # The Tent - spatial audio playground
│   │   ├── Scenarios.tsx          # Preset spatial audio configurations
│   │   ├── VoiceRoom.tsx          # Voice chat page (placeholder)
│   │   └── Settings.tsx           # Audio settings page
│   ├── stores/
│   │   ├── audio.ts               # Global audio state (SolidJS signals)
│   │   └── toast.ts               # Toast notification state
│   └── lib/
│       ├── spatial-audio.ts       # Spatial audio math utilities
│       ├── logger.ts              # Renderer process logging
│       ├── logger.main.ts         # Main process logging
│       └── perf.ts                # Performance monitoring
└── docs/
    └── TECHNICAL_ROADMAP.md       # Development roadmap
```

### Import Aliases

The project uses `@/` as a path alias to `src/`:

```tsx
// Instead of relative paths like:
import { Button } from "../../components/ui";

// Use the alias:
import { Button } from "@/components/ui";
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

### Technical Infrastructure (Completed)
- [x] Logging and monitoring with `electron-log`
- [x] Error handling with ErrorBoundary and Toast notifications
- [x] UI library extraction to `@clippis/ui` package
- [x] Unit tests for spatial audio and UI components (129 tests)

### Phase 1: The Tent Enhancements
- [x] Draggable sound sources
- [x] Speaking direction (cardioid pattern)
- [x] Room boundaries with wall attenuation
- [x] Tabbed demo navigation
- [x] Preset scenarios (surround, stereo, distance, campfire, orchestra)
- [ ] Waveform options (sine, square, sawtooth, triangle)
- [ ] Looping/continuous sound sources
- [ ] Keyboard controls for listener movement

### Phase 2: Voice Integration
- [ ] Microphone input capture
- [ ] Voice activity detection (VAD)
- [ ] Local audio processing preview

### Phase 3: Multiplayer
- [ ] WebRTC peer-to-peer connections
- [ ] Signaling server for room coordination
- [ ] Avatar/user representation in room
- [ ] Speaking direction arrows on avatars

### Phase 4: Advanced Audio
- [ ] HRTF (Head-Related Transfer Function) for true 3D audio
- [ ] Room acoustics simulation (reverb, echo)
- [ ] Audio quality settings (bitrate, sample rate)

## License

MIT
