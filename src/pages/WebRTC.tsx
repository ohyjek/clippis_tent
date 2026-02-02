/**
 * WebRTC.tsx - The WebRTC page
 *
 * This page is used to test the WebRTC functionality.
 */
import styles from "./WebRTC.module.css";
import { WebRTCPanel } from "@components/audio/FullDemo/components/panels";

export function WebRTC() {
  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>{"WebRTC Testing 🖥️"}</h1>
        <p class={styles.subtitle}>{"Panel to test WebRTC (SDP exchange, etc.)"}</p>
      </header>

      <WebRTCPanel />
    </div>
  );
}
