/**
 * SpeakerPropertiesPanel.tsx - Panel for editing selected speaker properties
 *
 * Allows changing source type (oscillator/microphone), directivity pattern, frequency, and color.
 */
import { Show, For } from "solid-js";
import { SPEAKER_COLORS } from "@/lib/spatial-audio";
import type { DirectivityPattern } from "@/lib/spatial-audio-engine";
import type { AudioSourceType } from "@clippis/types";
import { Button, ColorSwatches, Panel } from "@/components/ui";
import { useDemoContext } from "../../context";
import { DIRECTIVITY_OPTIONS, SOURCE_TYPE_OPTIONS } from "../../constants";
import { getNoteName } from "../../utils";
import styles from "./panels.module.css";

export function SpeakerPropertiesPanel() {
  const {
    getSelectedSpeaker,
    updateDirectivity,
    updateFrequency,
    updateSpeakerColor,
    updateSourceType,
    togglePlayback,
    isPlaying,
    deleteSelectedSpeaker,
    microphoneEnabled,
  } = useDemoContext();

  return (
    <Show when={getSelectedSpeaker()}>
      {(speaker) => (
        <Panel title="Speaker Properties" icon="🎤">
          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>Audio Source</label>
            <select
              class={styles.propertySelect}
              value={speaker().sourceType}
              onChange={(e) => updateSourceType(e.currentTarget.value as AudioSourceType)}
            >
              <For each={SOURCE_TYPE_OPTIONS}>
                {(opt) => <option value={opt.value}>{opt.label}</option>}
              </For>
            </select>
            <Show when={speaker().sourceType === "microphone"}>
              <small class={styles.hint}>
                {microphoneEnabled() ? "🎙️ Mic active" : "Mic will be requested on play"}
              </small>
            </Show>
          </div>

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

          <Show when={speaker().sourceType === "oscillator"}>
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
          </Show>

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
            <Button variant="danger" icon="🗑️" onClick={deleteSelectedSpeaker}>
              Delete
            </Button>
          </div>
        </Panel>
      )}
    </Show>
  );
}
