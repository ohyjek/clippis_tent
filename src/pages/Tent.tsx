import { createSignal, Match, Switch } from "solid-js";
import { TentRoom, SpeakerDemo, RoomDemo } from "@/components/audio";
import { Tabs } from "@/components/ui";
import styles from "./Tent.module.css";

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
