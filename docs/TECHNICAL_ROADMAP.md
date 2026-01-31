# Technical Roadmap

A phased technical roadmap covering infrastructure (logging, error handling, testing), user experience (themes, localization), and future features (auth) - prioritized for a team of up to 5 developers.

This roadmap is organized into phases that can be worked on incrementally. Each phase builds on the previous.

**Status Overview**:
- ✅ Phase 1-4: Infrastructure complete (logging, errors, UI library, testing)
- 🔲 Phase 5: CI/CD pipeline planned
- 🔲 Phase 6-7: UX enhancements planned (themes, i18n)
- 🔲 Phase 8: Auth foundation planned

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

**Status**: Implemented with `@clippis/ui` package containing 8 components (Button, Section, SelectField, Slider, Tabs, Toggle, ErrorBoundary, Toast).

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
- Unit tests: 129 tests (67 spatial-audio + 62 UI components)
- Storybook: Configured with stories for all 8 UI components
- E2E tests: Playwright setup with 4 test suites (navigation, scenarios, settings, tent)

### Testing Pyramid

```
        ╱╲
       ╱  ╲  E2E (Playwright)
      ╱────╲  - Critical user flows
     ╱      ╲ - 5-10 tests
    ╱────────╲
   ╱          ╲  Integration
  ╱────────────╲ - Component + store interactions
 ╱              ╲ - 20-30 tests
╱────────────────╲
       Unit        - Pure functions, components
       100+ tests  - Fast, isolated
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

## Phase 5: CI/CD Pipeline 🔲 PLANNED

**Goal**: Automated quality gates and deployment pipeline.

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

### 5.5 Build & Release Pipeline (Future)

```yaml
# .github/workflows/release.yml (future)
# Triggered on version tags
# - Build Electron app for Windows/Mac/Linux
# - Create GitHub release with artifacts
# - Upload to distribution channels
```

---

## Phase 6: Theme System 🔲 PLANNED

**Goal**: Support light/dark themes and custom color schemes.

### 5.1 Theme Architecture

```typescript
// src/lib/theme/types.ts
export type ThemeMode = "light" | "dark" | "system";

export interface Theme {
  mode: ThemeMode;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    bgTertiary: string;
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    border: string;
    accentBlue: string;
    accentGreen: string;
    accentPurple: string;
    accentRed: string;
  };
}
```

### 5.2 Implementation Plan

1. **CSS Custom Properties** (already using)
   - Extend `src/styles/variables.css` with light/dark variants
   - Use `[data-theme="dark"]` / `[data-theme="light"]` selectors

2. **Theme Store**
   ```typescript
   // src/stores/theme.ts
   const [theme, setTheme] = createSignal<ThemeMode>("system");
   
   createEffect(() => {
     const resolved = theme() === "system" 
       ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
       : theme();
     document.documentElement.dataset.theme = resolved;
   });
   ```

3. **System Preference Detection**
   - Listen to `prefers-color-scheme` media query
   - Sync with OS theme when set to "system"

4. **Persistence**
   - Store preference in `electron-store` or localStorage
   - Apply before first render to prevent flash

### 5.3 UI Updates

- Add theme toggle to Settings page
- Update all CSS modules to use theme-aware variables
- Ensure sufficient contrast in both modes

---

## Phase 7: Localization (i18n) 🔲 PLANNED

**Goal**: Support multiple languages for global accessibility.

### 6.1 Library Options

| Library              | Pros                                   | Cons                    |
| -------------------- | -------------------------------------- | ----------------------- |
| **@solid-primitives/i18n** | SolidJS native, reactive, lightweight | Less ecosystem          |
| **i18next**          | Mature, huge ecosystem, pluralization  | Heavier, React-focused  |
| **Paraglide**        | Compile-time, type-safe, tiny runtime  | Newer                   |

**Recommendation**: `@solid-primitives/i18n` for SolidJS-native reactivity, or Paraglide for type-safety.

### 6.2 Translation Structure

```
src/
├── locales/
│   ├── en.json          # English (default)
│   ├── es.json          # Spanish
│   ├── ja.json          # Japanese
│   └── index.ts         # Loader and types
└── lib/
    └── i18n.ts          # i18n setup and hooks
```

### 6.3 Translation File Format

```json
// src/locales/en.json
{
  "nav": {
    "tent": "The Tent",
    "scenarios": "Scenarios",
    "voiceRoom": "Voice Room",
    "settings": "Settings"
  },
  "settings": {
    "title": "Settings",
    "audioDevices": "Audio Devices",
    "outputDevice": "Output Device",
    "inputDevice": "Input Device",
    "audioProcessing": "Audio Processing",
    "spatialAudio": "Spatial Audio",
    "noiseSuppression": "Noise Suppression"
  },
  "common": {
    "play": "Play",
    "stop": "Stop",
    "save": "Save",
    "cancel": "Cancel"
  }
}
```

### 6.4 Usage Pattern

```typescript
// With @solid-primitives/i18n
import { useI18n } from "@/lib/i18n";

function Settings() {
  const [t] = useI18n();
  
  return (
    <Section title={t("settings.audioDevices")}>
      <SelectField label={t("settings.outputDevice")} ... />
    </Section>
  );
}
```

### 6.5 Implementation Steps

1. Install i18n library
2. Create translation files for English (extract all strings)
3. Add language selector to Settings
4. Persist language preference
5. Add additional languages incrementally

---

## Phase 8: Auth Foundation 🔲 PLANNED

**Goal**: Prepare architecture for auth without implementing yet.

### 7.1 Auth-Ready Architecture

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

### 7.2 Future Options

| Provider        | Pros                              | Cons               |
| --------------- | --------------------------------- | ------------------ |
| **Supabase**    | Free tier, easy setup, real-time  | Vendor lock-in     |
| **Auth0**       | Enterprise features, social login | Paid at scale      |
| **Clerk**       | Great DX, pre-built components    | Newer, less mature |
| **Self-hosted** | Full control                      | More work          |

**Recommendation**: Supabase for MVP (free tier, good Electron support).

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

- **Logging**: All errors logged with context, performance metrics for audio operations
- **Error Handling**: Zero unhandled exceptions in production, user-facing error messages
- **UI Library**: 80%+ test coverage, Storybook docs for all components
- **E2E**: Critical paths covered, < 2min total runtime
- **CI/CD**: All PRs pass quality gates, automated releases
- **Themes**: Light/dark modes, system preference sync, no flash on load
- **Localization**: Type-safe translations, 2+ languages, persisted preference
- **Auth**: (Future) Login flow, session persistence
