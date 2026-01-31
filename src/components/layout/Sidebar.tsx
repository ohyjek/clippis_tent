/**
 * Sidebar.tsx - Accessible left navigation sidebar
 *
 * Features:
 * - Labeled navigation landmark
 * - aria-current for active page indication
 * - Decorative icons hidden from screen readers
 * - Live region for audio status
 *
 * Routes:
 *   /         -> The Tent (spatial audio demo)
 *   /builder  -> Room Builder (room building tool)
 *   /settings -> Settings page
 */
import { A, useLocation } from "@solidjs/router";
import { audioStore } from "@/stores/audio";
import { useI18n } from "@/lib/i18n";
import styles from "./Sidebar.module.css";

interface NavItem {
  path: string;
  labelKey: "nav.tent" | "nav.builder" | "nav.settings";
  icon: string;
}

/** Navigation items shown in the sidebar */
const navItems: NavItem[] = [
  { path: "/", labelKey: "nav.tent", icon: "🎪" },
  { path: "/builder", labelKey: "nav.builder", icon: "🏗️" },
  { path: "/settings", labelKey: "nav.settings", icon: "⚙️" },
];

export function Sidebar() {
  const [t] = useI18n();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  return (
    <aside class={styles.sidebar} aria-label="Application sidebar">
      <div class={styles.logo}>
        <span class={styles.logoIcon} aria-hidden="true">🎮</span>
        <span class={styles.logoText}>{t("app.name")}</span>
      </div>

      <nav class={styles.nav} aria-label="Main navigation">
        {navItems.map((item) => (
          <A
            href={item.path}
            class={`${styles.navItem} ${isActive(item.path) ? styles.active : ""}`}
            aria-current={isActive(item.path) ? "page" : undefined}
          >
            <span class={styles.navIcon} aria-hidden="true">{item.icon}</span>
            <span>{t(item.labelKey)}</span>
          </A>
        ))}
      </nav>

      <div class={styles.footer}>
        <div class={styles.status} role="status" aria-live="polite">
          <span
            class={`${styles.statusDot} ${
              audioStore.audioInitialized() ? styles.statusActive : ""
            }`}
            aria-hidden="true"
          />
          <span class={styles.statusText}>
            {audioStore.audioInitialized() ? t("status.audioActive") : t("status.audioInactive")}
          </span>
        </div>
      </div>
    </aside>
  );
}
