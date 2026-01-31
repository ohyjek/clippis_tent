import { JSX, splitProps } from "solid-js";
import styles from "./Slider.module.css";

interface SliderProps extends Omit<JSX.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  showValue?: boolean;
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
