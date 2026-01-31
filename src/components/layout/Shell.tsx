import { JSX } from "solid-js";
import { Sidebar } from "./Sidebar";
import styles from "./Shell.module.css";

interface ShellProps {
  children: JSX.Element;
}

export function Shell(props: ShellProps) {
  return (
    <div class={styles.shell}>
      <Sidebar />
      <main class={styles.main}>
        {props.children}
      </main>
    </div>
  );
}
