/**
 * FullDemo.tsx - Complete Spatial Audio Playground
 *
 * The comprehensive demo combining all spatial audio features:
 * - Draw rooms by clicking and dragging
 * - Draggable listener with facing direction
 * - Multiple speakers with configurable directivity patterns
 * - Continuous tone playback with real-time updates
 * - Room boundaries with configurable wall attenuation
 * - Multiple distance attenuation models
 *
 * This component serves as a thin shell that composes all sub-components
 * and wraps them with the DemoProvider context.
 */
import { audioStore } from "@/stores/audio";
import { DemoProvider, useDemoContext } from "./context";
import { Toolbar, SpatialCanvas, StatusBar, Sidebar } from "./components";
import styles from "./FullDemo.module.css";

/** Audio banner shown when audio is not yet initialized */
function AudioBanner() {
  return (
    <div class={styles.banner}>
      <p>
        🔊 <strong>Click anywhere</strong> to enable audio, then click a speaker
        to start!
      </p>
    </div>
  );
}

/** Canvas title that changes based on drawing mode */
function CanvasTitle() {
  const { drawingMode } = useDemoContext();

  return (
    <h3 class={styles.canvasTitle}>
      {drawingMode() === "draw"
        ? "Click and drag to draw a room"
        : "Spatial Audio Playground"}
    </h3>
  );
}

/** Inner content that has access to context */
function DemoContent() {
  return (
    <div class={styles.container}>
      {!audioStore.audioInitialized() && <AudioBanner />}

      <Toolbar />

      <div class={styles.mainContent}>
        <div class={styles.canvasWrapper}>
          <CanvasTitle />
          <SpatialCanvas />
          <StatusBar />
        </div>
        <Sidebar />
      </div>
    </div>
  );
}

/** Main exported component - wraps everything with DemoProvider */
export function FullDemo() {
  return (
    <DemoProvider>
      <DemoContent />
    </DemoProvider>
  );
}
