/**
 * VoiceRoom.tsx - Voice chat page (/voice) - COMING SOON
 *
 * Placeholder for future real-time voice chat functionality.
 * Will use WebRTC for peer-to-peer audio with spatial positioning.
 *
 * Planned features:
 * - Create/join rooms
 * - Spatial voice positioning
 * - Push-to-talk or voice activation
 */
import { Button } from "@/components/ui";
import styles from "./VoiceRoom.module.css";

export function VoiceRoom() {
  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>Voice Room</h1>
        <p class={styles.subtitle}>
          Real-time spatial voice chat with other users
        </p>
      </header>

      <div class={styles.placeholder}>
        <div class={styles.icon}>🎙️</div>
        <h2>Coming Soon</h2>
        <p>
          Voice Room will enable real-time spatial voice chat using WebRTC
          peer-to-peer connections. You'll be able to:
        </p>
        <ul>
          <li>Join rooms with other users</li>
          <li>Hear voices positioned in 3D space</li>
          <li>Move your avatar and experience positional audio</li>
          <li>Use push-to-talk or voice activation</li>
        </ul>

        <div class={styles.actions}>
          <Button variant="primary" disabled>
            Create Room
          </Button>
          <Button variant="outline" disabled>
            Join Room
          </Button>
        </div>

        <p class={styles.hint}>
          Try <strong>The Tent</strong> to experience spatial audio with test sounds.
        </p>
      </div>
    </div>
  );
}
