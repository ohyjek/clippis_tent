/**
 * playwright.config.ts - Playwright E2E test configuration
 *
 * Configures Playwright for testing the Electron app.
 * Tests are located in the e2e/ directory.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Note: For full Electron E2E testing, we'd need electron-playwright
  // This config is set up for web-based testing of the renderer
  webServer: {
    command: "pnpm start",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
