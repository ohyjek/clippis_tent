/**
 * AudioSettingsPanel.tsx - Panel for audio settings
 *
 * Contains perspective selection, distance model, max distance, rear gain, and visual settings.
 */
import { For, Index } from "solid-js";
import type { DistanceModel } from "@clippis/types";
import { Panel, Toggle, DropdownField, SliderField, FieldGroup } from "@/components/ui";
import { useDemoContext } from "../../context";
import { DISTANCE_MODEL_OPTIONS } from "../../constants";

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
    hearSelf,
    setHearSelf,
    currentPerspective,
    setCurrentPerspective,
    speakers,
  } = useDemoContext();

  // Get display label for a speaker
  const getSpeakerLabel = (speakerId: string, index: number) => {
    if (speakerId === "observer") return "You (Observer)";
    return `Speaker ${index}`;
  };

  return (
    <Panel title="Audio Settings" icon="⚙️">
      {/* Perspective - uses FieldGroup with raw select for Index reactivity */}
      <FieldGroup label="Your Perspective" hint="Who are you? Audio is heard from this position.">
        <select
          value={currentPerspective()}
          onChange={(e) => setCurrentPerspective(e.currentTarget.value)}
        >
          <Index each={speakers()}>
            {(speaker, i) => (
              <option value={speaker().id}>{getSpeakerLabel(speaker().id, i)}</option>
            )}
          </Index>
        </select>
      </FieldGroup>

      <DropdownField
        label="Distance Model"
        value={distanceModel()}
        onChange={(e) => setDistanceModel(e.currentTarget.value as DistanceModel)}
      >
        <For each={DISTANCE_MODEL_OPTIONS}>
          {(opt) => <option value={opt.value}>{opt.label}</option>}
        </For>
      </DropdownField>

      <SliderField
        label="Max Distance"
        value={maxDistance()}
        onInput={(e) => setMaxDistance(parseFloat(e.currentTarget.value))}
        min={2}
        max={10}
        step={0.5}
        minLabel="Near (2)"
        maxLabel="Far (10)"
        formatValue={(v) => v.toFixed(1)}
      />

      <SliderField
        label="Rear Gain Floor"
        value={rearGainFloor()}
        onInput={(e) => setRearGainFloor(parseFloat(e.currentTarget.value))}
        min={0}
        max={0.8}
        step={0.05}
        minLabel="Silent (0)"
        maxLabel="Loud (80%)"
        formatValue={(v) => `${Math.round(v * 100)}%`}
      />

      {/* Toggles section */}
      <FieldGroup label="Options">
        <Toggle
          label="Hear Yourself"
          description="Hear your own speaker's audio output"
          checked={hearSelf()}
          onChange={(e) => setHearSelf(e.currentTarget.checked)}
        />
        <Toggle
          label="Show Sound Paths"
          description="Display lines between speakers and listener"
          checked={showSoundPaths()}
          onChange={(e) => setShowSoundPaths(e.currentTarget.checked)}
        />
      </FieldGroup>
    </Panel>
  );
}
