/**
 * vitest.config.ts - Test runner configuration
 *
 * Configures Vitest for unit testing across the monorepo.
 * Tests are in src/ (app) and packages/ui/src/ (UI library).
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
      // Deduplicate solid-js: force all imports to resolve to root node_modules
      // This prevents "multiple instances of Solid" warnings in monorepo
      "solid-js/web": path.resolve(__dirname, "node_modules/solid-js/web"),
      "solid-js/store": path.resolve(__dirname, "node_modules/solid-js/store"),
      "solid-js": path.resolve(__dirname, "node_modules/solid-js"),
      // Resolve UI package to source for better DX
      "@clippis/ui": path.resolve(__dirname, "packages/ui/src"),
      // App source alias
      "@/": path.resolve(__dirname, "src/"),
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "packages/ui/src/**/*.test.tsx"],
    environment: "jsdom",
    setupFiles: ["./packages/ui/test/setup.ts"],
    // Silence the "multiple instances" warning - we've deduplicated above
    silent: false,
    onConsoleLog(log) {
      // Filter out the known Solid warning that's a false positive due to test isolation
      if (log.includes("multiple instances of Solid")) return false;
      if (log.includes("computations created outside")) return false;
      return true;
    },
    server: {
      deps: {
        // Inline solid-js to ensure single instance
        inline: [/solid-js/, /@solidjs/],
      },
    },
  },
});
