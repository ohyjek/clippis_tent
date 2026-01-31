/**
 * renderer.tsx - SolidJS app entry point (frontend)
 *
 * This is the "frontend" that runs in the Electron browser window.
 * Sets up:
 * - SolidJS Router with App layout as root
 * - Lazy-loaded pages for code splitting
 * - Global error handlers
 * - Toast notifications
 * - I18n provider for translations
 * - Theme initialization
 *
 * Routes:
 *   /          -> Tent (spatial audio demos)
 *   /scenarios -> Scenarios (preset audio configurations)
 *   /voice     -> VoiceRoom (coming soon)
 *   /settings  -> Settings page
 */
import { render } from "solid-js/web";
import { lazy } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { App } from "@/components/layout";
import { ErrorBoundary, ToastContainer } from "@/components/ui";
import { I18nProvider } from "@/lib/i18n";
import { logger } from "@/lib/logger";
import { showToast } from "@/stores/toast";
// Initialize theme store (applies theme before first render)
import "@/stores/theme";

import "@/styles/variables.css";
import "@/index.css";

// Global error handlers
window.onerror = (message, source, lineno, colno, error) => {
  logger.error("Uncaught error:", { message, source, lineno, colno, error });
  showToast({ type: "error", message: "An unexpected error occurred" });
  return false; // Let the error propagate
};

window.onunhandledrejection = (event) => {
  logger.error("Unhandled promise rejection:", event.reason);
  showToast({ type: "error", message: "An unexpected error occurred" });
};

logger.info("Renderer starting");

// Lazy load pages for code splitting
const Tent = lazy(() => import("@/pages/Tent").then((m) => ({ default: m.Tent })));
const Scenarios = lazy(() => import("@/pages/Scenarios").then((m) => ({ default: m.Scenarios })));
const VoiceRoom = lazy(() => import("@/pages/VoiceRoom").then((m) => ({ default: m.VoiceRoom })));
const Settings = lazy(() => import("@/pages/Settings").then((m) => ({ default: m.Settings })));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html?"
  );
}

render(
  () => (
    <ErrorBoundary>
      <I18nProvider>
        <Router root={App}>
          <Route path="/" component={Tent} />
          <Route path="/scenarios" component={Scenarios} />
          <Route path="/voice" component={VoiceRoom} />
          <Route path="/settings" component={Settings} />
        </Router>
        <ToastContainer />
      </I18nProvider>
    </ErrorBoundary>
  ),
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  root!
);

logger.info("Renderer initialized");
