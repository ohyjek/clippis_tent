/**
 * RoomPropertiesPanel.tsx - Panel for editing selected room properties
 *
 * Allows changing room name, color, and wall attenuation.
 */
import { Show, createEffect, createSignal } from "solid-js";
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

  // Local slider value to prevent race conditions when room selection changes
  const [sliderValue, setSliderValue] = createSignal(70);

  // Sync local slider value when selected room changes
  createEffect(() => {
    const room = selectedRoom();
    if (room) {
      setSliderValue(Math.round(room.attenuation * 100));
    }
  });

  const handleSliderChange = (e: InputEvent & { currentTarget: HTMLInputElement }) => {
    const newValue = parseInt(e.currentTarget.value);
    const room = selectedRoom();
    if (!room) return;

    setSliderValue(newValue);
    // Pass the room ID explicitly to prevent race conditions when selection changes
    updateRoomAttenuation(newValue / 100, room.id);
  };

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
              Wall Attenuation: {sliderValue()}%
            </label>
            <input
              type="range"
              class={styles.propertySlider}
              min="0"
              max="100"
              step="1"
              value={sliderValue()}
              onInput={handleSliderChange}
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
