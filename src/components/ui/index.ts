/**
 * ui/index.ts - UI component exports
 *
 * Re-exports UI components from @tentchat/ui and app-specific wrappers.
 * Most components come directly from the UI library, while ErrorBoundary
 * and ToastContainer have app-specific wrappers that add logging.
 *
 * Usage: import { Button, Slider } from "@/components/ui"
 */

// Pure UI components from @tentchat/ui
export {
  Button,
  ButtonRow,
  type ButtonVariant,
  ColorSwatches,
  type ColorSwatchesProps,
  DropdownField,
  FieldGroup,
  InputField,
  ItemList,
  type ItemListProps,
  Panel,
  type PanelProps,
  Section,
  SelectField,
  type SelectOption,
  Slider,
  SliderField,
  Speaker,
  type SpeakerProps,
  Toggle,
} from "@tentchat/ui";

// App-specific wrappers (with logging integration)
export { ErrorBoundary } from "./ErrorBoundary";
export { ToastContainer } from "./Toast";
