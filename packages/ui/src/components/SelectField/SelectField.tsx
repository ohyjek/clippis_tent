/**
 * SelectField.tsx - Accessible labeled dropdown select
 *
 * Renders a <select> element with proper label association.
 * Used for choosing audio devices, presets, etc.
 *
 * @example
 * <SelectField
 *   label="Output Device"
 *   options={[{ value: "default", label: "Speakers" }]}
 *   placeholder="Select..."
 * />
 */
import { JSX, For, splitProps, createUniqueId } from "solid-js";
import styles from "./SelectField.module.css";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps extends Omit<JSX.SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  /** Label text shown above the select */
  label: string;
  /** Array of options to display */
  options: SelectOption[];
  /** Optional placeholder shown as first disabled option */
  placeholder?: string;
}

export function SelectField(props: SelectFieldProps) {
  const [local, others] = splitProps(props, ["label", "options", "placeholder", "id"]);
  const generatedId = createUniqueId();
  const selectId = () => local.id ?? `select-${generatedId}`;

  return (
    <div class={styles.field}>
      <label for={selectId()} class={styles.label}>
        {local.label}
      </label>
      <select id={selectId()} class={styles.select} {...others}>
        {local.placeholder && <option value="">{local.placeholder}</option>}
        <For each={local.options}>
          {(option) => <option value={option.value}>{option.label}</option>}
        </For>
      </select>
    </div>
  );
}
