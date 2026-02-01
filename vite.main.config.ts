/**
 * vite.main.config.ts - Vite config for Electron main process
 *
 * Builds src/main.ts which runs in Node.js and creates the browser window.
 * Used by Electron Forge's Vite plugin.
 */
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    target: "esnext",
    sourcemap: true,
  },
});
