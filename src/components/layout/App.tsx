import { JSX } from "solid-js";
import { Sidebar } from "./Sidebar";
import styles from "./App.module.css";

interface AppProps {
  children: JSX.Element;
}

/**
 * App - Main application layout shell
 * 
 * Provides the sidebar navigation and main content area.
 * Used as the root component for the router.
 */
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
