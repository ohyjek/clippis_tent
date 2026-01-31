/**
 * vitest.config.ts - Test runner configuration
 *
 * Configures Vitest for unit testing.
 * Tests are in src/ and packages/ui/src/.
 * Run with: pnpm test
 */
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import path from "path";

export default defineConfig({
  plugins: [
    solid({
      // Disable hot reload for tests
      hot: false,
    }),
  ],
  resolve: {
    conditions: ["development", "browser"],
    alias: {
      // Ensure single solid-js instance across packages
      "solid-js/web": path.resolve(__dirname, "node_modules/solid-js/web"),
      "solid-js": path.resolve(__dirname, "node_modules/solid-js"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "packages/ui/src/**/*.test.tsx"],
    // Use jsdom for all UI tests
    environment: "jsdom",
    setupFiles: ["./packages/ui/test/setup.ts"],
    server: {
      deps: {
        inline: [/solid-js/],
      },
    },
  },
});
