/**
 * Listener.tsx - The "you are here" icon in the audio room
 *
 * Renders a headphone emoji at the listener's position.
 * Position is in room coordinates (-2.5 to +2.5), converted to percentages.
 *
 * Used by TentRoom to show where the user is listening from.
 */
import { Position } from "@/lib/spatial-audio";
import styles from "./Listener.module.css";

interface ListenerProps {
  /** Position in room coordinates (x, y from -2.5 to +2.5) */
  position: Position;
}

export function Listener(props: ListenerProps) {
  return (
    <div
      class={styles.listener}
      style={{
        left: `${50 + props.position.x * 20}%`,
        top: `${50 + props.position.y * 20}%`,
      }}
    >
      🎧
    </div>
  );
}
