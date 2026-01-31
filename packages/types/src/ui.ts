// ============================================================================
// Form & Input Types
// ============================================================================

/**
 * Option for select/dropdown fields
 */
export interface SelectOption {
  value: string;
  label: string;
}

/**
 * Tab definition for tab components
 */
export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

// ============================================================================
// List Types
// ============================================================================

/**
 * Item for list components
 */
export interface ListItem {
  id: string;
  label: string;
  color?: string;
  icon?: string;
}

// ============================================================================
// Toast/Notification Types
// ============================================================================

/**
 * Toast notification type
 */
export type ToastType = "success" | "error" | "warning" | "info";

/**
 * Toast notification data (base)
 */
export interface ToastData {
  id: string;
  type: ToastType;
  message: string;
}

/**
 * Toast with duration (used in store)
 */
export interface Toast extends ToastData {
  /** Auto-dismiss duration in ms (0 = no auto-dismiss) */
  duration: number;
}

/**
 * Options for creating a toast
 */
export interface ToastOptions {
  type: ToastType;
  message: string;
  /** Duration in ms (default: 4000, 0 = no auto-dismiss) */
  duration?: number;
}

// ============================================================================
// Theme Types
// ============================================================================

/**
 * Theme mode setting
 */
export type ThemeMode = "light" | "dark" | "system";

/**
 * Resolved theme (after system preference applied)
 */
export type ResolvedTheme = "light" | "dark";

// ============================================================================
// Button Types
// ============================================================================

/**
 * Button variant style
 */
export type ButtonVariant = "primary" | "success" | "purple" | "danger" | "outline";

// ============================================================================
// Drawing/Interaction Types
// ============================================================================

/**
 * Drawing mode for canvas interactions
 */
export type DrawingMode = "select" | "draw";

// ============================================================================
// Navigation Types
// ============================================================================

/**
 * Navigation item for sidebar
 */
export interface NavItem {
  path: string;
  labelKey: string;
  icon: string;
}

// ============================================================================
// Device Types
// ============================================================================

/**
 * Audio device info
 */
export interface AudioDevice {
  deviceId: string;
  label: string;
}
