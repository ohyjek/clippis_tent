/**
 * Toast.tsx - App-level Toast wrapper
 *
 * Connects the @clippis/ui ToastContainer to the app's toast store.
 * Re-exports everything from the UI library for convenience.
 */
import { ToastContainer as UIToastContainer } from "@clippis/ui";
import { toasts, dismissToast } from "@stores/toast";

// Re-export the type from the UI library
export type { ToastData, ToastType } from "@clippis/ui";

/**
 * App-specific ToastContainer that connects to the toast store.
 */
export function ToastContainer() {
  return <UIToastContainer toasts={toasts()} onDismiss={dismissToast} />;
}
