import { For } from "solid-js";
import styles from "./Tabs.module.css";

interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

/**
 * Tabs - Horizontal tab navigation component
 * 
 * Used for switching between different views or demos within a page.
 */
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
