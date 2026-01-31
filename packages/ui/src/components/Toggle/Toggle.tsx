/**
 * Toggle.tsx - Accessible checkbox with label and description
 *
 * Used for boolean settings like "Enable Spatial Audio".
 * Description is linked via aria-describedby for screen readers.
 *
 * @example
 * <Toggle
 *   label="Noise Suppression"
 *   description="Reduce background noise from microphone"
 *   checked={enabled()}
 *   onChange={handleChange}
 * />
 */
import { JSX, splitProps, createUniqueId } from "solid-js";
import styles from "./Toggle.module.css";

interface ToggleProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Main label text */
  label: string;
  /** Optional description shown below the label */
  description?: string;
}

export function Toggle(props: ToggleProps) {
  const [local, others] = splitProps(props, ["label", "description", "id"]);
  const generatedId = createUniqueId();
  const inputId = () => local.id ?? `toggle-${generatedId}`;
  const descId = () => `${inputId()}-desc`;

  return (
    <label class={styles.toggle} for={inputId()}>
      <input
        id={inputId()}
        type="checkbox"
        class={styles.input}
        aria-describedby={local.description ? descId() : undefined}
        {...others}
      />
      <span class={styles.text}>
        <strong class={styles.label}>{local.label}</strong>
        {local.description && (
          <span id={descId()} class={styles.description}>
            {local.description}
          </span>
        )}
      </span>
    </label>
  );
}
