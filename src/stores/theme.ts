/**
 * theme.ts - Theme store for light/dark/system mode
 *
 * Manages the app's color theme with:
 * - System preference detection (prefers-color-scheme)
 * - Manual override (light/dark)
 * - Persistence via localStorage
 * - No flash on load (applied before render)
 *
 * Note: This store avoids createEffect at module level to prevent
 * "computations created outside createRoot" warnings.
 */
import { createSignal } from "solid-js";

/** Available theme modes */
export type ThemeMode = "light" | "dark" | "system";

/** The resolved theme (light or dark, never system) */
export type ResolvedTheme = "light" | "dark";

/**
 * Get the resolved theme based on current mode and system preference
 */
function getResolvedTheme(mode: ThemeMode): ResolvedTheme {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

/**
 * Apply theme to DOM
 */
function applyTheme(resolved: ResolvedTheme): void {
  document.documentElement.dataset.theme = resolved;
}

// Initialize from localStorage or default to system
const storedTheme = localStorage.getItem("theme") as ThemeMode | null;
const initialMode = storedTheme ?? "system";
const initialResolved = getResolvedTheme(initialMode);

// Apply theme immediately on load (before first render) to prevent flash
applyTheme(initialResolved);

// Create signals for reactive access
const [themeMode, setThemeModeInternal] = createSignal<ThemeMode>(initialMode);
const [resolvedTheme, setResolvedTheme] = createSignal<ResolvedTheme>(initialResolved);

/**
 * Set theme mode - handles signal update, DOM update, and persistence
 */
function setThemeMode(mode: ThemeMode): void {
  const resolved = getResolvedTheme(mode);
  
  // Update signals
  setThemeModeInternal(mode);
  setResolvedTheme(resolved);
  
  // Apply to DOM
  applyTheme(resolved);
  
  // Persist preference
  localStorage.setItem("theme", mode);
}

// Listen for system theme changes when in "system" mode
if (typeof window !== "undefined") {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
    if (themeMode() === "system") {
      const resolved = e.matches ? "dark" : "light";
      applyTheme(resolved);
      setResolvedTheme(resolved);
    }
  });
}

/**
 * Theme store exports
 */
export const themeStore = {
  /** Current theme mode setting (light/dark/system) */
  themeMode,
  /** Set the theme mode */
  setThemeMode,
  /** The actual applied theme (light/dark) */
  resolvedTheme,
};
