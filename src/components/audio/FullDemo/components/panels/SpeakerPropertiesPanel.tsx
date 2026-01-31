/**
 * SpeakerPropertiesPanel.tsx - Panel for editing selected speaker properties
 *
 * Allows changing directivity pattern, frequency, and color.
 */
import { Show, For } from "solid-js";
import { SPEAKER_COLORS } from "@/lib/spatial-audio";
import type { DirectivityPattern } from "@/lib/spatial-audio-engine";
import { Button, ColorSwatches, Panel } from "@/components/ui";
import { useDemoContext } from "../../context";
import { DIRECTIVITY_OPTIONS } from "../../constants";
import { getNoteName } from "../../utils";
import styles from "./panels.module.css";

export function SpeakerPropertiesPanel() {
  const {
    speakers,
    getSelectedSpeaker,
    updateDirectivity,
    updateFrequency,
    updateSpeakerColor,
    togglePlayback,
    isPlaying,
    deleteSelectedSpeaker,
  } = useDemoContext();

  return (
    <Show when={getSelectedSpeaker()}>
      {(speaker) => (
        <Panel title="Speaker Properties" icon="🎤">
          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>Pattern</label>
            <select
              class={styles.propertySelect}
              value={speaker().directivity}
              onChange={(e) => updateDirectivity(e.currentTarget.value as DirectivityPattern)}
            >
              <For each={DIRECTIVITY_OPTIONS}>
                {(opt) => <option value={opt.value}>{opt.label}</option>}
              </For>
            </select>
          </div>

          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>
              Note: {getNoteName(speaker().frequency)} ({speaker().frequency} Hz)
            </label>
            <input
              type="range"
              class={styles.propertySlider}
              min="220"
              max="880"
              step="10"
              value={speaker().frequency}
              onInput={(e) => updateFrequency(parseInt(e.currentTarget.value))}
            />
            <div class={styles.sliderLabels}>
              <span>A3 (220)</span>
              <span>A5 (880)</span>
            </div>
          </div>

          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>Color</label>
            <ColorSwatches
              colors={SPEAKER_COLORS}
              selected={speaker().color}
              onSelect={updateSpeakerColor}
              label="Speaker color"
            />
          </div>

          <div class={`${styles.propertyGroup} ${styles.buttonRow}`}>
            <Button
              variant={isPlaying(speaker().id) ? "danger" : "success"}
              icon={isPlaying(speaker().id) ? "⏹️" : "▶️"}
              onClick={() => togglePlayback(speaker().id)}
            >
              {isPlaying(speaker().id) ? "Stop" : "Play"}
            </Button>
            <Show when={speakers().length > 1}>
              <Button variant="danger" icon="🗑️" onClick={deleteSelectedSpeaker}>
                Delete
              </Button>
            </Show>
          </div>
        </Panel>
      )}
    </Show>
  );
}
