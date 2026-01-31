/**
 * RoomsListPanel.tsx - Panel listing all rooms
 *
 * Shows each room with its name and color.
 */
import { Show, For } from "solid-js";
import { useDemoContext } from "../../context";
import styles from "./panels.module.css";

export function RoomsListPanel() {
  const { rooms, selectedRoomId, setSelectedRoomId } = useDemoContext();

  return (
    <div class={styles.panel}>
      <h4 class={styles.panelTitle}>🚪 Rooms</h4>
      <Show
        when={rooms().length > 0}
        fallback={<div class={styles.emptyState}>No rooms yet. Draw one!</div>}
      >
        <div class={styles.itemList}>
          <For each={rooms()}>
            {(room) => (
              <div
                class={`${styles.listItem} ${selectedRoomId() === room.id ? styles.selected : ""}`}
                onClick={() => setSelectedRoomId(room.id)}
              >
                <div
                  class={styles.itemSwatch}
                  style={{ background: room.color }}
                />
                <span class={styles.itemName}>{room.label}</span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  );
}
