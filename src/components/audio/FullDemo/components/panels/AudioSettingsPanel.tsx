/**
 * AudioSettingsPanel.tsx - Panel for audio settings
 *
 * Contains distance model selection, max distance, rear gain, and visual settings.
 */
import { For } from "solid-js";
import type { DistanceModel } from "@/lib/spatial-audio-engine";
import { Panel, Toggle } from "@/components/ui";
import { useDemoContext } from "../../context";
import { DISTANCE_MODEL_OPTIONS } from "../../constants";
import styles from "./panels.module.css";

export function AudioSettingsPanel() {
  const {
    distanceModel,
    setDistanceModel,
    maxDistance,
    setMaxDistance,
    rearGainFloor,
    setRearGainFloor,
    showSoundPaths,
    setShowSoundPaths,
  } = useDemoContext();

  return (
    <Panel title="Audio Settings" icon="⚙️">
      <div class={styles.propertyGroup}>
        <label class={styles.propertyLabel}>Distance Model</label>
        <select
          class={styles.propertySelect}
          value={distanceModel()}
          onChange={(e) => setDistanceModel(e.currentTarget.value as DistanceModel)}
        >
          <For each={DISTANCE_MODEL_OPTIONS}>
            {(opt) => <option value={opt.value}>{opt.label}</option>}
          </For>
        </select>
      </div>

      <div class={styles.propertyGroup}>
        <label class={styles.propertyLabel}>Max Distance</label>
        <input
          type="range"
          class={styles.propertySlider}
          min={2}
          max={10}
          step={0.5}
          value={maxDistance()}
          onInput={(e) => setMaxDistance(parseFloat(e.currentTarget.value))}
        />
        <div class={styles.sliderLabels}>
          <span>Near (2)</span>
          <span>{maxDistance().toFixed(1)}</span>
          <span>Far (10)</span>
        </div>
      </div>

      <div class={styles.propertyGroup}>
        <label class={styles.propertyLabel}>Rear Gain Floor</label>
        <input
          type="range"
          class={styles.propertySlider}
          min={0}
          max={0.8}
          step={0.05}
          value={rearGainFloor()}
          onInput={(e) => setRearGainFloor(parseFloat(e.currentTarget.value))}
        />
        <div class={styles.sliderLabels}>
          <span>Silent (0)</span>
          <span>{Math.round(rearGainFloor() * 100)}%</span>
          <span>Loud (80%)</span>
        </div>
      </div>

      <div class={styles.propertyGroup}>
        <Toggle
          label="Show Sound Paths"
          description="Display lines between speakers and listener"
          checked={showSoundPaths()}
          onChange={(e) => setShowSoundPaths(e.currentTarget.checked)}
        />
      </div>
    </Panel>
  );
}
