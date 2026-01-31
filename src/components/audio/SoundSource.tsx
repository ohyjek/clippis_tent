/**
 * SoundSource.tsx - Draggable numbered sound source circle
 *
 * Renders a colored circle with a number that can be dragged around the room.
 * Each source has a unique color based on its index (hue rotation).
 * Plays a tone when drag ends to demonstrate spatial audio at new position.
 *
 * Used by TentRoom for the listener demo.
 */
import { createSignal } from "solid-js";
import { SoundSource as SoundSourceType, Position } from "@/lib/spatial-audio";
import styles from "./SoundSource.module.css";

interface SoundSourceProps {
  /** Sound source data (id, position, frequency) */
  sound: SoundSourceType;
  /** Index for display number and color calculation */
  index: number;
  /** Callback to convert mouse event to room coordinates */
  getPositionFromEvent: (e: MouseEvent) => Position;
  /** Called continuously during drag with new position */
  onPositionChange: (position: Position) => void;
  /** Called when drag ends (mouse up) */
  onDragEnd: () => void;
}

export function SoundSource(props: SoundSourceProps) {
  const [isDragging, setIsDragging] = createSignal(false);

  const handleMouseDown = (e: MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDragging()) return;
      const newPosition = props.getPositionFromEvent(moveEvent);
      props.onPositionChange(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      props.onDragEnd();
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      class={`${styles.soundSource} ${isDragging() ? styles.dragging : ""}`}
      style={{
        left: `${50 + props.sound.position.x * 20}%`,
        top: `${50 + props.sound.position.y * 20}%`,
        background: `hsl(${props.index * 60}, 70%, 60%)`,
      }}
      onMouseDown={handleMouseDown}
      title={`Drag to move sound source ${props.index + 1}`}
    >
      {props.index + 1}
    </div>
  );
}
