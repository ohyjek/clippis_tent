/**
 * vite-env.d.ts - Vite environment type declarations
 *
 * Provides TypeScript types for:
 * - import.meta.env.DEV / PROD / MODE
 * - Vite client types
 */
/// <reference types="vite/client" />

// import.meta.env types come from vite/client; this file is a module (it has
// exports), so local ImportMeta interfaces here would be dead code, not global
// augmentation.

/** Electron APIs exposed via preload (only in Electron app) */
export interface ElectronAPI {
  getHardwareAccelerationDisabled: () => Promise<boolean>;
  setHardwareAccelerationDisabled: (disabled: boolean) => Promise<void>;
}

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}
