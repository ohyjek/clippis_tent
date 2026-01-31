import { DemoRoom } from "../components/audio";
import styles from "./Demo.module.css";

export function Demo() {
  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>Demo Room</h1>
        <p class={styles.subtitle}>
          Experience spatial audio positioning — sounds change based on distance and direction
        </p>
      </header>

      <DemoRoom />

      <section class={styles.info}>
        <h3>How it works</h3>
        <ul>
          <li><strong>Click the room</strong> to move your listener position</li>
          <li><strong>Click numbered sources</strong> to randomize their positions</li>
          <li><strong>Volume</strong> decreases with distance (inverse square law)</li>
          <li><strong>Stereo panning</strong> shifts based on horizontal position</li>
        </ul>
      </section>
    </div>
  );
}
