import { AudioRoom } from "../components/audio";
import styles from "./Home.module.css";

export function Home() {
  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>Spatial Audio Room</h1>
        <p class={styles.subtitle}>
          Experience positional audio in real-time
        </p>
      </header>

      <AudioRoom />
    </div>
  );
}
