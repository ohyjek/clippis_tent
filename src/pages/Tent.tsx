/**
 * Tent.tsx - The Tent page (main spatial audio playground)
 *
 * Interactive spatial audio demo featuring:
 * - Draggable listener with facing direction
 * - Multiple speakers with directivity patterns
 * - Continuous audio playback with real-time updates
 * - Distance attenuation models
 *
 * This is the home page (/) of the app.
 */
import { FullDemo } from "@/components/audio";
import styles from "./Tent.module.css";

export function Tent() {
  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>The Tent</h1>
        <p class={styles.subtitle}>
          Experience spatial audio with draggable sources and listener
        </p>
      </header>

      <FullDemo />
    </div>
  );
}
