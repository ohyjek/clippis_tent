# 🎪 TentChat - Spatial Voice Chat

A desktop application prototype recreating **Dolby Axon**-style spatial voice chat. Built with Electron, SolidJS, WebRTC, and the Web Audio API. Two-client voice chat works today: peers connect over a local signaling server, hear each other spatialized in the room, and sync positions over a data channel.

## Overview

TentChat places sound sources at virtual positions in a 2D room. The listener (you) can move around, and audio volume/panning adjusts based on:

- **Distance attenuation** — Sounds get quieter as they move further away (linear, inverse, exponential models)
- **Stereo panning** — Sounds pan left/right based on horizontal position relative to the listener
- **Directional audio** — Speakers have directivity patterns (cardioid, omnidirectional, supercardioid, hypercardioid, figure8, hemisphere)
- **Wall occlusion** — Sound attenuates when passing through room walls
- **Max distance cutoff** — Configurable maximum hearing range with smooth falloff
- **Rear gain floor** — Minimum audibility for sounds behind the listener

Remote voice runs through the same pipeline: a connected peer is just another positioned speaker.

## Features

### The Tent — Spatial Audio Playground

- **Draw rooms** by switching to draw mode and clicking/dragging
- **Multiple speakers** with configurable directivity patterns and frequencies
- **Switch perspective** — Double-click any speaker to "become" them
- **Real-time audio** with test tones (oscillators) or microphone input
- **Visual feedback** — Sound cones, gain bars, and optional sound path lines
- **Room boundaries** with configurable wall attenuation

### Voice Chat (WebRTC)

- **Two-client voice** over an RTCPeerConnection, with mic capture honoring the echo-cancellation/noise-suppression settings
- **Local signaling server** (`pnpm signaling`) relays offer/answer/ICE between exactly two peers
- **Spatialized remote audio** — the remote peer plays through the spatial pipeline on the Tent page (distance, pan, walls)
- **Position sync** — peers exchange position/facing over a negotiated DataChannel
- **Manual fallback** — the WebRTC page also supports copy-paste SDP/ICE exchange without a server

#### Try it locally

```bash
pnpm signaling          # terminal 1: start the relay on ws://localhost:8765
pnpm dev                # terminal 2: first client
pnpm dev                # terminal 3: second client
```

In both windows open the **WebRTC** page → **Connect to signaling**. In one window click **Create offer** — the rest (mic, answer, ICE) is automatic. Then open **The Tent** to hear the other peer spatialized.

### Settings

- Audio processing options (echo cancellation, noise suppression)
- Theme selection (light/dark/system)
- Language preferences
- Hardware acceleration toggle (persisted to the main process)

## Tech Stack

| Component         | Technology                                       |
| ----------------- | ------------------------------------------------ |
| Desktop Framework | Electron 43                                      |
| Build System      | Vite 7 + Electron Forge                          |
| Language          | TypeScript 7 (native compiler preview)           |
| UI Framework      | SolidJS + @solidjs/router (lazy loading)         |
| Styling           | CSS Modules + CSS Custom Properties              |
| Audio             | Web Audio API (oscillators, stereo panner)       |
| Voice             | WebRTC + `ws` signaling relay                    |
| Lint & Format     | Biome                                            |
| Testing           | Vitest + Playwright                              |
| Package Manager   | pnpm (workspace monorepo)                        |

## Getting Started

### Prerequisites

- Node.js 22.12+
- pnpm (`npm install -g pnpm`)

### Installation

```bash
# Clone the repository
git clone https://github.com/ohyjek/TentChat.git
cd TentChat

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Scripts

| Command            | Description                                        |
| ------------------ | -------------------------------------------------- |
| `pnpm dev`         | Run in development mode with hot reload            |
| `pnpm signaling`   | Start the local WebRTC signaling server (:8765)    |
| `pnpm build`       | Package the app for distribution                   |
| `pnpm make`        | Build platform-specific installers                 |
| `pnpm lint`        | Biome lint                                         |
| `pnpm lint:fix`    | Biome lint with safe fixes                         |
| `pnpm format`      | Biome format (write)                               |
| `pnpm typecheck`   | TypeScript type checking (all workspace projects)  |
| `pnpm check`       | typecheck + Biome (strict) + unit tests            |
| `pnpm test`        | Run all unit tests                                 |
| `pnpm test:watch`  | Run tests in watch mode                            |
| `pnpm test:ui`     | Run UI component tests only                        |
| `pnpm test:all`    | Run unit tests + E2E tests                         |
| `pnpm e2e`         | Run Playwright E2E tests                           |
| `pnpm e2e:ui`      | Run E2E tests with interactive UI                  |
| `pnpm e2e:headed`  | Run E2E tests with visible browser                 |
| `pnpm clean`       | Remove build artifacts                             |

### Testing

- **Spatial audio math** (`src/lib/`) — distance, panning, directivity, wall attenuation
- **Stores** (`src/stores/`) — WebRTC negotiation (offer/answer, ICE queueing, glare, DataChannel), audio settings
- **Custom hooks** (`src/lib/hooks/`) — rooms, speakers, playback, microphone, drawing, remote speaker pipeline
- **UI components** (`packages/ui/`) — tested with `@solidjs/testing-library`
- **E2E** (`e2e/`) — critical user flows with Playwright

```bash
pnpm test   # unit tests
pnpm e2e    # end-to-end tests
```

## Architecture

This is a **pnpm workspace monorepo** with UI components and types extracted into reusable packages.

```
TentChat/
├── packages/
│   ├── ui/                           # @tentchat/ui - Reusable UI component library
│   ├── types/                        # @tentchat/types - Shared TypeScript types
│   └── signaling-server/             # Local WebSocket relay for WebRTC signaling
├── src/
│   ├── main.ts                       # Electron main process
│   ├── preload.ts                    # Preload script for IPC
│   ├── renderer.tsx                  # App entry with lazy-loaded routes
│   ├── components/
│   │   ├── ui/                       # App-specific UI wrappers
│   │   ├── audio/FullDemo/           # Main spatial audio playground
│   │   │   ├── context/              # SolidJS context (composes hooks)
│   │   │   ├── components/           # Canvas, panels, toolbar, status bar
│   │   │   ├── constants.ts
│   │   │   └── utils.ts
│   │   └── layout/                   # Layout components
│   ├── pages/                        # Route pages (lazy-loaded)
│   │   ├── Tent.tsx                  # The Tent - spatial audio playground
│   │   ├── WebRTC.tsx                # Voice chat: signaling + manual SDP flows
│   │   └── Settings.tsx              # Settings page
│   ├── stores/                       # Global state (SolidJS signals)
│   │   ├── audio.ts                  # Audio context + processing settings
│   │   ├── webRTC.ts                 # Peer connection, signaling, DataChannel
│   │   ├── theme.ts / toast.ts
│   ├── lib/                          # Core libraries
│   │   ├── spatial-audio.ts          # Spatial audio math
│   │   ├── spatial-utils.ts          # Coordinate/room/wall helpers
│   │   ├── sdp.ts                    # SDP normalization for Chromium's parser
│   │   ├── hooks/                    # Reusable SolidJS hooks
│   │   │   ├── useAudioPlayback.ts   # Audio node lifecycle
│   │   │   ├── useRemoteSpeaker.ts   # Remote peer → spatial pipeline
│   │   │   ├── useMicrophone.ts      # Microphone access
│   │   │   ├── useRoomManager.ts     # Room CRUD
│   │   │   ├── useSpeakerManager.ts  # Speaker CRUD + perspective
│   │   │   └── useCanvasDrawing.ts   # Draw mode interactions
│   │   └── i18n.tsx                  # Localization
│   └── locales/                      # Translation files
└── docs/                             # Roadmap & historical plans
```

### Spatial Audio Model

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

A remote WebRTC peer enters this model via `useRemoteSpeaker`: its MediaStream feeds a source → panner → gain chain driven by the same math, with its position updated over the DataChannel.

## Roadmap

See [docs/TECHNICAL_ROADMAP.md](./docs/TECHNICAL_ROADMAP.md) for history and the HRTF plan.

### ✅ Phase 1: Foundation (Complete)

- [x] Electron + SolidJS + Vite setup
- [x] UI library extraction to `@tentchat/ui` package
- [x] Spatial audio with distance models and directivity patterns
- [x] Interactive room drawing with wall occlusion
- [x] Multiple speakers, perspective switching, modular architecture

### ✅ Phase 4 (out of order): Two-client voice (Shipped)

- [x] WebRTC peer-to-peer audio with mic capture
- [x] Signaling server relay (offer/answer/ICE)
- [x] Position sync over DataChannel
- [x] Remote peer spatialized through the audio pipeline

### 🔄 Phase 2: Voice polish (In Progress)

- [ ] In-app connection panel (#31), canvas indicator for the remote peer (#33)
- [ ] Voice activity detection (VAD) / speaking indicators
- [ ] Push-to-talk mode
- [ ] Keep audio alive across page navigation (remote peer goes silent on Settings)

### 📋 Phase 3: Advanced Audio (Planned)

- [ ] **HRTF** — Migrate from StereoPanner to PannerNode for true 3D audio
- [ ] **Room acoustics** — Reverb and early reflections
- [ ] **Multi-peer rooms** — beyond two clients (rooms in the signaling server, mesh or SFU)

## License

MIT
