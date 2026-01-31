# Technical Roadmap

A phased technical roadmap covering infrastructure (logging, error handling, testing), user experience (themes, localization, accessibility), spatial audio features, and future features (auth, analytics) - prioritized for a team of up to 5 developers.

This roadmap is organized into phases that can be worked on incrementally. Each phase builds on the previous.

**Status Overview**:
- ✅ Phase 1-4: Infrastructure complete (logging, errors, UI library, testing)
- 🔲 Phase 5: CI/CD & versioning planned
- ✅ Phase 6-7: UX enhancements complete (themes, i18n, accessibility)
- 🔲 Phase 8: Enhanced Room System planned
- 🔲 Phase 9: Auth foundation planned
- 🔲 Phase 10: Analytics planned (late)

---

## Phase 1: Logging and Monitoring Foundation ✅ COMPLETED

**Goal**: Establish structured logging before adding more complexity.

**Status**: Implemented in `src/lib/logger.ts`, `src/lib/logger.main.ts`, and `src/lib/perf.ts`.

### 1.1 Logging Library

Use **electron-log** - purpose-built for Electron apps (logs to file + console, works in main/renderer).

```
pnpm add electron-log
```

Create `src/lib/logger.ts`:

```typescript
import log from "electron-log";

// Configure log levels based on environment
log.transports.file.level = "info";
log.transports.console.level = import.meta.env.DEV ? "debug" : "warn";

export const logger = {
  debug: log.debug,
  info: log.info,
  warn: log.warn,
  error: log.error,
  // Scoped loggers for different modules
  audio: log.scope("audio"),
  ui: log.scope("ui"),
  store: log.scope("store"),
};
```

### 1.2 Performance Monitoring

Add simple performance markers using the Performance API:

```typescript
// src/lib/perf.ts
export const perf = {
  mark: (name: string) => performance.mark(name),
  measure: (name: string, start: string, end?: string) => {
    const measure = performance.measure(name, start, end);
    logger.debug(`[perf] ${name}: ${measure.duration.toFixed(2)}ms`);
    return measure;
  },
};
```

### 1.3 Files to Update

- `src/stores/audio.ts` - Replace `console.log` with `logger.audio`
- `src/pages/Settings.tsx` - Replace `console.error` with `logger.error`
- `src/main.ts` - Add startup logging, window lifecycle events

---

## Phase 2: Error Handling and Resilience ✅ COMPLETED

**Goal**: Graceful error handling with user feedback.

**Status**: Implemented with `ErrorBoundary`, `ToastContainer`, global error handlers in `renderer.tsx`, and audio error handling in `stores/audio.ts`.

### 2.1 SolidJS Error Boundary

Create `src/components/ui/ErrorBoundary.tsx`:

```typescript
import { ErrorBoundary as SolidErrorBoundary } from "solid-js";

export function ErrorBoundary(props: { children: JSX.Element }) {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) => (
        <div class={styles.error}>
          <h2>Something went wrong</h2>
          <p>{err.message}</p>
          <Button onClick={reset}>Try Again</Button>
        </div>
      )}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}
```

### 2.2 Global Error Handlers

Add to `src/renderer.tsx`:

```typescript
window.onerror = (msg, src, line, col, error) => {
  logger.error("Uncaught error:", { msg, src, line, col, error });
};
window.onunhandledrejection = (event) => {
  logger.error("Unhandled promise rejection:", event.reason);
};
```

### 2.3 Toast Notifications

Create `src/components/ui/Toast.tsx` for user-facing error messages:

- Error, warning, success, info variants
- Auto-dismiss with configurable duration
- Stack multiple toasts

### 2.4 Audio Error Handling

Wrap audio operations in `src/stores/audio.ts`:

```typescript
const initializeAudio = () => {
  try {
    audioContext = new AudioContext();
    logger.audio.info("Audio context initialized");
    return true;
  } catch (err) {
    logger.audio.error("Failed to initialize audio:", err);
    showToast({ type: "error", message: "Could not initialize audio" });
    return false;
  }
};
```

---

## Phase 3: UI Library Extraction (pnpm Workspace) ✅ COMPLETED

**Goal**: Decouple UI components with their own test suite.

**Status**: Implemented with `@clippis/ui` package containing reusable components (Button, Section, SelectField, Slider, Tabs, Toggle, ErrorBoundary, Toast, Speaker).

### 3.1 Workspace Structure (Actual)

```
clippis_tent/
├── pnpm-workspace.yaml
├── packages/
│   └── ui/                      # @clippis/ui Library
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── components/
│       │   │   ├── Button/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Button.module.css
│       │   │   │   ├── Button.test.tsx
│       │   │   │   └── index.ts
│       │   │   └── ... (7 more components)
│       │   └── index.ts         # Public API
│       └── test/
│           ├── setup.ts         # Test setup with CSS vars
│           └── vitest.d.ts      # jest-dom type definitions
├── src/                         # Main Electron app (kept in place)
│   └── ...
└── docs/
    └── TECHNICAL_ROADMAP.md
```

### 3.2 pnpm Workspace Config

`pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
```

### 3.3 UI Package Dependencies

`packages/ui/package.json`:

```json
{
  "name": "@clippis/ui",
  "version": "0.1.0",
  "main": "src/index.ts",
  "peerDependencies": {
    "solid-js": "^1.9.0"
  },
  "devDependencies": {
    "@solidjs/testing-library": "^0.8.0",
    "vitest": "^4.0.0"
  }
}
```

### 3.4 Component Test Pattern

Each component gets a `.test.tsx` file:

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from "@solidjs/testing-library";
import { Button } from "./Button";

describe("Button", () => {
  it("renders children", () => {
    render(() => <Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });

  it("applies variant class", () => {
    render(() => <Button variant="primary">Primary</Button>);
    expect(screen.getByRole("button")).toHaveClass("primary");
  });

  it("calls onClick when clicked", () => {
    const onClick = vi.fn();
    render(() => <Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalled();
  });
});
```

### 3.5 Mock Data Structure

`packages/ui/mocks/`:

```
mocks/
├── data/
│   ├── selectOptions.ts    # Sample SelectField options
│   ├── tabs.ts             # Sample Tabs data
│   └── scenarios.ts        # Sample scenario configs
└── handlers/
    └── events.ts           # Mock event handlers
```

---

## Phase 4: Comprehensive Testing Strategy ✅ COMPLETED

**Goal**: Layered testing for confidence in agent-assisted development.

**Status**: 
- Unit tests: Comprehensive coverage for spatial-audio library and UI components
- Storybook: Configured with stories for all UI components
- E2E tests: Playwright setup covering critical user flows

### Testing Pyramid

```
        ╱╲
       ╱  ╲  E2E (Playwright)
      ╱────╲  - Critical user flows
     ╱      ╲
    ╱────────╲
   ╱          ╲  Integration
  ╱────────────╲ - Component + store interactions
 ╱              ╲
╱────────────────╲
       Unit        - Pure functions, components
                   - Fast, isolated
```

### 4.1 Unit Tests (Already have Vitest)

**Add dependencies**:

```
pnpm add -D @solidjs/testing-library jsdom
```

**Update** `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
  },
});
```

**Coverage targets**:

- UI components: 80%+ coverage
- Lib utilities: 90%+ coverage (already good)
- Stores: 70%+ coverage

### 4.2 Storybook (Component Development)

**Why Storybook for this project**:

- Visual documentation for 6+ UI components
- Isolated component development (no need to run full app)
- Visual regression testing via Chromatic
- Helps agents understand component APIs

**Setup**:

```
pnpm add -D storybook @storybook/solidjs-vite
npx storybook@latest init --type solidjs
```

**Story pattern**:

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from "storybook-solidjs";
import { Button } from "./Button";

const meta: Meta<typeof Button> = {
  component: Button,
  tags: ["autodocs"],
};
export default meta;

export const Primary: StoryObj<typeof Button> = {
  args: { variant: "primary", children: "Primary Button" },
};
export const AllVariants: StoryObj<typeof Button> = {
  render: () => (
    <div style={{ display: "flex", gap: "8px" }}>
      <Button variant="primary">Primary</Button>
      <Button variant="success">Success</Button>
      <Button variant="danger">Danger</Button>
      <Button variant="outline">Outline</Button>
    </div>
  ),
};
```

### 4.3 E2E Tests (Playwright)

**Setup**:

```
pnpm add -D @playwright/test electron
```

**Test critical flows**:

```typescript
// e2e/scenarios.spec.ts
test("can play scenario audio", async ({ electronApp }) => {
  const page = await electronApp.firstWindow();
  await page.click("text=Scenarios");
  await page.selectOption("select", "stereo");
  await page.click("text=Play All");
  // Assert audio started (check UI state)
  await expect(page.locator('button:has-text("Stop")')).toBeEnabled();
});
```

**E2E coverage**:

- Scenario playback
- Settings changes persist
- Tab navigation
- Error states

---

## Phase 5: CI/CD Pipeline & Versioning 🔲 PLANNED

**Goal**: Automated quality gates, deployment pipeline, and semantic versioning.

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      
      - run: pnpm install --frozen-lockfile
      - run: npx playwright install --with-deps
      - run: pnpm e2e
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 5.2 Quality Gates

| Check          | When                | Blocking |
| -------------- | ------------------- | -------- |
| TypeScript     | Every PR            | Yes      |
| ESLint         | Every PR            | Yes      |
| Unit Tests     | Every PR            | Yes      |
| E2E Tests      | Every PR            | Yes      |
| Build          | Every PR to main    | Yes      |

### 5.3 Branch Protection Rules

- Require PR reviews before merging
- Require status checks to pass (CI workflow)
- Require branches to be up to date before merging
- No direct pushes to `main`

### 5.4 Optional Enhancements

- **Dependabot**: Automated dependency updates
- **CodeQL**: Security scanning
- **Chromatic**: Visual regression testing for Storybook
- **Release Please**: Automated changelog and versioning

### 5.5 Versioning Strategy

Use **Semantic Versioning** (SemVer) with automated changelog generation.

**Version Format**: `MAJOR.MINOR.PATCH`
- **MAJOR**: Breaking changes (API changes, major UX overhauls)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes, performance improvements

**Tooling Options**:

| Tool              | Pros                                    | Cons                   |
| ----------------- | --------------------------------------- | ---------------------- |
| **Release Please**| Google-maintained, conventional commits | Requires commit format |
| **Changesets**    | Monorepo-friendly, manual control       | More manual work       |
| **Standard Version** | Simple, works with npm version       | Less automated         |

**Recommendation**: Release Please for automation with conventional commits.

**Conventional Commit Format**:
```
feat: add spatial audio direction indicator
fix: resolve audio crackling on Windows
chore: update dependencies
docs: add versioning strategy to roadmap
BREAKING CHANGE: rename AudioContext API
```

**Automated Workflow**:
1. PRs merged to `main` with conventional commits
2. Release Please creates/updates a release PR
3. Merging release PR triggers:
   - Version bump in `package.json`
   - Changelog generation
   - Git tag creation
   - GitHub release with notes

### 5.6 Build & Release Pipeline (Future)

```yaml
# .github/workflows/release.yml (future)
# Triggered on version tags (v*)
name: Release

on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm make
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: out/make/**/*
```

---

## Phase 6: Theme System ✅ COMPLETED

**Goal**: Support light/dark themes with system preference detection.

**Status**: Implemented in `src/stores/theme.ts` and `src/styles/variables.css`.

### 6.1 Implementation Summary

- **Theme Store** (`src/stores/theme.ts`): Manages light/dark/system modes
- **CSS Variables** (`src/styles/variables.css`): Light theme via `[data-theme="light"]`
- **System Detection**: Listens to `prefers-color-scheme` media query
- **Persistence**: Theme preference stored in localStorage
- **No Flash**: Theme applied before first render

### 6.2 Files

- `src/stores/theme.ts` - Theme store with `themeMode`, `setThemeMode`, `resolvedTheme`
- `src/styles/variables.css` - CSS custom properties with light/dark variants
- `src/pages/Settings.tsx` - Theme selector in Appearance section

---

## Phase 7: Localization & Accessibility ✅ COMPLETED

**Goal**: Multi-language support and WCAG 2.1 compliance.

**Status**: 
- i18n implemented with `@solid-primitives/i18n`
- Accessibility implemented (WCAG 2.1 Level AA)

### 7.1 Localization Summary

- **Library**: `@solid-primitives/i18n` (SolidJS-native, reactive)
- **Translations**: `src/locales/en.json` (English, ready for more languages)
- **Provider**: `I18nProvider` wraps app in `renderer.tsx`
- **Hook**: `useI18n()` returns `[t, locale, setLocale]`
- **Persistence**: Locale stored in localStorage

### 7.2 Accessibility Summary

- **Tabs**: WAI-ARIA pattern (role=tablist/tab, keyboard navigation)
- **Forms**: Labels associated via htmlFor/id, aria-describedby
- **Navigation**: Skip link, aria-current=page, labeled landmarks
- **Focus**: Visible focus-visible styles on all interactive elements
- **Motion**: `prefers-reduced-motion` disables animations
- **Screen Readers**: aria-live regions, decorative icons hidden

### 7.3 Files

- `src/lib/i18n.tsx` - i18n setup, provider, hook
- `src/locales/en.json` - English translations
- `src/index.css` - prefers-reduced-motion, global focus styles
- `packages/ui/src/components/*` - ARIA attributes, focus styles

---

## Phase 8: Enhanced Room System 🔲 PLANNED

**Goal**: Advanced spatial audio room simulation with multiple rooms, custom shapes, and interactive sound sources.

### 8.1 Overview

Enhance the current room demo (which shows basic wall occlusion) to support:
- Multiple interconnected rooms
- Custom room shapes (beyond rectangles)
- Drag-and-drop sound source placement
- Real-time audio propagation visualization

### 8.2 Multiple Rooms

**Current State**: Single rectangular room with fixed walls.

**Target State**: Multiple rooms with connecting doorways/openings.

```typescript
interface Room {
  id: string;
  name: string;
  shape: RoomShape;
  openings: Opening[];  // Doorways, windows
  color?: string;
}

interface Opening {
  id: string;
  // Line segment defining the opening
  start: Point;
  end: Point;
  // Sound transmission factor (0-1)
  transmission: number;
}
```

**Implementation Approach**:
1. Room list sidebar to add/select rooms
2. Visual room editor canvas
3. Audio engine calculates path through openings
4. Sound attenuates based on walls crossed and opening sizes

### 8.3 Custom Room Shapes (Shape Drawing Tool)

**Inspiration**: Rather than just splitting frames (like Dolby Axon), allow freeform polygon drawing.

**Shape Drawing Modes**:

| Mode | Description | Use Case |
|------|-------------|----------|
| **Rectangle** | Click-drag to draw rectangle | Quick room creation |
| **Polygon** | Click points, double-click to close | L-shaped rooms, complex layouts |
| **Freehand** | Draw path, auto-simplify | Organic shapes |

**Data Structure**:

```typescript
type RoomShape = 
  | { type: "rectangle"; bounds: Rect }
  | { type: "polygon"; points: Point[] }
  | { type: "circle"; center: Point; radius: number };

interface Point { x: number; y: number; }
interface Rect { x: number; y: number; width: number; height: number; }
```

**Shape Editor Features**:
- Draw mode toggle (rectangle/polygon/freehand)
- Point handles for editing vertices
- Snap to grid option
- Undo/redo for shape edits
- Room naming and color assignment

### 8.4 Interactive Sound Sources

**Goal**: Allow users to place, move, and configure multiple sound sources.

**Features**:
- **Add Sound**: Click/tap to place new sound source
- **Move Sound**: Drag to reposition (like current speaker demo)
- **Configure Sound**: Click to select, adjust:
  - Direction (drag cone)
  - Volume/gain
  - Sound file/type
  - Directivity pattern

**Reuse Speaker Component**:
```typescript
// Already have this in @clippis/ui
<Speaker
  position={source.position}
  facing={source.facing}
  gain={source.gain}
  onMoveStart={handleMove}
  onRotateStart={handleRotate}
  onClick={handleSelect}
/>
```

### 8.5 Audio Propagation

**Algorithm Enhancement**:

Current: Simple line-of-sight with single wall intersection.

Enhanced:
1. Cast rays from source to listener
2. For each wall segment:
   - Check if opening exists nearby
   - Calculate path through openings (diffraction)
   - Apply distance + wall attenuation
3. Sum contributions from all paths (multi-path propagation)

```typescript
interface AudioPath {
  source: Point;
  listener: Point;
  segments: PathSegment[];
  totalAttenuation: number;
}

interface PathSegment {
  type: "direct" | "through_wall" | "through_opening";
  distance: number;
  attenuation: number;
}
```

### 8.6 UI Components Needed

1. **RoomEditor** - Canvas for drawing/editing rooms
2. **RoomList** - Sidebar showing all rooms with add/delete
3. **ShapeToolbar** - Drawing mode selector
4. **SoundSourceList** - Manage sound sources
5. **PropertyPanel** - Edit selected room/source properties

### 8.7 Implementation Phases

**Phase 8a: Multi-Room Foundation**
- Add room list data structure
- Render multiple rooms on canvas
- Basic room switching

**Phase 8b: Shape Drawing**
- Rectangle drawing tool
- Polygon drawing tool
- Shape editing (vertex handles)
- Undo/redo

**Phase 8c: Sound Source Management**
- Add/remove sound sources
- Drag to position
- Direction/volume controls

**Phase 8d: Advanced Audio**
- Multi-room audio propagation
- Opening/doorway transmission
- Visual audio path debugging

### 8.8 Technical Considerations

**Performance**:
- Throttle audio recalculation during drag
- Use Web Workers for complex path calculations
- Canvas optimization for many rooms

**Persistence**:
- Save room layouts to localStorage or file
- Export/import room configurations
- Preset room templates

---

## Phase 9: Auth Foundation 🔲 PLANNED

**Goal**: Prepare architecture for auth without implementing yet.

### 9.1 Auth-Ready Architecture

Create placeholder interfaces now:

```typescript
// src/lib/auth/types.ts
export interface User {
  id: string;
  displayName: string;
  avatar?: string;
  locale?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 9.2 Future Options

| Provider        | Pros                              | Cons               |
| --------------- | --------------------------------- | ------------------ |
| **Supabase**    | Free tier, easy setup, real-time  | Vendor lock-in     |
| **Auth0**       | Enterprise features, social login | Paid at scale      |
| **Clerk**       | Great DX, pre-built components    | Newer, less mature |
| **Self-hosted** | Full control                      | More work          |

**Recommendation**: Supabase for MVP (free tier, good Electron support).

---

## Phase 10: Analytics & Telemetry 🔲 PLANNED (LATE)

**Goal**: Understand usage patterns to improve the product (privacy-respecting).

**Important**: This phase is intentionally late - focus on building a great product first.

### 10.1 Privacy-First Principles

- **Opt-in only**: Users must explicitly consent
- **Anonymized**: No PII, no user-identifying data
- **Transparent**: Clear explanation of what's collected
- **Local-first**: Aggregate locally when possible
- **Minimal**: Only collect what's actionable

### 10.2 What to Track

**Usage Metrics** (anonymous):
- Feature usage frequency (which demos, scenarios used)
- Session duration
- Error rates and types
- Performance metrics (audio latency, frame drops)

**Do NOT Track**:
- Conversation content
- User locations
- Personal identifiers
- Microphone/audio content

### 10.3 Implementation Options

| Provider          | Pros                                | Cons                    |
| ----------------- | ----------------------------------- | ----------------------- |
| **PostHog**       | Self-hostable, open source, free tier | Setup complexity      |
| **Plausible**     | Privacy-focused, simple             | Limited features        |
| **Aptabase**      | Built for desktop apps, privacy-first | Newer                 |
| **Custom**        | Full control                        | Build & maintain        |

**Recommendation**: Aptabase for Electron apps, or self-hosted PostHog for full control.

### 10.4 Electron-Specific Considerations

```typescript
// src/lib/analytics.ts (future)
import { analytics } from "@aptabase/electron";

// Initialize only if user consented
export function initAnalytics() {
  const consent = store.get("analyticsConsent");
  if (!consent) return;

  analytics.init("APP_KEY", {
    // Disable in development
    enabled: !import.meta.env.DEV,
  });
}

// Track feature usage
export function trackEvent(name: string, props?: Record<string, unknown>) {
  analytics.trackEvent(name, props);
}
```

### 10.5 Consent UI

Add to Settings page:
- Clear explanation of what's collected
- Toggle to enable/disable
- Link to privacy policy
- Option to view/delete collected data

---

## Scripts to Add

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:ui": "pnpm --filter @clippis/ui test",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui"
  }
}
```

---

## Success Metrics

### Completed ✅

- **Logging**: All errors logged with context, performance metrics for audio operations
- **Error Handling**: Zero unhandled exceptions in production, user-facing error messages
- **UI Library**: Comprehensive unit tests, Storybook docs for all components
- **E2E**: Test suites covering critical user flows
- **Themes**: Light/dark/system modes, system preference sync, no flash on load
- **Localization**: Type-safe translations with `@solid-primitives/i18n`, English complete
- **Accessibility**: WCAG 2.1 Level AA, keyboard navigation, screen reader support

### Planned 🔲

- **CI/CD**: All PRs pass quality gates, automated releases
- **Versioning**: Semantic versions, automated changelog, conventional commits
- **Room System**: Multiple rooms, custom shapes, interactive sound sources
- **Auth**: (Future) Login flow, session persistence
- **Analytics**: (Future) Privacy-first, opt-in, actionable insights
