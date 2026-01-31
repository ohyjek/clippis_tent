/**
 * StatusBar.tsx - Bottom status bar for the canvas
 *
 * Shows current perspective, room count, speaker count, and interaction hints.
 */
import { useDemoContext } from "../../context";
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

  const getPerspectiveName = () => {
    const perspective = currentPerspective();
    if (perspective === "observer") return "Observer";
    const speakerList = speakers();
    const index = speakerList.findIndex((s) => s.id === perspective);
    return index >= 0 ? `Speaker ${index}` : "Unknown";
  };

  const pos = getPerspectivePosition();

  return (
    <div class={styles.statusBar}>
      <span class={styles.perspective}>
        👤 You: {getPerspectiveName()} ({pos.x.toFixed(1)}, {pos.y.toFixed(1)})
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
