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
    // Check sidebar exists
    await expect(page.locator("nav")).toBeVisible();

    // Check navigation links
    await expect(page.getByText("The Tent")).toBeVisible();
    await expect(page.getByText("Scenarios")).toBeVisible();
    await expect(page.getByText("Voice Room")).toBeVisible();
    await expect(page.getByText("Settings")).toBeVisible();
  });

  test("should navigate to The Tent page", async ({ page }) => {
    await page.click("text=The Tent");
    await expect(page).toHaveURL(/.*tent/i);
    // Check for tent-specific content
    await expect(page.getByRole("heading", { name: /the tent/i })).toBeVisible();
  });

  test("should navigate to Scenarios page", async ({ page }) => {
    await page.click("text=Scenarios");
    await expect(page).toHaveURL(/.*scenarios/i);
    // Check for scenario dropdown
    await expect(page.getByRole("combobox")).toBeVisible();
  });

  test("should navigate to Settings page", async ({ page }) => {
    await page.click("text=Settings");
    await expect(page).toHaveURL(/.*settings/i);
    // Check for settings sections
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("should navigate to Voice Room page", async ({ page }) => {
    await page.click("text=Voice Room");
    await expect(page).toHaveURL(/.*voice/i);
    // Voice room is a placeholder, so just check it loads
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
