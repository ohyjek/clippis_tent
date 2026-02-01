/**
 * vitest.config.ts - Test runner configuration
 *
 * Configures Vitest for unit testing across the monorepo.
 *
 * Test locations:
 * - src/**\/*.test.ts      - App hooks and utilities
 * - packages/ui/**\/*.test.tsx - UI component tests
 *
 * Scripts:
 * - pnpm test          - Run all tests once
 * - pnpm test:watch    - Watch mode
 * - pnpm test:coverage - With coverage report
 * - pnpm test:hooks    - Run only hook tests
 * - pnpm test:spatial  - Run only spatial audio tests
 *
 * Performance optimizations:
 * - Thread pool for parallel execution
 * - 5s timeout catches hanging tests
 * - Global mocks for Electron APIs (logger, ipc)
 * - Solid-js deduplication prevents multiple instance issues
 */
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";
import solid from "vite-plugin-solid";
import path from "path";

// Helper to create absolute paths
const resolver = (dir: string) => path.resolve(__dirname, dir);

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
      "solid-js/web": resolver("node_modules/solid-js/web"),
      "solid-js/store": resolver("node_modules/solid-js/store"),
      "solid-js": resolver("node_modules/solid-js"),
      // Resolve UI package to source for better DX
      "@clippis/ui": resolver("packages/ui/src"),
      "@clippis/types": resolver("packages/types/src"),
      // App source alias
      "@src/": resolver("src/"),
      "@src": resolver("src"),
      "@stores": resolver("src/stores"),
      "@lib": resolver("src/lib"),
      "@locales": resolver("src/locales"),
      "@pages": resolver("src/pages"),
      "@assets": resolver("src/assets"),
      "@hooks": resolver("src/hooks"),
      "@types": resolver("src/types"),
      "@utils": resolver("src/utils"),
      "@styles": resolver("src/styles"),
    },
  },
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "packages/ui/src/**/*.test.tsx"],
    environment: "jsdom",
    // Setup files: app-level mocks + UI component mocks
    setupFiles: ["./src/test/setup.ts", "./packages/ui/test/setup.ts"],
    // Performance: use threads pool for faster parallel execution
    pool: "threads",
    // Catch hanging tests early (5s per test, 10s per hook)
    testTimeout: 5000,
    hookTimeout: 10000,
    // Faster test isolation
    isolate: true,
    // Silence the "multiple instances" warning - we've deduplicated above
    silent: false,
    onConsoleLog(log) {
      // Filter out known warnings that are false positives in test isolation
      if (log.includes("multiple instances of Solid")) return false;
      if (log.includes("computations created outside")) return false;
      if (log.includes("electron-log")) return false;
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
