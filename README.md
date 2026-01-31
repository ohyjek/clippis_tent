# 🎪 Clippi's Tent - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat functionality. Built with Electron, SolidJS, and Web Audio API.

## Overview

Clippis demonstrates spatial audio positioning where sound sources have virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** — Sounds get quieter as they move further away
- **Stereo panning** — Sounds pan left/right based on horizontal position relative to the listener
- **Directional audio** — Speakers have directivity patterns (cardioid, omnidirectional, etc.)
- **Wall occlusion** — Sound attenuates when passing through room walls

## Features

- **The Tent** — Interactive spatial audio playground featuring:
  - Draw rooms by clicking and dragging
  - Draggable listener with facing direction
  - Multiple speakers with configurable directivity patterns
  - Real-time audio with distance attenuation models
  - Room boundaries with configurable wall attenuation
- **Settings** — Configure audio devices, theme, language, and processing options
- **Modern Architecture** — Modular components, SolidJS Context, CSS Modules, `@/` path aliases

## Tech Stack

| Component         | Technology                                 |
| ----------------- | ------------------------------------------ |
| Desktop Framework | Electron 40                                |
| Build System      | Vite + Electron Forge                      |
| UI Framework      | SolidJS + @solidjs/router (lazy loading)   |
| Styling           | CSS Modules + CSS Custom Properties        |
| Audio             | Web Audio API (oscillators, stereo panner) |
| Testing           | Vitest + Playwright + Storybook            |
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
| `pnpm storybook`  | Launch Storybook component explorer     |
| `pnpm clean`      | Remove build artifacts                  |

### Testing

The project has comprehensive test coverage:

- **Spatial audio library** (`src/lib/spatial-audio.ts`) — Distance, panning, and wall attenuation calculations
- **UI components** (`packages/ui/`) — All components tested with `@solidjs/testing-library`
- **E2E tests** (`e2e/`) — Critical user flows with Playwright

```bash
# Run all tests
pnpm test

# Run tests with watch mode
pnpm test:watch
```

## Architecture

This is a **pnpm workspace monorepo** with UI components extracted into a reusable package.

```
clippis_tent/
├── packages/
│   └── ui/                           # @clippis/ui - Reusable UI component library
│       └── src/components/
│           ├── Button/               # Button with variants (primary, success, danger)
│           ├── ColorSwatches/        # Color picker grid
│           ├── ItemList/             # Selectable list with swatches
│           ├── Panel/                # Card container for sidebars
│           ├── Section/              # Card container with title
│           ├── SelectField/          # Dropdown with label
│           ├── Slider/               # Range input with value display
│           ├── Speaker/              # Draggable speaker with directional cone
│           ├── Tabs/                 # Tab navigation
│           ├── Toast/                # Toast notifications
│           ├── Toggle/               # Checkbox with description
│           └── ErrorBoundary/        # Error boundary with fallback UI
├── src/
│   ├── main.ts                       # Electron main process
│   ├── preload.ts                    # Preload script for IPC
│   ├── renderer.tsx                  # App entry with lazy-loaded routes
│   ├── components/
│   │   ├── ui/                       # App-specific UI wrappers (logging)
│   │   ├── audio/                    # Audio-specific components
│   │   │   └── FullDemo/             # Main spatial audio playground
│   │   │       ├── context/          # SolidJS context for state management
│   │   │       │   ├── DemoContext.tsx
│   │   │       │   └── types.ts
│   │   │       ├── components/       # Modular sub-components
│   │   │       │   ├── Toolbar/
│   │   │       │   ├── SpatialCanvas/
│   │   │       │   ├── StatusBar/
│   │   │       │   ├── Sidebar/
│   │   │       │   └── panels/
│   │   │       ├── constants.ts
│   │   │       └── utils.ts
│   │   └── layout/                   # Layout components (App, Sidebar)
│   ├── pages/                        # Route pages (lazy-loaded)
│   │   ├── Tent.tsx                  # The Tent - spatial audio playground
│   │   └── Settings.tsx              # Audio settings page
│   ├── stores/                       # Global state (SolidJS signals)
│   │   ├── audio.ts
│   │   ├── theme.ts
│   │   └── toast.ts
│   └── lib/                          # Core libraries
│       ├── spatial-audio.ts          # Spatial audio math utilities
│       ├── spatial-audio-engine.ts   # Advanced audio engine
│       ├── i18n.tsx                  # Localization
│       └── logger.ts                 # Logging utilities
└── docs/
    └── TECHNICAL_ROADMAP.md          # Development roadmap
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

The spatial audio system uses a 2D model with advanced features:

```
                    ┌─────────────────────────┐
                    │                         │
                    │    🎙️ Sound Source      │
                    │     (x: -1, y: 2)       │
                    │     facing: →           │
                    │           │             │
                    │      distance + walls   │
                    │           │             │
                    │           ▼             │
                    │    🎧 Listener          │
                    │     (x: 0, y: 0)        │
                    │     facing: ↑           │
                    └─────────────────────────┘

Volume = distanceAttenuation × directivityGain × wallOcclusion × masterVolume
Pan    = calculateStereoPan(listener, source, listenerFacing)
```

## Roadmap

### Completed

- [x] Logging and monitoring with `electron-log`
- [x] Error handling with ErrorBoundary and Toast notifications
- [x] UI library extraction to `@clippis/ui` package
- [x] Unit tests for spatial audio and UI components
- [x] Theme system (light/dark/system)
- [x] Localization infrastructure (i18n)
- [x] Accessibility (WCAG 2.1)
- [x] Advanced spatial audio engine (distance models, directivity patterns)
- [x] Interactive room drawing with wall occlusion
- [x] Multiple speakers with configurable properties
- [x] Draggable listener with facing direction
- [x] Modular component architecture with SolidJS Context

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
