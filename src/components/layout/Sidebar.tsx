/**
 * Sidebar.tsx - Left navigation sidebar
 *
 * Shows the app logo, navigation links, and audio status indicator.
 * Highlights the currently active route.
 * Uses i18n for all user-facing strings.
 *
 * Routes:
 *   /          -> The Tent (spatial audio demos)
 *   /scenarios -> Scenarios (preset audio configs)
 *   /voice     -> Voice Room (coming soon)
 *   /settings  -> Settings page
 */
import { A, useLocation } from "@solidjs/router";
import { audioStore } from "@/stores/audio";
import { useI18n } from "@/lib/i18n";
import styles from "./Sidebar.module.css";

interface NavItem {
  path: string;
  labelKey: "nav.tent" | "nav.scenarios" | "nav.voiceRoom" | "nav.settings";
  icon: string;
}

/** Navigation items shown in the sidebar */
const navItems: NavItem[] = [
  { path: "/", labelKey: "nav.tent", icon: "🎪" },
  { path: "/scenarios", labelKey: "nav.scenarios", icon: "🎬" },
  { path: "/voice", labelKey: "nav.voiceRoom", icon: "🎙️" },
  { path: "/settings", labelKey: "nav.settings", icon: "⚙️" },
];

export function Sidebar() {
  const [t] = useI18n();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside class={styles.sidebar}>
      <div class={styles.logo}>
        <span class={styles.logoIcon}>🎮</span>
        <span class={styles.logoText}>{t("app.name")}</span>
      </div>

      <nav class={styles.nav}>
        {navItems.map((item) => (
          <A
            href={item.path}
            class={`${styles.navItem} ${isActive(item.path) ? styles.active : ""}`}
          >
            <span class={styles.navIcon}>{item.icon}</span>
            <span>{t(item.labelKey)}</span>
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
            {audioStore.audioInitialized() ? t("status.audioActive") : t("status.audioInactive")}
          </span>
        </div>
      </div>
    </aside>
  );
}
