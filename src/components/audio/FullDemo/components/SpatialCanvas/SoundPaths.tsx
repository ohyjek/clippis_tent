/**
 * SoundPaths.tsx - SVG lines showing sound paths from speakers to listener
 *
 * Visualizes the direct path between each speaker and the listener,
 * with dashed lines when the path is blocked by walls.
 */
import { For } from "solid-js";
import type { SpeakerState, Position } from "../../context/types";
import { toPercent } from "../../utils";
import styles from "./SpatialCanvas.module.css";

interface SoundPathsProps {
  speakers: SpeakerState[];
  listenerPos: Position;
  selectedSpeakerId: string;
  getWallCount: (speaker: SpeakerState) => number;
}

export function SoundPaths(props: SoundPathsProps) {
  return (
    <svg class={styles.pathSvg}>
      <For each={props.speakers}>
        {(speaker) => {
          const wallCount = props.getWallCount(speaker);
          return (
            <line
              x1={`${toPercent(speaker.position.x)}%`}
              y1={`${toPercent(speaker.position.y)}%`}
              x2={`${toPercent(props.listenerPos.x)}%`}
              y2={`${toPercent(props.listenerPos.y)}%`}
              class={`${styles.pathLine} ${wallCount > 0 ? styles.blocked : ""}`}
              stroke-dasharray={wallCount > 0 ? "5,5" : "none"}
              opacity={props.selectedSpeakerId === speaker.id ? 1 : 0.3}
            />
          );
        }}
      </For>
    </svg>
  );
}
