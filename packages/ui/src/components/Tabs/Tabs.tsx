/**
 * Tabs.tsx - Accessible horizontal tab navigation
 *
 * Implements WAI-ARIA Tabs pattern with:
 * - role="tablist", role="tab", aria-selected
 * - Keyboard navigation (Arrow keys, Home, End)
 * - Focus management
 *
 * @example
 * <Tabs
 *   tabs={[{ id: "a", label: "Tab A", icon: "🎧" }]}
 *   activeTab={activeTab()}
 *   onTabChange={setActiveTab}
 *   ariaLabel="Demo options"
 * />
 */
import { For, createSignal } from "solid-js";
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
  /** Accessible label for the tab list */
  ariaLabel?: string;
  /** ID prefix for tab elements (for aria-controls) */
  idPrefix?: string;
}

export function Tabs(props: TabsProps) {
  const tabRefs: HTMLButtonElement[] = [];
  // Track focused index for future keyboard navigation enhancements
  const [, setFocusedIndex] = createSignal(-1);

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    const tabCount = props.tabs.length;
    let newIndex = index;

    switch (e.key) {
      case "ArrowLeft":
        e.preventDefault();
        newIndex = index === 0 ? tabCount - 1 : index - 1;
        break;
      case "ArrowRight":
        e.preventDefault();
        newIndex = index === tabCount - 1 ? 0 : index + 1;
        break;
      case "Home":
        e.preventDefault();
        newIndex = 0;
        break;
      case "End":
        e.preventDefault();
        newIndex = tabCount - 1;
        break;
      default:
        return;
    }

    setFocusedIndex(newIndex);
    tabRefs[newIndex]?.focus();
    props.onTabChange(props.tabs[newIndex].id);
  };

  const prefix = () => props.idPrefix ?? "tab";

  return (
    <div
      class={styles.tabs}
      role="tablist"
      aria-label={props.ariaLabel}
    >
      <For each={props.tabs}>
        {(tab, index) => {
          const isActive = () => props.activeTab === tab.id;
          return (
            <button
              ref={(el) => (tabRefs[index()] = el)}
              id={`${prefix()}-${tab.id}`}
              role="tab"
              aria-selected={isActive()}
              aria-controls={`${prefix()}-panel-${tab.id}`}
              tabIndex={isActive() ? 0 : -1}
              class={`${styles.tab} ${isActive() ? styles.active : ""}`}
              onClick={() => props.onTabChange(tab.id)}
              onKeyDown={(e) => handleKeyDown(e, index())}
              onFocus={() => setFocusedIndex(index())}
            >
              {tab.icon && <span class={styles.icon} aria-hidden="true">{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          );
        }}
      </For>
    </div>
  );
}
