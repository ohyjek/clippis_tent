/**
 * RoomPropertiesPanel.tsx - Panel for editing selected room properties
 *
 * Allows changing room name, color, and wall attenuation.
 */
import { Show, For } from "solid-js";
import { Button } from "@/components/ui";
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
        <div class={styles.panel}>
          <h4 class={styles.panelTitle}>🚪 Room Properties</h4>

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
            <div class={styles.colorSwatches}>
              <For each={ROOM_COLORS}>
                {(color) => (
                  <div
                    class={`${styles.colorSwatch} ${room().color === color ? styles.selected : ""}`}
                    style={{ background: color }}
                    onClick={() => updateRoomColor(color)}
                  />
                )}
              </For>
            </div>
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
        </div>
      )}
    </Show>
  );
}
