/**
 * App.tsx - Main application layout shell
 *
 * The root layout component that wraps all pages.
 * Renders the Sidebar on the left and page content on the right.
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
      <Sidebar />
      <main class={styles.main}>
        {props.children}
      </main>
    </div>
  );
}
