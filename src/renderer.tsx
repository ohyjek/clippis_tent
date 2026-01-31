/**
 * renderer.tsx - SolidJS app entry point (frontend)
 *
 * This is the "frontend" that runs in the Electron browser window.
 * Sets up:
 * - SolidJS Router with App layout as root
 * - Lazy-loaded pages for code splitting
 * - Global CSS imports
 *
 * Routes:
 *   /         -> Tent (spatial audio demos)
 *   /voice    -> VoiceRoom (coming soon)
 *   /settings -> Settings page
 */
import { render } from "solid-js/web";
import { lazy } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { App } from "@/components/layout";

import "@/styles/variables.css";
import "@/index.css";

// Lazy load pages for code splitting
const Tent = lazy(() => import("@/pages/Tent").then((m) => ({ default: m.Tent })));
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
    <Router root={App}>
      <Route path="/" component={Tent} />
      <Route path="/voice" component={VoiceRoom} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  root!
);
