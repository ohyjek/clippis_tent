/**
 * RoomRenderer.tsx - Renders room boundaries and walls
 *
 * Displays room areas with labels and colored walls on the canvas.
 */
import { For } from "solid-js";
import type { DrawnRoom, DrawingMode } from "../../context/types";
import { toPercent } from "../../utils";
import styles from "./SpatialCanvas.module.css";

interface RoomRendererProps {
  rooms: DrawnRoom[];
  selectedRoomId: string | null;
  drawingMode: DrawingMode;
  onRoomClick: (roomId: string) => (e: MouseEvent) => void;
}

export function RoomRenderer(props: RoomRendererProps) {
  return (
    <For each={props.rooms}>
      {(room) => {
        const b = room.bounds;
        const left = toPercent(b.x - b.width / 2);
        const top = toPercent(b.y - b.height / 2);
        const width = b.width * 20;
        const height = b.height * 20;

        return (
          <>
            <div
              class={`${styles.roomArea} ${props.selectedRoomId === room.id ? styles.selected : ""} ${props.drawingMode === "draw" ? styles.drawModeRoom : ""}`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: `${width}%`,
                height: `${height}%`,
                "border-color": room.color,
                background: `${room.color}20`,
              }}
              onClick={props.onRoomClick(room.id)}
            >
              <span class={styles.roomLabel}>{room.label}</span>
            </div>
            <For each={room.walls}>
              {(wall) => {
                const isVertical = wall.start.x === wall.end.x;
                const length = isVertical
                  ? Math.abs(wall.end.y - wall.start.y)
                  : Math.abs(wall.end.x - wall.start.x);

                return (
                  <div
                    class={`${styles.wall} ${isVertical ? styles.vertical : styles.horizontal}`}
                    style={{
                      left: `${toPercent(Math.min(wall.start.x, wall.end.x))}%`,
                      top: `${toPercent(Math.min(wall.start.y, wall.end.y))}%`,
                      [isVertical ? "height" : "width"]: `${length * 20}%`,
                      background: room.color,
                    }}
                  />
                );
              }}
            </For>
          </>
        );
      }}
    </For>
  );
}
