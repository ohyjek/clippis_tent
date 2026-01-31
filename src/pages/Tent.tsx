/**
 * Tent.tsx - The Tent page (main spatial audio playground)
 *
 * Contains four tabbed demos showcasing different spatial audio concepts:
 * - Full Demo: Complete experience with listener, speakers, and rooms (default)
 * - Listener: Move around and hear how distance/panning affects sound
 * - Speaker Direction: See how facing direction affects who hears you
 * - Room Boundaries: See how walls attenuate sound between rooms
 *
 * This is the home page (/) of the app.
 */
import { createSignal, Match, Switch } from "solid-js";
import { FullDemo, TentRoom, SpeakerDemo, RoomDemo } from "@/components/audio";
import { Tabs } from "@/components/ui";
import styles from "./Tent.module.css";

/** Tab definitions for the demo switcher - Full Demo is first/default */
const DEMO_TABS = [
  { id: "full", label: "Full Demo", icon: "🎪" },
  { id: "listener", label: "Listener", icon: "🎧" },
  { id: "speaker", label: "Speaker", icon: "🎙️" },
  { id: "rooms", label: "Rooms", icon: "🚪" },
];

export function Tent() {
  const [activeTab, setActiveTab] = createSignal("full");

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
        ariaLabel="Demo selection tabs"
      />

      <Switch>
        <Match when={activeTab() === "full"}>
          <FullDemo />
        </Match>
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
