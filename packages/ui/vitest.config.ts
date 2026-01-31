/**
 * vitest.config.ts - Test configuration for @clippis/ui
 *
 * Configures Vitest with jsdom environment for component testing.
 */
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],
  resolve: {
    conditions: ["development", "browser"],
  },
  test: {
    globals: true,
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["./test/setup.ts"],
    server: {
      deps: {
        inline: [/solid-js/],
      },
    },
  },
});
