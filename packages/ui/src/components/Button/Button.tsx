/**
 * Button.tsx - Reusable button component with style variants
 *
 * Variants: primary (blue), success (green), purple, danger (red), outline
 * Supports optional emoji/icon prefix via the `icon` prop.
 *
 * @example
 * <Button variant="success" icon="🔊" onClick={play}>Play</Button>
 */
import { JSX, splitProps } from "solid-js";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "success" | "purple" | "danger" | "outline";

interface ButtonProps extends JSX.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style variant */
  variant?: ButtonVariant;
  /** Optional emoji or icon to show before the label */
  icon?: string;
}

export function Button(props: ButtonProps) {
  const [local, others] = splitProps(props, ["variant", "icon", "children", "class"]);
  
  const variantClass = () => {
    switch (local.variant) {
      case "success": return styles.success;
      case "purple": return styles.purple;
      case "danger": return styles.danger;
      case "outline": return styles.outline;
      default: return styles.primary;
    }
  };

  return (
    <button
      class={`${styles.btn} ${variantClass()} ${local.class || ""}`}
      {...others}
    >
      {local.icon && <span class={styles.icon}>{local.icon}</span>}
      {local.children}
    </button>
  );
}
