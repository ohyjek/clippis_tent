import { JSX, splitProps } from "solid-js";
import styles from "./Toggle.module.css";

interface ToggleProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
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
