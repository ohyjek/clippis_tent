/**
 * SpeakersListPanel.tsx - Panel listing all speakers
 *
 * Shows each speaker with its note/frequency and playing status.
 */
import { For } from "solid-js";
import { useDemoContext } from "../../context";
import { getNoteName } from "../../utils";
import styles from "./panels.module.css";

export function SpeakersListPanel() {
  const { speakers, selectedSpeaker, setSelectedSpeaker, isPlaying } = useDemoContext();

  return (
    <div class={styles.panel}>
      <h4 class={styles.panelTitle}>🎤 Speakers</h4>
      <div class={styles.itemList}>
        <For each={speakers()}>
          {(speaker) => (
            <div
              class={`${styles.listItem} ${selectedSpeaker() === speaker.id ? styles.selected : ""}`}
              onClick={() => setSelectedSpeaker(speaker.id)}
            >
              <div
                class={styles.itemSwatch}
                style={{ background: speaker.color }}
              />
              <span class={styles.itemName}>
                {getNoteName(speaker.frequency)} ({speaker.frequency} Hz)
                {isPlaying(speaker.id) && " 🔊"}
              </span>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
