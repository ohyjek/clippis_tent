/**
 * Section.tsx - Card-style container with a title heading
 *
 * Used to group related controls with consistent styling.
 * Provides padding, background, and border radius.
 *
 * @example
 * <Section title="Audio Devices">
 *   <SelectField ... />
 * </Section>
 */
import { JSX } from "solid-js";
import styles from "./Section.module.css";

interface SectionProps {
  /** Section heading text */
  title: string;
  /** Content to render inside the section */
  children: JSX.Element;
}

export function Section(props: SectionProps) {
  return (
    <section class={styles.section}>
      <h2 class={styles.title}>{props.title}</h2>
      {props.children}
    </section>
  );
}
