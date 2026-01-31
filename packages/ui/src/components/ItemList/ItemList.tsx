/**
 * ItemList.tsx - Selectable list with color swatches
 *
 * Displays a vertical list of items, each with an optional color swatch
 * and label. Supports single selection with visual feedback.
 *
 * @example
 * <ItemList
 *   items={speakers.map(s => ({ id: s.id, label: s.name, color: s.color }))}
 *   selected={selectedId()}
 *   onSelect={(id) => setSelectedId(id)}
 * />
 */
import { For, Show, type JSX } from "solid-js";
import styles from "./ItemList.module.css";

export interface ItemListItem {
  /** Unique identifier for the item */
  id: string;
  /** Display label */
  label: string;
  /** Optional color swatch */
  color?: string;
  /** Optional icon to display after label */
  icon?: string;
}

export interface ItemListProps {
  /** Array of items to display */
  items: ItemListItem[];
  /** ID of the currently selected item */
  selected?: string | null;
  /** Callback when an item is clicked */
  onSelect: (id: string) => void;
  /** Optional placeholder shown when items array is empty */
  emptyText?: string;
  /** Optional aria-label for the list */
  label?: string;
}

export function ItemList(props: ItemListProps): JSX.Element {
  return (
    <Show
      when={props.items.length > 0}
      fallback={
        props.emptyText ? (
          <div class={styles.emptyState}>{props.emptyText}</div>
        ) : null
      }
    >
      <div
        class={styles.list}
        role="listbox"
        aria-label={props.label ?? "Item list"}
      >
        <For each={props.items}>
          {(item) => (
            <button
              type="button"
              class={`${styles.item} ${props.selected === item.id ? styles.selected : ""}`}
              onClick={() => props.onSelect(item.id)}
              role="option"
              aria-selected={props.selected === item.id}
            >
              <Show when={item.color}>
                <span
                  class={styles.swatch}
                  style={{ background: item.color }}
                  aria-hidden="true"
                />
              </Show>
              <span class={styles.label}>
                {item.label}
                <Show when={item.icon}>
                  <span aria-hidden="true"> {item.icon}</span>
                </Show>
              </span>
            </button>
          )}
        </For>
      </div>
    </Show>
  );
}
