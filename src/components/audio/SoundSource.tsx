import { SoundSource as SoundSourceType } from "../../lib/spatial-audio";
import styles from "./SoundSource.module.css";

interface SoundSourceProps {
  sound: SoundSourceType;
  index: number;
  onClick: () => void;
}

export function SoundSource(props: SoundSourceProps) {
  return (
    <div
      class={styles.soundSource}
      style={{
        left: `${50 + props.sound.position.x * 20}%`,
        top: `${50 + props.sound.position.y * 20}%`,
        background: `hsl(${props.index * 60}, 70%, 60%)`,
      }}
      onClick={(e) => {
        e.stopPropagation();
        props.onClick();
      }}
      title={`Click to move sound source ${props.index + 1}`}
    >
      {props.index + 1}
    </div>
  );
}
