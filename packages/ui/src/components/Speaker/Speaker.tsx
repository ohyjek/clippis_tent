/**
 * Speaker.tsx - Reusable spatial audio speaker component
 *
 * A visual representation of a speaker/sound source with:
 * - Optional directional cone showing facing direction
 * - Optional gain bar showing volume level
 * - Optional label for identification
 * - Draggable for position and/or rotation
 * - Click to play/select
 *
 * Used across demos: SpeakerDemo, Scenarios, RoomDemo
 */
import { JSX } from "solid-js";
import styles from "./Speaker.module.css";

export interface Position {
  x: number;
  y: number;
}

export interface SpeakerProps {
  /** Unique identifier */
  id: string;
  /** Position in room coordinates (typically -2.5 to 2.5) */
  position: Position;
  /** Speaker color for cone and indicators */
  color?: string;
  /** Facing direction in radians (if provided, shows cone) */
  facing?: number;
  /** Label to display (e.g., frequency) */
  label?: string;
  /** Current gain/volume level 0-1 (if provided, shows gain bar) */
  gain?: number;
  /** Whether this speaker is currently selected */
  isSelected?: boolean;
  /** Whether this speaker is currently playing */
  isPlaying?: boolean;
  /** Whether the speaker is being dragged/moved */
  isMoving?: boolean;
  /** Whether the speaker is being rotated */
  isRotating?: boolean;
  /** Custom icon (default: 🎙️) */
  icon?: string;
  /** Called when speaker icon is clicked */
  onClick?: () => void;
  /** Called when starting to drag the speaker (for move) */
  onMoveStart?: (e: MouseEvent) => void;
  /** Called when starting to drag the cone (for rotate) */
  onRotateStart?: (e: MouseEvent) => void;
  /** Additional CSS class */
  class?: string;
  /** Style overrides for positioning */
  style?: JSX.CSSProperties;
}

/**
 * Speaker component - renders a draggable, rotatable sound source
 */
export function Speaker(props: SpeakerProps) {
  const color = () => props.color ?? "#3b82f6";
  const icon = () => props.icon ?? "🎙️";
  const facingDegrees = () => props.facing !== undefined ? (props.facing * 180 / Math.PI) : 0;
  const showCone = () => props.facing !== undefined;
  const showGain = () => props.gain !== undefined;

  const handleIconClick = (e: MouseEvent) => {
    e.stopPropagation();
    props.onClick?.();
  };

  const handleIconMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.onMoveStart) {
      props.onMoveStart(e);
    }
  };

  const handleConeMouseDown = (e: MouseEvent) => {
    e.stopPropagation();
    if (props.onRotateStart) {
      props.onRotateStart(e);
    }
  };

  const classes = () => [
    styles.speaker,
    props.isSelected && styles.selected,
    props.isPlaying && styles.playing,
    props.isMoving && styles.moving,
    props.isRotating && styles.rotating,
    props.class,
  ].filter(Boolean).join(" ");

  return (
    <div
      class={classes()}
      style={{
        "--speaker-color": color(),
        ...props.style,
      }}
    >
      {/* Sound cone - drag to rotate */}
      {showCone() && (
        <div
          class={styles.soundCone}
          style={{
            transform: `rotate(${facingDegrees()}deg)`,
            opacity: props.isSelected ? 0.7 : 0.4,
          }}
          onMouseDown={handleConeMouseDown}
          title={`Drag to rotate • ${facingDegrees().toFixed(0)}°`}
        />
      )}

      {/* Speaker icon - click to play, drag to move */}
      <span
        class={styles.speakerIcon}
        onClick={handleIconClick}
        onMouseDown={handleIconMouseDown}
        title={props.label ?? "Click to play • Drag to move"}
      >
        {icon()}
      </span>

      {/* Label (e.g., frequency) */}
      {props.label && (
        <span class={styles.label}>{props.label}</span>
      )}

      {/* Gain indicator */}
      {showGain() && (
        <div class={styles.gainBar}>
          <div
            class={styles.gainFill}
            style={{ width: `${(props.gain ?? 0) * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
