/**
 * Toggle.tsx - Checkbox with label and optional description
 *
 * Used for boolean settings like "Enable Spatial Audio".
 * Shows a title and smaller description text below it.
 *
 * @example
 * <Toggle
 *   label="Noise Suppression"
 *   description="Reduce background noise from microphone"
 *   checked={enabled()}
 *   onChange={handleChange}
 * />
 */
import { JSX, splitProps } from "solid-js";
import styles from "./Toggle.module.css";

interface ToggleProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Main label text */
  label: string;
  /** Optional description shown below the label */
  description?: string;
}

export function Toggle(props: ToggleProps) {
  const [local, others] = splitProps(props, ["label", "description"]);

  return (
    <label class={styles.toggle}>
      <input type="checkbox" class={styles.input} {...others} />
      <span class={styles.text}>
        <strong class={styles.label}>{local.label}</strong>
        {local.description && (
          <span class={styles.description}>{local.description}</span>
        )}
      </span>
    </label>
  );
}
