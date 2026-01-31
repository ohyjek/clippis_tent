# Technical Roadmap

A phased technical roadmap covering logging/monitoring, UI library extraction with full test coverage, error handling, and future auth - prioritized for a team of up to 5 developers.

This roadmap is organized into phases that can be worked on incrementally. Each phase builds on the previous.

---

## Phase 1: Logging and Monitoring Foundation

**Goal**: Establish structured logging before adding more complexity.

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

## Phase 2: Error Handling and Resilience

**Goal**: Graceful error handling with user feedback.

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

## Phase 3: UI Library Extraction (pnpm Workspace)

**Goal**: Decouple UI components with their own test suite.

### 3.1 Workspace Structure

```
clippis_tent/
├── pnpm-workspace.yaml
├── packages/
│   └── ui/                      # UI Library
│       ├── package.json
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       ├── src/
│       │   ├── components/
│       │   │   ├── Button/
│       │   │   │   ├── Button.tsx
│       │   │   │   ├── Button.module.css
│       │   │   │   ├── Button.test.tsx
│       │   │   │   └── Button.stories.tsx  # Later
│       │   │   └── ...
│       │   ├── hooks/           # Shared hooks
│       │   ├── utils/           # UI utilities
│       │   └── index.ts         # Public API
│       └── mocks/               # Test mocks and fixtures
└── apps/
    └── desktop/                 # Current app (moved)
        └── ...
```

### 3.2 pnpm Workspace Config

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - "packages/*"
  - "apps/*"
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

## Phase 4: Comprehensive Testing Strategy

**Goal**: Layered testing for confidence in agent-assisted development.

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

## Phase 5: Auth Foundation (Later)

**Goal**: Prepare architecture for auth without implementing yet.

### 5.1 Auth-Ready Architecture

Create placeholder interfaces now:

```typescript
// src/lib/auth/types.ts
export interface User {
  id: string;
  displayName: string;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
```

### 5.2 Future Options

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
- **Auth**: (Future) Login flow, session persistence
