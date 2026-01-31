/**
 * Sidebar.tsx - Right sidebar containing all property panels
 *
 * Composes all panel components in the correct order.
 */
import {
  SpeakerPropertiesPanel,
  RoomPropertiesPanel,
  AudioSettingsPanel,
  SpeakersListPanel,
  RoomsListPanel,
} from "../panels";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  return (
    <div class={styles.sidebar}>
      <SpeakerPropertiesPanel />
      <RoomPropertiesPanel />
      <AudioSettingsPanel />
      <SpeakersListPanel />
      <RoomsListPanel />
    </div>
  );
}
