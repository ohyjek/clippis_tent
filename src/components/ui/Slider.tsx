/**
 * Slider.tsx - Range input with optional label and value display
 *
 * Wraps a native range input with consistent styling.
 * Can show the current value formatted as percentage or custom format.
 *
 * @example
 * <Slider label="Volume" min={0} max={1} step={0.01} value={0.5} showValue />
 */
import { JSX, splitProps } from "solid-js";
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
  const [local, others] = splitProps(props, ["label", "showValue", "formatValue", "class"]);
  
  const displayValue = () => {
    const val = Number(props.value ?? 0);
    return local.formatValue ? local.formatValue(val) : `${Math.round(val * 100)}%`;
  };

  return (
    <div class={`${styles.container} ${local.class || ""}`}>
      {local.label && <span class={styles.label}>{local.label}</span>}
      <input
        type="range"
        class={styles.slider}
        {...others}
      />
      {local.showValue && <span class={styles.value}>{displayValue()}</span>}
    </div>
  );
}
