/**
 * StatusBar.tsx - Bottom status bar for the canvas
 *
 * Shows current perspective, room count, speaker count, and interaction hints.
 */
import { useDemoContext } from "../../context";
import { getSpeakerDisplayName } from "../../utils";
import styles from "./StatusBar.module.css";

export function StatusBar() {
  const {
    rooms,
    speakers,
    playingSpeakers,
    drawingMode,
    currentPerspective,
    getPerspectivePosition,
  } = useDemoContext();

  const getPerspectiveName = () => getSpeakerDisplayName(speakers(), currentPerspective());

  // Must stay a function call inside JSX: components run once, so capturing
  // the position in a const here would freeze it at its mount-time value
  const pos = () => getPerspectivePosition();

  return (
    <div class={styles.statusBar}>
      <span class={styles.perspective}>
        👤 You: {getPerspectiveName()} ({pos().x.toFixed(1)}, {pos().y.toFixed(1)})
      </span>
      <span>
        {rooms().length} room{rooms().length !== 1 ? "s" : ""}
      </span>
      <span>
        {speakers().length} speaker{speakers().length !== 1 ? "s" : ""}
        {playingSpeakers().size > 0 && ` (${playingSpeakers().size} playing)`}
      </span>
      <span class={styles.hint}>
        {drawingMode() === "draw"
          ? "Click and drag to draw"
          : "Drag to move • Double-click to become"}
      </span>
    </div>
  );
}
