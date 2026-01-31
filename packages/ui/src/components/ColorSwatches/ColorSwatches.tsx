/**
 * ColorSwatches.tsx - Color picker grid with selection state
 *
 * Displays a row of clickable color swatches. Commonly used for
 * selecting colors in property panels.
 *
 * @example
 * <ColorSwatches
 *   colors={["#ef4444", "#3b82f6", "#10b981"]}
 *   selected="#3b82f6"
 *   onSelect={(color) => setColor(color)}
 * />
 */
import { For } from "solid-js";
import styles from "./ColorSwatches.module.css";

export interface ColorSwatchesProps {
  /** Array of color hex values to display */
  colors: readonly string[];
  /** Currently selected color (will show border) */
  selected?: string;
  /** Callback when a color is clicked */
  onSelect: (color: string) => void;
  /** Optional size variant */
  size?: "sm" | "md" | "lg";
  /** Optional aria-label for the container */
  label?: string;
}

export function ColorSwatches(props: ColorSwatchesProps) {
  const sizeClass = () => {
    switch (props.size) {
      case "sm":
        return styles.small;
      case "lg":
        return styles.large;
      default:
        return "";
    }
  };

  return (
    <div
      class={`${styles.swatches} ${sizeClass()}`}
      role="radiogroup"
      aria-label={props.label ?? "Color selection"}
    >
      <For each={props.colors}>
        {(color) => (
          <button
            type="button"
            class={`${styles.swatch} ${props.selected === color ? styles.selected : ""}`}
            style={{ background: color }}
            onClick={() => props.onSelect(color)}
            role="radio"
            aria-checked={props.selected === color}
            aria-label={color}
          />
        )}
      </For>
    </div>
  );
}
