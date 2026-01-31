import { Position } from "../../lib/spatial-audio";
import styles from "./Listener.module.css";

interface ListenerProps {
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
