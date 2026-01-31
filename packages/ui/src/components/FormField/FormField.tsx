/**
 * FormField.tsx - Reusable form field components
 *
 * Provides consistent styling for form inputs across the app.
 * Includes label, input/select, and optional hint text.
 */
import { JSX, splitProps, Show } from "solid-js";
import styles from "./FormField.module.css";

/** Common props for all field types */
interface BaseFieldProps {
  /** Field label */
  label: string;
  /** Optional hint text displayed below the input */
  hint?: string;
  /** Additional class name */
  class?: string;
}

/** Props for text/number input fields */
interface InputFieldProps extends BaseFieldProps {
  type?: "text" | "number";
  value: string | number;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
}

/** Props for select fields */
interface SelectFieldProps extends BaseFieldProps {
  value: string;
  onChange: JSX.EventHandler<HTMLSelectElement, Event>;
  children: JSX.Element;
  disabled?: boolean;
}

/** Props for slider fields with min/max/value labels */
interface SliderFieldProps extends BaseFieldProps {
  value: number;
  onInput: JSX.EventHandler<HTMLInputElement, InputEvent>;
  min: number;
  max: number;
  step?: number;
  /** Label for minimum value */
  minLabel?: string;
  /** Label for maximum value */
  maxLabel?: string;
  /** Format function for the current value display */
  formatValue?: (value: number) => string;
  disabled?: boolean;
}

/**
 * InputField - Text or number input with label and hint
 */
export function InputField(props: InputFieldProps) {
  const [local, others] = splitProps(props, ["label", "hint", "class", "type", "value", "onInput"]);

  return (
    <div class={`${styles.fieldGroup} ${local.class || ""}`}>
      <label class={styles.label}>{local.label}</label>
      <input
        type={local.type || "text"}
        class={styles.input}
        value={local.value}
        onInput={local.onInput}
        {...others}
      />
      <Show when={local.hint}>
        <small class={styles.hint}>{local.hint}</small>
      </Show>
    </div>
  );
}

/**
 * DropdownField - Dropdown select with label and hint
 * (Named to avoid conflict with existing SelectField component)
 */
export function DropdownField(props: SelectFieldProps) {
  const [local, others] = splitProps(props, [
    "label",
    "hint",
    "class",
    "value",
    "onChange",
    "children",
  ]);

  return (
    <div class={`${styles.fieldGroup} ${local.class || ""}`}>
      <label class={styles.label}>{local.label}</label>
      <select class={styles.select} value={local.value} onChange={local.onChange} {...others}>
        {local.children}
      </select>
      <Show when={local.hint}>
        <small class={styles.hint}>{local.hint}</small>
      </Show>
    </div>
  );
}

/**
 * SliderField - Range slider with label, value display, and min/max labels
 */
export function SliderField(props: SliderFieldProps) {
  const [local, others] = splitProps(props, [
    "label",
    "hint",
    "class",
    "value",
    "onInput",
    "min",
    "max",
    "step",
    "minLabel",
    "maxLabel",
    "formatValue",
  ]);

  const displayValue = () =>
    local.formatValue ? local.formatValue(local.value) : String(local.value);

  return (
    <div class={`${styles.fieldGroup} ${local.class || ""}`}>
      <label class={styles.label}>{local.label}</label>
      <input
        type="range"
        class={styles.slider}
        value={local.value}
        onInput={local.onInput}
        min={local.min}
        max={local.max}
        step={local.step ?? 0.01}
        {...others}
      />
      <div class={styles.sliderLabels}>
        <span>{local.minLabel ?? local.min}</span>
        <span class={styles.currentValue}>{displayValue()}</span>
        <span>{local.maxLabel ?? local.max}</span>
      </div>
      <Show when={local.hint}>
        <small class={styles.hint}>{local.hint}</small>
      </Show>
    </div>
  );
}

/**
 * FieldGroup - Generic wrapper for custom field content
 */
export function FieldGroup(props: {
  label: string;
  hint?: string;
  class?: string;
  children: JSX.Element;
}) {
  return (
    <div class={`${styles.fieldGroup} ${props.class || ""}`}>
      <label class={styles.label}>{props.label}</label>
      {props.children}
      <Show when={props.hint}>
        <small class={styles.hint}>{props.hint}</small>
      </Show>
    </div>
  );
}

/**
 * ButtonRow - Horizontal row of buttons
 */
export function ButtonRow(props: { class?: string; children: JSX.Element }) {
  return <div class={`${styles.buttonRow} ${props.class || ""}`}>{props.children}</div>;
}
