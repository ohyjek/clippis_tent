/**
 * AudioSettingsPanel.tsx - Panel for audio settings
 *
 * Contains distance model selection.
 */
import { For } from "solid-js";
import type { DistanceModel } from "@/lib/spatial-audio-engine";
import { Panel } from "@/components/ui";
import { useDemoContext } from "../../context";
import { DISTANCE_MODEL_OPTIONS } from "../../constants";
import styles from "./panels.module.css";

export function AudioSettingsPanel() {
  const { distanceModel, setDistanceModel } = useDemoContext();

  return (
    <Panel title="Audio Settings" icon="⚙️">
      <div class={styles.propertyGroup}>
        <label class={styles.propertyLabel}>Distance Model</label>
        <select
          class={styles.propertySelect}
          value={distanceModel()}
          onChange={(e) =>
            setDistanceModel(e.currentTarget.value as DistanceModel)
          }
        >
          <For each={DISTANCE_MODEL_OPTIONS}>
            {(opt) => <option value={opt.value}>{opt.label}</option>}
          </For>
        </select>
      </div>
    </Panel>
  );
}
