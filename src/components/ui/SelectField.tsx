import { JSX, For, splitProps } from "solid-js";
import styles from "./SelectField.module.css";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label: string;
  options: SelectOption[];
  placeholder?: string;
}

export function SelectField(props: SelectFieldProps) {
  const [local, others] = splitProps(props, ["label", "options", "placeholder"]);

  return (
    <div class={styles.field}>
      <label class={styles.label}>{local.label}</label>
      <select class={styles.select} {...others}>
        {local.placeholder && <option value="">{local.placeholder}</option>}
        <For each={local.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
    </div>
  );
}
