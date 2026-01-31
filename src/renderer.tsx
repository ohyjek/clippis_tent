/**
 * Renderer entry point
 * Sets up the SolidJS app with routing and layout shell
 */
import { render } from "solid-js/web";
import { Router, Route } from "@solidjs/router";
import { Shell } from "./components/layout";
import { Home, Settings } from "./pages";

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
      <Route path="/" component={Home} />
      <Route path="/settings" component={Settings} />
    </Router>
  ),
  root!
);
