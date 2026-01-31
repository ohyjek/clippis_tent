/**
 * ui/index.ts - UI component exports
 *
 * Re-exports UI components from @clippis/ui and app-specific wrappers.
 * Most components come directly from the UI library, while ErrorBoundary
 * and ToastContainer have app-specific wrappers that add logging.
 *
 * Usage: import { Button, Slider, Tabs } from "@/components/ui"
 */

// Pure UI components from @clippis/ui
export {
  Button,
  type ButtonVariant,
  ColorSwatches,
  type ColorSwatchesProps,
  ItemList,
  type ItemListItem,
  type ItemListProps,
  Panel,
  type PanelProps,
  Section,
  SelectField,
  type SelectOption,
  Slider,
  Speaker,
  type SpeakerProps,
  type SpeakerPosition,
  Tabs,
  type Tab,
  Toggle,
} from "@clippis/ui";

// App-specific wrappers (with logging integration)
export { ErrorBoundary } from "./ErrorBoundary";
export { ToastContainer } from "./Toast";
