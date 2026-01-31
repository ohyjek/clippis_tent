/**
 * Tent.tsx - The Tent page (main spatial audio playground)
 *
 * Contains three tabbed demos:
 * - Listener: Move around and hear how distance/panning affects sound
 * - Speaker Direction: See how facing direction affects who hears you
 * - Room Boundaries: See how walls attenuate sound between rooms
 *
 * This is the home page (/) of the app.
 */
import { createSignal, Match, Switch } from "solid-js";
import { TentRoom, SpeakerDemo, RoomDemo } from "@/components/audio";
import { Tabs } from "@/components/ui";
import styles from "./Tent.module.css";

/** Tab definitions for the demo switcher */
const DEMO_TABS = [
  { id: "listener", label: "Listener", icon: "🎧" },
  { id: "speaker", label: "Speaker Direction", icon: "🎙️" },
  { id: "rooms", label: "Room Boundaries", icon: "🚪" },
];

export function Tent() {
  const [activeTab, setActiveTab] = createSignal("listener");

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>The Tent</h1>
        <p class={styles.subtitle}>
          Explore spatial audio concepts through interactive demos
        </p>
      </header>

      <Tabs
        tabs={DEMO_TABS}
        activeTab={activeTab()}
        onTabChange={setActiveTab}
      />

      <Switch>
        <Match when={activeTab() === "listener"}>
          <TentRoom />
        </Match>
        <Match when={activeTab() === "speaker"}>
          <SpeakerDemo />
        </Match>
        <Match when={activeTab() === "rooms"}>
          <RoomDemo />
        </Match>
      </Switch>
    </div>
  );
}
