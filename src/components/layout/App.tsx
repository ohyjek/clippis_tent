/**
 * App.tsx - Accessible application layout shell
 *
 * The root layout component that wraps all pages.
 * Includes:
 * - Skip-to-main-content link for keyboard users
 * - Proper landmark regions (main, aside via Sidebar)
 * - Labeled main content area
 *
 * Used as the `root` prop for the SolidJS Router.
 */
import { JSX } from "solid-js";
import { Sidebar } from "./Sidebar";
import styles from "./App.module.css";

interface AppProps {
  /** Page content rendered by the router (optional during route transitions) */
  children?: JSX.Element;
}

export function App(props: AppProps) {
  return (
    <div class={styles.app}>
      <a href="#main-content" class={styles.skipLink}>
        Skip to main content
      </a>
      <Sidebar />
      <main id="main-content" class={styles.main} aria-label="Page content">
        {props.children}
      </main>
    </div>
  );
}
