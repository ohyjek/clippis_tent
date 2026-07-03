/**
 * SpeakerPropertiesPanel.tsx - Panel for editing selected speaker properties
 *
 * Allows changing source type (oscillator/microphone), directivity pattern, frequency, and color.
 */

import type { AudioSourceType, DirectivityPattern } from "@clippis/types";
import { DIRECTIVITY_OPTIONS, SOURCE_TYPE_OPTIONS } from "@components/audio/FullDemo/constants";
import { useDemoContext } from "@components/audio/FullDemo/context";
import { getNoteName } from "@components/audio/FullDemo/utils";
import {
  Button,
  ButtonRow,
  ColorSwatches,
  DropdownField,
  FieldGroup,
  Panel,
  SliderField,
} from "@components/ui";
import { SPEAKER_COLORS } from "@lib/spatial-audio";
import { For, Show } from "solid-js";

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
          <DropdownField
            label="Audio Source"
            value={speaker().sourceType}
            onChange={(e) => updateSourceType(e.currentTarget.value as AudioSourceType)}
            hint={
              speaker().sourceType === "microphone"
                ? microphoneEnabled()
                  ? "🎙️ Mic active"
                  : "Mic will be requested on play"
                : undefined
            }
          >
            <For each={SOURCE_TYPE_OPTIONS}>
              {(opt) => <option value={opt.value}>{opt.label}</option>}
            </For>
          </DropdownField>

          <DropdownField
            label="Pattern"
            value={speaker().directivity}
            onChange={(e) => updateDirectivity(e.currentTarget.value as DirectivityPattern)}
          >
            <For each={DIRECTIVITY_OPTIONS}>
              {(opt) => <option value={opt.value}>{opt.label}</option>}
            </For>
          </DropdownField>

          <Show when={speaker().sourceType === "oscillator"}>
            <SliderField
              label={`Note: ${getNoteName(speaker().frequency)} (${speaker().frequency} Hz)`}
              value={speaker().frequency}
              onInput={(e) => updateFrequency(parseInt(e.currentTarget.value, 10))}
              min={220}
              max={880}
              step={10}
              minLabel="A3 (220)"
              maxLabel="A5 (880)"
              formatValue={(v) => `${v} Hz`}
            />
          </Show>

          <FieldGroup label="Color">
            <ColorSwatches
              colors={SPEAKER_COLORS}
              selected={speaker().color}
              onSelect={updateSpeakerColor}
              label="Speaker color"
            />
          </FieldGroup>

          <ButtonRow>
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
          </ButtonRow>
        </Panel>
      )}
    </Show>
  );
}
