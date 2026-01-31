# Components

This directory contains all React-like SolidJS components organized by domain.

## Directory Structure

```
components/
├── ui/         # Generic, reusable UI components
├── audio/      # Spatial audio visualization components
└── layout/     # App shell and navigation
```

---

## UI Components (`ui/`)

Reusable interface elements with consistent styling via CSS Modules.

### Button

Primary action button with multiple variants.

```tsx
import { Button } from "./components/ui";

<Button variant="primary" icon="➕" onClick={handleClick}>
  Add Item
</Button>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `"primary" \| "success" \| "purple" \| "danger" \| "outline"` | `"primary"` | Visual style |
| `icon` | `string` | — | Emoji or icon prefix |
| `disabled` | `boolean` | `false` | Disable interactions |

---

### Slider

Range input with optional label and value display.

```tsx
import { Slider } from "./components/ui";

<Slider
  label="Volume"
  min={0}
  max={1}
  step={0.01}
  value={volume()}
  onInput={handleChange}
  showValue
/>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Label text |
| `showValue` | `boolean` | `false` | Show formatted value |
| `formatValue` | `(n: number) => string` | `n => n * 100 + "%"` | Custom formatter |

---

### Section

Card-style container with a title, used for grouping content.

```tsx
import { Section } from "./components/ui";

<Section title="Audio Devices">
  {/* content */}
</Section>
```

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Section heading |
| `children` | `JSX.Element` | Section content |

---

### SelectField

Dropdown select with label and options.

```tsx
import { SelectField } from "./components/ui";

<SelectField
  label="Input Device"
  options={[{ value: "default", label: "Default Mic" }]}
  placeholder="Select..."
  value={selected()}
  onChange={handleChange}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Field label |
| `options` | `{ value: string, label: string }[]` | Dropdown options |
| `placeholder` | `string` | Empty state text |

---

### Toggle

Checkbox with title and description, for boolean settings.

```tsx
import { Toggle } from "./components/ui";

<Toggle
  label="Spatial Audio"
  description="Enable 3D positional audio effects"
  checked={enabled()}
  onChange={handleToggle}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `label` | `string` | Toggle title |
| `description` | `string` | Explanatory text below label |
| `checked` | `boolean` | Current state |

---

## Audio Components (`audio/`)

Components for the spatial audio visualization.

### DemoRoom

Main spatial audio demonstration interface. Contains the 2D room, controls, and status bar.

```tsx
import { DemoRoom } from "./components/audio";

<DemoRoom />
```

Uses `audioStore` internally for state management. No props required.

**Features:**
- Click room to move listener position
- Add/remove sound sources
- Play demo sequences
- Test cardinal directions
- Volume control

---

### Listener

The "you are here" indicator in the audio room.

```tsx
import { Listener } from "./components/audio";

<Listener position={{ x: 0, y: 0 }} />
```

| Prop | Type | Description |
|------|------|-------------|
| `position` | `{ x: number, y: number }` | Position in room coordinates |

---

### SoundSource

A draggable numbered circle representing a sound source in the room.

```tsx
import { SoundSource } from "./components/audio";

<SoundSource
  sound={{ id: "1", position: { x: 1, y: -1 }, frequency: 440 }}
  index={0}
  getPositionFromEvent={(e) => convertToRoomCoords(e)}
  onPositionChange={(pos) => updatePosition(pos)}
  onDragEnd={() => playSound()}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `sound` | `SoundSource` | Sound source data |
| `index` | `number` | Display number (0-indexed) |
| `getPositionFromEvent` | `(e: MouseEvent) => Position` | Converts mouse event to room coordinates |
| `onPositionChange` | `(pos: Position) => void` | Called during drag with new position |
| `onDragEnd` | `() => void` | Called when drag completes |

---

## Layout Components (`layout/`)

App-level structure and navigation.

### Shell

Main app layout with sidebar and content area.

```tsx
import { Shell } from "./components/layout";

<Router root={Shell}>
  {/* routes */}
</Router>
```

Used as the router root. Renders `<Sidebar />` and `<main>` content area.

---

### Sidebar

Navigation sidebar with route links and audio status.

```tsx
import { Sidebar } from "./components/layout";

<Sidebar />
```

No props — reads routes from internal config and audio state from `audioStore`.

**Routes:**
- `/` — Demo Room
- `/voice` — Voice Room
- `/settings` — Settings
