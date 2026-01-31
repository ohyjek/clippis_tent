/**
 * Tabs.tsx - Horizontal tab navigation for switching views
 *
 * Each tab can have an optional icon (emoji).
 *
 * @example
 * <Tabs
 *   tabs={[{ id: "a", label: "Tab A", icon: "🎧" }]}
 *   activeTab={activeTab()}
 *   onTabChange={setActiveTab}
 * />
 */
import { For } from "solid-js";
import styles from "./Tabs.module.css";

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  /** Array of tab definitions */
  tabs: Tab[];
  /** ID of the currently active tab */
  activeTab: string;
  /** Called when a tab is clicked */
  onTabChange: (id: string) => void;
}

export function Tabs(props: TabsProps) {
  return (
    <div class={styles.tabs}>
      <For each={props.tabs}>
        {(tab) => (
          <button
            class={`${styles.tab} ${props.activeTab === tab.id ? styles.active : ""}`}
            onClick={() => props.onTabChange(tab.id)}
          >
            {tab.icon && <span class={styles.icon}>{tab.icon}</span>}
            <span>{tab.label}</span>
          </button>
        )}
      </For>
    </div>
  );
}
