/**
 * toast.ts - Toast notification store
 *
 * Manages a queue of toast notifications. Supports:
 * - Multiple toast types (success, error, warning, info)
 * - Auto-dismiss after configurable duration
 * - Manual dismiss
 * - Stacking multiple toasts
 *
 * Usage:
 *   import { showToast, dismissToast } from "@/stores/toast";
 *   showToast({ type: "success", message: "Saved!" });
 *   showToast({ type: "error", message: "Failed", duration: 5000 });
 */
import { createSignal, createRoot } from "solid-js";
import type { Toast, ToastType, ToastOptions } from "@clippis/types";

export type { Toast, ToastType, ToastOptions };

const DEFAULT_DURATION = 4000;

function createToastStore() {
  const [toasts, setToasts] = createSignal<Toast[]>([]);

  let idCounter = 0;

  /**
   * Show a new toast notification
   */
  const showToast = (options: ToastOptions): string => {
    const id = `toast-${++idCounter}`;
    const duration = options.duration ?? DEFAULT_DURATION;

    const toast: Toast = {
      id,
      type: options.type,
      message: options.message,
      duration,
    };

    setToasts((prev) => [...prev, toast]);

    // Auto-dismiss if duration > 0
    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  };

  /**
   * Dismiss a specific toast by ID
   */
  const dismissToast = (id: string): void => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  /**
   * Dismiss all toasts
   */
  const dismissAll = (): void => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    dismissToast,
    dismissAll,
  };
}

// Create singleton store
const store = createRoot(createToastStore);

export const toasts = store.toasts;
export const showToast = store.showToast;
export const dismissToast = store.dismissToast;
export const dismissAll = store.dismissAll;
