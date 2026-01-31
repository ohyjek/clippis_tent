/**
 * RoomPropertiesPanel.tsx - Panel for editing selected room properties
 *
 * Allows changing room name, color, and wall attenuation.
 */
import { Show } from "solid-js";
import { Button, ColorSwatches, Panel } from "@/components/ui";
import { useDemoContext } from "../../context";
import { ROOM_COLORS } from "../../constants";
import styles from "./panels.module.css";

export function RoomPropertiesPanel() {
  const {
    selectedRoom,
    updateRoomLabel,
    updateRoomColor,
    updateRoomAttenuation,
    deleteSelectedRoom,
  } = useDemoContext();

  return (
    <Show when={selectedRoom()}>
      {(room) => (
        <Panel title="Room Properties" icon="🚪">
          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>Name</label>
            <input
              type="text"
              class={styles.propertyInput}
              value={room().label}
              onInput={(e) => updateRoomLabel(e.currentTarget.value)}
            />
          </div>

          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>Color</label>
            <ColorSwatches
              colors={ROOM_COLORS}
              selected={room().color}
              onSelect={updateRoomColor}
              label="Room color"
            />
          </div>

          <div class={styles.propertyGroup}>
            <label class={styles.propertyLabel}>
              Wall Attenuation: {Math.round(room().attenuation * 100)}%
            </label>
            <input
              type="range"
              class={styles.propertySlider}
              min="0"
              max="100"
              value={room().attenuation * 100}
              onInput={(e) =>
                updateRoomAttenuation(parseInt(e.currentTarget.value) / 100)
              }
            />
            <div class={styles.sliderLabels}>
              <span>Transparent</span>
              <span>Solid</span>
            </div>
          </div>

          <div class={styles.propertyGroup}>
            <Button variant="danger" icon="🗑️" onClick={deleteSelectedRoom}>
              Delete Room
            </Button>
          </div>
        </Panel>
      )}
    </Show>
  );
}
