/**
 * Renderer entry point
 * Sets up the SolidJS app with routing and layout shell
 */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { Shell } from "./components/layout";
import { Demo, Settings, VoiceRoom } from "./pages";

import "./styles/variables.css";
import "./index.css";

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
