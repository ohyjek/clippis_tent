/**
 * vitest.config.ts - Test runner configuration
 *
 * Configures Vitest for unit testing.
 * Tests are in src/**\/*.test.ts files.
 * Run with: pnpm test
 */
// eslint-disable-next-line import/no-unresolved
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
