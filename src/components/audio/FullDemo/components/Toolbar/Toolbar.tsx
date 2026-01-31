/**
 * Toolbar.tsx - Top toolbar for the spatial audio demo
 *
 * Contains mode selection, speaker controls, volume, and reset button.
 */
import { Button, Slider } from "@/components/ui";
import { audioStore } from "@/stores/audio";
import { useDemoContext } from "../../context";
import styles from "./Toolbar.module.css";

export function Toolbar() {
  const {
    drawingMode,
    setDrawingMode,
    selectedSpeaker,
    addSpeaker,
    togglePlayback,
    isPlaying,
    resetDemo,
  } = useDemoContext();

  return (
    <div class={styles.toolbar}>
      <div class={styles.toolbarGroup}>
        <span class={styles.toolLabel}>Mode</span>
        <Button
          variant={drawingMode() === "select" ? "primary" : "outline"}
          icon="👆"
          onClick={() => setDrawingMode("select")}
        >
          Select
        </Button>
        <Button
          variant={drawingMode() === "draw" ? "primary" : "outline"}
          icon="✏️"
          onClick={() => setDrawingMode("draw")}
        >
          Draw Room
        </Button>
      </div>
      <div class={styles.toolbarGroup}>
        <span class={styles.toolLabel}>Audio</span>
        <Button variant="primary" icon="➕" onClick={addSpeaker}>
          Add Speaker
        </Button>
        <Button
          variant={isPlaying(selectedSpeaker()) ? "danger" : "success"}
          icon={isPlaying(selectedSpeaker()) ? "⏹️" : "🔊"}
          onClick={() => togglePlayback(selectedSpeaker())}
        >
          {isPlaying(selectedSpeaker()) ? "Stop" : "Play"}
        </Button>
      </div>
      <div class={styles.toolbarGroup}>
        <span class={styles.toolLabel}>Volume</span>
        <Slider
          min={0}
          max={1}
          step={0.01}
          value={audioStore.masterVolume()}
          onInput={(e) =>
            audioStore.updateMasterVolume(parseFloat(e.currentTarget.value))
          }
          showValue
        />
      </div>
      <Button variant="outline" icon="🔄" onClick={resetDemo}>
        Reset
      </Button>
    </div>
  );
}
