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
import { Button } from "@/components/ui";

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
import { Slider } from "@/components/ui";

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
import { Section } from "@/components/ui";

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
import { SelectField } from "@/components/ui";

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

### Tabs

Horizontal tab navigation for switching views.

```tsx
import { Tabs } from "@/components/ui";

<Tabs
  tabs={[
    { id: "a", label: "Tab A", icon: "🎧" },
    { id: "b", label: "Tab B" },
  ]}
  activeTab={activeTab()}
  onTabChange={setActiveTab}
/>
```

| Prop | Type | Description |
|------|------|-------------|
| `tabs` | `{ id: string, label: string, icon?: string }[]` | Tab definitions |
| `activeTab` | `string` | Currently active tab ID |
| `onTabChange` | `(id: string) => void` | Called when tab is clicked |

---

### Toggle

Checkbox with title and description, for boolean settings.

```tsx
import { Toggle } from "@/components/ui";

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

Components for the spatial audio visualization. The Tent page uses tabs to switch between these demos.

### TentRoom

Listener demo — shows how distance and panning affect what you hear.

```tsx
import { TentRoom } from "@/components/audio";

<TentRoom />
```

Uses `audioStore` internally for state management. No props required.

**Features:**
- Click room to move listener position
- Drag sound sources to reposition
- Add/remove sound sources
- Play demo sequences
- Test cardinal directions
- Volume control

---

### SpeakerDemo

Speaking direction demo — shows how a speaker's facing direction affects volume.

```tsx
import { SpeakerDemo } from "@/components/audio";

<SpeakerDemo />
```

**Features:**
- Multiple speakers with directional arrows
- Click anywhere to face selected speaker toward that point
- Cardioid audio pattern (louder when facing listener)
- Gain indicator bars showing effective volume
- Draggable listener position

---

### RoomDemo

Room boundaries demo — shows how walls attenuate sound between rooms.

```tsx
import { RoomDemo } from "@/components/audio";

<RoomDemo />
```

**Features:**
- Two adjacent rooms with visible walls
- Sound path visualization
- Wall crossing count and attenuation display
- Draggable speaker and listener
- 70% volume reduction per wall crossed

---

### Listener

The "you are here" indicator in the audio room.

```tsx
import { Listener } from "@/components/audio";

<Listener position={{ x: 0, y: 0 }} />
```

| Prop | Type | Description |
|------|------|-------------|
| `position` | `{ x: number, y: number }` | Position in room coordinates |

---

### SoundSource

A draggable numbered circle representing a sound source in the room.

```tsx
import { SoundSource } from "@/components/audio";

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

### App

Main app layout with sidebar and content area.

```tsx
import { App } from "@/components/layout";

<Router root={App}>
  {/* routes */}
</Router>
```

Used as the router root. Renders `<Sidebar />` and `<main>` content area.

---

### Sidebar

Navigation sidebar with route links and audio status.

```tsx
import { Sidebar } from "@/components/layout";

<Sidebar />
```

No props — reads routes from internal config and audio state from `audioStore`.

**Routes:**
- `/` — The Tent
- `/voice` — Voice Room
- `/settings` — Settings
