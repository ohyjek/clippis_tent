import { JSX } from "solid-js";
import styles from "./Section.module.css";

interface SectionProps {
  title: string;
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
