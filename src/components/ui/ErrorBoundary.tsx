/**
 * ErrorBoundary.tsx - App-level ErrorBoundary wrapper
 *
 * Wraps the @clippis/ui ErrorBoundary with app-specific error logging.
 */
import { JSX } from "solid-js";
import { ErrorBoundary as UIErrorBoundary } from "@clippis/ui";
import { logger } from "@/lib/logger";

interface ErrorBoundaryProps {
  /** Child components to wrap */
  children: JSX.Element;
  /** Optional custom fallback - if not provided, uses default error UI */
  fallback?: (err: Error, reset: () => void) => JSX.Element;
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <UIErrorBoundary
      onError={(err) => logger.error("Component error caught by ErrorBoundary:", err)}
      fallback={props.fallback}
    >
      {props.children}
    </UIErrorBoundary>
  );
}
