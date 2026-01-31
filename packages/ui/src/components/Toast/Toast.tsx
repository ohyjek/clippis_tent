/**
 * Toast.tsx - Toast notification component
 *
 * Pure UI component for displaying toast notifications.
 * Receives toasts array as a prop - state management is handled externally.
 *
 * @example
 * <ToastContainer toasts={toasts()} onDismiss={dismissToast} />
 */
import { For } from "solid-js";
import type { ToastType, ToastData } from "@clippis/types";
import styles from "./Toast.module.css";

export type { ToastType, ToastData };

interface ToastContainerProps {
  /** Array of toast notifications to display */
  toasts: ToastData[];
  /** Called when dismiss button is clicked */
  onDismiss: (id: string) => void;
}

/** Icon mapping for toast types */
const TOAST_ICONS: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  warning: "⚠",
  info: "ℹ",
};

/**
 * Individual toast notification
 */
function ToastItem(props: { toast: ToastData; onDismiss: (id: string) => void }) {
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
        onClick={() => props.onDismiss(props.toast.id)}
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
export function ToastContainer(props: ToastContainerProps) {
  return (
    <div class={styles.container} aria-live="polite">
      <For each={props.toasts}>
        {(toast) => <ToastItem toast={toast} onDismiss={props.onDismiss} />}
      </For>
    </div>
  );
}
