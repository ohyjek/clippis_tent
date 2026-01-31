/**
 * vite.preload.config.ts - Vite config for Electron preload script
 *
 * Builds src/preload.ts which runs before the renderer loads.
 * Used to safely expose Node.js APIs to the renderer via contextBridge.
 */
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
  },
});
