/**
 * vitest.config.ts - Test configuration for @clippis/ui
 *
 * Configures Vitest with jsdom environment for component testing.
 * Note: Tests are typically run from the root monorepo for better deduplication.
 * This config is for standalone package testing.
 */
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [
    solid({
      hot: false,
    }),
  ],
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      // Deduplicate solid-js by resolving to root node_modules
      "solid-js/web": path.resolve(__dirname, "../../node_modules/solid-js/web"),
      "solid-js/store": path.resolve(__dirname, "../../node_modules/solid-js/store"),
      "solid-js": path.resolve(__dirname, "../../node_modules/solid-js"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    onConsoleLog(log) {
      // Filter out known Solid warnings that are false positives in test environment
      if (log.includes("multiple instances of Solid")) return false;
      if (log.includes("computations created outside")) return false;
      return true;
    },
    server: {
      deps: {
        inline: [/solid-js/, /@solidjs/],
      },
    },
  },
});
