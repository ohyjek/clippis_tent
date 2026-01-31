/**
 * Panel.tsx - Card-style container with title for sidebars
 *
 * A container component for grouping related content in sidebars.
 * Similar to Section but with styling optimized for sidebar panels.
 *
 * @example
 * <Panel title="Speaker Properties" icon="🎤">
 *   <ColorSwatches ... />
 *   <Slider ... />
 * </Panel>
 */
import { type JSX, Show } from "solid-js";
import styles from "./Panel.module.css";

export interface PanelProps {
  /** Panel heading text */
  title: string;
  /** Optional icon to show before title */
  icon?: string;
  /** Content to render inside the panel */
  children: JSX.Element;
  /** Optional additional CSS class */
  class?: string;
}

export function Panel(props: PanelProps): JSX.Element {
  return (
    <div class={`${styles.panel} ${props.class ?? ""}`}>
      <h4 class={styles.title}>
        <Show when={props.icon}>
          <span aria-hidden="true">{props.icon} </span>
        </Show>
        {props.title}
      </h4>
      {props.children}
    </div>
  );
}
