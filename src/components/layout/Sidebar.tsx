import { A, useLocation } from "@solidjs/router";
import { audioStore } from "../../stores/audio";
import styles from "./Sidebar.module.css";

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: "/", label: "Audio Room", icon: "🎧" },
  { path: "/settings", label: "Settings", icon: "⚙️" },
];

export function Sidebar() {
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside class={styles.sidebar}>
      <div class={styles.logo}>
        <span class={styles.logoIcon}>🎮</span>
        <span class={styles.logoText}>Clippis</span>
      </div>

      <nav class={styles.nav}>
        {navItems.map((item) => (
          <A
            href={item.path}
            class={`${styles.navItem} ${isActive(item.path) ? styles.active : ""}`}
          >
            <span class={styles.navIcon}>{item.icon}</span>
            <span>{item.label}</span>
          </A>
        ))}
      </nav>

      <div class={styles.footer}>
        <div class={styles.status}>
          <span
            class={`${styles.statusDot} ${
              audioStore.audioInitialized() ? styles.statusActive : ""
            }`}
          />
          <span class={styles.statusText}>
            {audioStore.audioInitialized() ? "Audio Active" : "Audio Inactive"}
          </span>
        </div>
      </div>
    </aside>
  );
}
