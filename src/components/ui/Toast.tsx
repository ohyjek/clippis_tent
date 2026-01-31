/**
 * Toast.tsx - Toast notification component
 *
 * Displays toast notifications from the toast store.
 * Supports success, error, warning, and info variants.
 *
 * Usage:
 *   // Add ToastContainer once at the app root
 *   <ToastContainer />
 *
 *   // Then use showToast anywhere
 *   showToast({ type: "success", message: "Saved!" });
 */
import { For } from "solid-js";
import { toasts, dismissToast, type Toast as ToastData } from "@/stores/toast";
import styles from "./Toast.module.css";

/** Icon mapping for toast types */
const TOAST_ICONS: Record<ToastData["type"], string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

/**
 * Individual toast notification
 */
function ToastItem(props: { toast: ToastData }) {
  return (
    <div
      class={styles.toast}
      classList={{ [styles[props.toast.type]]: true }}
      role="alert"
    >
      <span class={styles.icon}>{TOAST_ICONS[props.toast.type]}</span>
      <span class={styles.message}>{props.toast.message}</span>
      <button
        class={styles.dismiss}
        onClick={() => dismissToast(props.toast.id)}
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

/**
 * Container for all toast notifications.
 * Place this once at the app root level.
 */
export function ToastContainer() {
  return (
    <div class={styles.container} aria-live="polite">
      <For each={toasts()}>{(toast) => <ToastItem toast={toast} />}</For>
    </div>
  );
}
