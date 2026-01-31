# 🎪 Clippi's Tent - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat functionality. Built with Electron, SolidJS, and Web Audio API.

## Overview

Clippis demonstrates spatial audio positioning where sound sources have virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** — Sounds get quieter as they move further away (linear, inverse, exponential models)
- **Stereo panning** — Sounds pan left/right based on horizontal position relative to the listener
- **Directional audio** — Speakers have directivity patterns (cardioid, omnidirectional, supercardioid, hypercardioid, figure8, hemisphere)
- **Wall occlusion** — Sound attenuates when passing through room walls
- **Max distance cutoff** — Configurable maximum hearing range with smooth falloff
- **Rear gain floor** — Minimum audibility for sounds behind the listener

## Features

### The Tent — Spatial Audio Playground

- **Draw rooms** by switching to draw mode and clicking/dragging
- **Multiple speakers** with configurable directivity patterns and frequencies
- **Switch perspective** — Double-click any speaker to "become" them
- **Real-time audio** with test tones (oscillators) or microphone input
- **Visual feedback** — Sound cones, gain bars, and optional sound path lines
- **Room boundaries** with configurable wall attenuation

### Settings

- Configure audio devices (input/output)
- Theme selection (light/dark/system)
- Language preferences
- Audio processing options (echo cancellation, noise suppression)

## Tech Stack

| Component         | Technology                                 |
| ----------------- | ------------------------------------------ |
| Desktop Framework | Electron 40                                |
| Build System      | Vite + Electron Forge                      |
| UI Framework      | SolidJS + @solidjs/router (lazy loading)   |
| Styling           | CSS Modules + CSS Custom Properties        |
| Audio             | Web Audio API (oscillators, stereo panner) |
| Testing           | Vitest + Playwright                        |
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
pnpm dev
```

### Scripts

| Command           | Description                             |
| ----------------- | --------------------------------------- |
| `pnpm dev`        | Run in development mode with hot reload |
| `pnpm build`      | Package the app for distribution        |
| `pnpm make`       | Build platform-specific installers      |
| `pnpm lint`       | Run ESLint                              |
| `pnpm lint:fix`   | Run ESLint with auto-fix                |
| `pnpm typecheck`  | TypeScript type checking                |
| `pnpm check`      | Run both typecheck and lint             |
| `pnpm test`       | Run all unit tests                      |
| `pnpm test:watch` | Run tests in watch mode                 |
| `pnpm test:ui`    | Run UI component tests only             |
| `pnpm test:all`   | Run unit tests + E2E tests              |
| `pnpm e2e`        | Run Playwright E2E tests                |
| `pnpm e2e:ui`     | Run E2E tests with interactive UI       |
| `pnpm e2e:headed` | Run E2E tests with visible browser      |
| `pnpm clean`      | Remove build artifacts                  |

### Testing

The project has comprehensive test coverage:

- **Spatial audio library** (`src/lib/spatial-audio*.ts`) — Distance, panning, directivity, and wall attenuation calculations
- **Custom hooks** (`src/lib/hooks/`) — Room, speaker, audio playback, microphone, and drawing hooks
- **UI components** (`packages/ui/`) — All components tested with `@solidjs/testing-library`
- **E2E tests** (`e2e/`) — Critical user flows with Playwright

```bash
# Run all tests (275 unit tests)
pnpm test

# Run E2E tests (19 tests)
pnpm e2e
```

## Architecture

This is a **pnpm workspace monorepo** with UI components and types extracted into reusable packages.

```
clippis_tent/
├── packages/
│   ├── ui/                           # @clippis/ui - Reusable UI component library
│   │   └── src/components/
│   │       ├── Button/               # Button with variants
│   │       ├── ColorSwatches/        # Color picker grid
│   │       ├── FormField/            # Input, dropdown, slider fields
│   │       ├── ItemList/             # Selectable list
│   │       ├── Panel/                # Card container
│   │       ├── Section/              # Card with title
│   │       ├── SelectField/          # Dropdown
│   │       ├── Slider/               # Range input
│   │       ├── Speaker/              # Draggable speaker with cone
│   │       ├── Tabs/                 # Tab navigation
│   │       ├── Toast/                # Notifications
│   │       ├── Toggle/               # Checkbox with description
│   │       └── ErrorBoundary/        # Error boundary
│   └── types/                        # @clippis/types - Shared TypeScript types
├── src/
│   ├── main.ts                       # Electron main process
│   ├── preload.ts                    # Preload script for IPC
│   ├── renderer.tsx                  # App entry with lazy-loaded routes
│   ├── components/
│   │   ├── ui/                       # App-specific UI wrappers
│   │   ├── audio/                    # Audio components
│   │   │   └── FullDemo/             # Main spatial audio playground
│   │   │       ├── context/          # SolidJS context (composes hooks)
│   │   │       ├── components/       # Modular sub-components
│   │   │       ├── constants.ts
│   │   │       └── utils.ts
│   │   └── layout/                   # Layout components
│   ├── pages/                        # Route pages (lazy-loaded)
│   │   ├── Tent.tsx                  # The Tent - spatial audio playground
│   │   └── Settings.tsx              # Audio settings page
│   ├── stores/                       # Global state (SolidJS signals)
│   ├── lib/                          # Core libraries
│   │   ├── spatial-audio.ts          # Spatial audio math utilities
│   │   ├── spatial-audio-engine.ts   # Advanced audio engine
│   │   ├── hooks/                    # Reusable SolidJS hooks
│   │   │   ├── useAudioPlayback.ts   # Audio node lifecycle
│   │   │   ├── useMicrophone.ts      # Microphone access
│   │   │   ├── useRoomManager.ts     # Room CRUD
│   │   │   ├── useSpeakerManager.ts  # Speaker CRUD + perspective
│   │   │   ├── useCanvasDrawing.ts   # Draw mode interactions
│   │   │   └── useDragHandler.ts     # Drag/rotate interactions
│   │   └── i18n.tsx                  # Localization
│   └── locales/                      # Translation files
└── docs/
    └── TECHNICAL_ROADMAP.md          # Development roadmap & HRTF plan
```

### Spatial Audio Model

The spatial audio system uses a 2D model with advanced features:

```
                    ┌─────────────────────────┐
                    │                         │
                    │    🎤 Sound Source      │
                    │     position, facing    │
                    │     directivity pattern │
                    │           │             │
                    │    distance + walls     │
                    │    + directivity        │
                    │           │             │
                    │           ▼             │
                    │    🎧 Listener (You)    │
                    │     position, facing    │
                    └─────────────────────────┘

Volume = distanceAttenuation × directivityGain × listenerDirectionalGain × wallOcclusion × masterVolume
Pan    = calculateStereoPan(listener, source, listenerFacing)
```

## Roadmap

See [docs/TECHNICAL_ROADMAP.md](./docs/TECHNICAL_ROADMAP.md) for the detailed technical roadmap.

### ✅ Phase 1: Foundation (Complete)

- [x] Electron + SolidJS + Vite setup
- [x] UI library extraction to `@clippis/ui` package
- [x] Spatial audio engine with distance models and directivity patterns
- [x] Interactive room drawing with wall occlusion
- [x] Multiple speakers with configurable properties
- [x] Perspective switching (become any speaker)
- [x] Modular component architecture with SolidJS Context and hooks
- [x] Comprehensive test coverage (275 unit + 19 E2E)

### 🔄 Phase 2: Voice Integration (In Progress)

- [x] Microphone input capture with permissions
- [x] Audio source switching (oscillator/microphone)
- [ ] Voice activity detection (VAD)
- [ ] Push-to-talk mode
- [ ] Audio level meters / visualizers

### 📋 Phase 3: Advanced Audio (Planned)

- [ ] **HRTF** — Migrate from StereoPanner to PannerNode for true 3D audio
- [ ] **Room acoustics** — Reverb and early reflections
- [ ] **Audio quality settings** — Bitrate, sample rate options

### 📋 Phase 4: Multiplayer (Future)

- [ ] WebRTC peer-to-peer connections
- [ ] Signaling server for room coordination
- [ ] User avatars with position sync
- [ ] Proximity-based audio routing

## License

MIT
