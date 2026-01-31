/**
 * navigation.spec.ts - E2E tests for app navigation
 *
 * Tests the core navigation flows through the sidebar.
 */
import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Note: In a real Electron test, we'd use electron-playwright
    // This assumes a web server is running for development
    await page.goto("/");
  });

  test("should display the sidebar with navigation items", async ({ page }) => {
    // Check sidebar nav exists
    await expect(page.locator("nav")).toBeVisible();

    // Check navigation links (specifically in the nav element)
    const nav = page.locator("nav");
    await expect(nav.getByText("The Tent")).toBeVisible();
    await expect(nav.getByText("Settings")).toBeVisible();
  });

  test("should navigate to The Tent page", async ({ page }) => {
    await page.click("text=The Tent");
    // The Tent is the home page at "/"
    await expect(page).toHaveURL(/\/$/);
    // Check for tent-specific content (h1 heading)
    await expect(page.locator("h1")).toContainText(/the tent/i);
  });

  test("should navigate to Settings page", async ({ page }) => {
    await page.click("text=Settings");
    await expect(page).toHaveURL(/.*settings/i);
    // Check for settings sections
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });
});
