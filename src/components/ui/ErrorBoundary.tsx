/**
 * ErrorBoundary.tsx - Catches and displays component errors
 *
 * Wraps child components to catch JavaScript errors and display
 * a fallback UI instead of crashing the entire app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomeComponent />
 *   </ErrorBoundary>
 */
import { ErrorBoundary as SolidErrorBoundary, JSX } from "solid-js";
import { logger } from "@/lib/logger";
import { Button } from "./Button";
import styles from "./ErrorBoundary.module.css";

interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: JSX.Element;
  /** Optional custom fallback - if not provided, uses default error UI */
  fallback?: (err: Error, reset: () => void) => JSX.Element;
}

/**
 * Default error fallback UI shown when an error is caught
 */
function DefaultFallback(props: { error: Error; reset: () => void }) {
  return (
    <div class={styles.error}>
      <div class={styles.icon}>⚠️</div>
      <h2 class={styles.title}>Something went wrong</h2>
      <p class={styles.message}>{props.error.message}</p>
      <div class={styles.actions}>
        <Button variant="primary" onClick={props.reset}>
          Try Again
        </Button>
      </div>
    </div>
  );
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <SolidErrorBoundary
      fallback={(err, reset) => {
        // Log the error
        logger.error("Component error caught by ErrorBoundary:", err);

        // Use custom fallback if provided, otherwise default
        if (props.fallback) {
          return props.fallback(err, reset);
        }
        return <DefaultFallback error={err} reset={reset} />;
      }}
    >
      {props.children}
    </SolidErrorBoundary>
  );
}
