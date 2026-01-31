/**
 * vite-env.d.ts - Vite environment type declarations
 *
 * Provides TypeScript types for:
 * - import.meta.env.DEV / PROD / MODE
 * - Vite client types
 */
/// <reference types="vite/client" />

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface ImportMetaEnv {
  readonly DEV: boolean;
  readonly PROD: boolean;
  readonly MODE: string;
}
