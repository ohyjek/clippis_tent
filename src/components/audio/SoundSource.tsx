import { createSignal } from "solid-js";
import { SoundSource as SoundSourceType, Position } from "@/lib/spatial-audio";
import styles from "./SoundSource.module.css";

interface SoundSourceProps {
  sound: SoundSourceType;
  index: number;
  /** Callback to convert mouse event to room coordinates */
  getPositionFromEvent: (e: MouseEvent) => Position;
  /** Called when position changes during drag */
  onPositionChange: (position: Position) => void;
  /** Called when drag ends */
  onDragEnd: () => void;
}

/**
 * SoundSource - A draggable sound source in the audio room
 * 
 * Displays as a numbered circle that can be dragged to reposition.
 * Position updates are streamed during drag for real-time feedback.
 */
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
