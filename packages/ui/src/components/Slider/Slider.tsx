/**
 * Slider.tsx - Accessible range input with label and value display
 *
 * Wraps a native range input with:
 * - Proper label association via htmlFor/id
 * - aria-valuetext for screen reader value announcements
 * - Visible focus states
 *
 * @example
 * <Slider id="volume" label="Volume" min={0} max={1} step={0.01} value={0.5} showValue />
 */
import { JSX, splitProps, createUniqueId } from "solid-js";
import styles from "./Slider.module.css";

interface SliderProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Label text shown before the slider */
  label?: string;
  /** Whether to display the current value */
  showValue?: boolean;
  /** Custom formatter for the displayed value (default: percentage) */
  formatValue?: (value: number) => string;
}

export function Slider(props: SliderProps) {
  const [local, others] = splitProps(props, ["label", "showValue", "formatValue", "class", "id"]);
  const generatedId = createUniqueId();
  const inputId = () => local.id ?? `slider-${generatedId}`;

  const displayValue = () => {
    const val = Number(props.value ?? 0);
    return local.formatValue ? local.formatValue(val) : `${Math.round(val * 100)}%`;
  };

  return (
    <div class={`${styles.container} ${local.class || ""}`}>
      {local.label && (
        <label for={inputId()} class={styles.label}>
          {local.label}
        </label>
      )}
      <input
        id={inputId()}
        type="range"
        class={styles.slider}
        aria-valuetext={displayValue()}
        {...others}
      />
      {local.showValue && (
        <span class={styles.value} aria-hidden="true">
          {displayValue()}
        </span>
      )}
    </div>
  );
}
