/**
 * playwright.config.ts - Playwright E2E test configuration
 *
 * Configures Playwright for testing the Electron app's renderer process.
 * Tests are located in the e2e/ directory.
 *
 * Note: For full Electron E2E testing, we'd need electron-playwright.
 * This config tests the web renderer via the Vite dev server.
 */
import { defineConfig, devices } from "@playwright/test";

const BASE_URL = "http://localhost:5173";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    // Base URL for all tests - allows using relative paths like "/settings"
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm start",
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
