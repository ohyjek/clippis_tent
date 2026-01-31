/**
 * Renderer entry point
 * Sets up the SolidJS app with routing and layout shell
 */
import { render } from "solid-js/web";
import { lazy } from "solid-js";
import { Router, Route } from "@solidjs/router";
import { Shell } from "./components/layout";

import "./styles/variables.css";
import "./index.css";

// Lazy load pages for code splitting
const Demo = lazy(() => import("./pages/Demo").then((m) => ({ default: m.Demo })));
const VoiceRoom = lazy(() => import("./pages/VoiceRoom").then((m) => ({ default: m.VoiceRoom })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.Settings })));

const root = document.getElementById("root");

if (import.meta.env.DEV && !(root instanceof HTMLElement)) {
  throw new Error(
    "Root element not found. Did you forget to add it to your index.html?"
  );
}

render(
  () => (
    <Router root={Shell}>
      <Route path="/" component={Demo} />
      <Route path="/voice" component={VoiceRoom} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  root!
);
