/**
 * StatusBar.tsx - Bottom status bar for the canvas
 *
 * Shows listener position, room count, speaker count, and interaction hints.
 */
import { useDemoContext } from "../../context";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const { listenerPos, rooms, speakers, playingSpeakers, drawingMode } = useDemoContext();

  return (
    <div class={styles.statusBar}>
      <span>
        🎧 ({listenerPos().x.toFixed(1)}, {listenerPos().y.toFixed(1)})
      </span>
      <span>
        {rooms().length} room{rooms().length !== 1 ? "s" : ""}
      </span>
      <span>
        {speakers().length} speaker{speakers().length !== 1 ? "s" : ""}
        {playingSpeakers().size > 0 && ` (${playingSpeakers().size} playing)`}
      </span>
      <span class={styles.hint}>
        {drawingMode() === "draw" ? "Click and drag to draw" : "Drag to move • Click to select"}
      </span>
    </div>
  );
}
