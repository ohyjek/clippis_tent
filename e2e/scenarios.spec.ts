/**
 * scenarios.spec.ts - E2E tests for the Scenarios page
 *
 * Tests the preset spatial audio scenario functionality.
 */
import { test, expect } from "@playwright/test";

test.describe("Scenarios Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/scenarios");
  });

  test("should display scenario selector", async ({ page }) => {
    const select = page.getByRole("combobox");
    await expect(select).toBeVisible();
  });

  test("should have multiple scenario options", async ({ page }) => {
    const options = page.locator("select option");
    // Should have at least surround, stereo, distance, campfire, orchestra
    await expect(options).toHaveCount(5);
  });

  test("should change scenario when selecting from dropdown", async ({ page }) => {
    const select = page.getByRole("combobox");

    // Select stereo scenario
    await select.selectOption("stereo");

    // Check that the selection changed
    await expect(select).toHaveValue("stereo");
  });

  test("should display sound source indicators", async ({ page }) => {
    // Look for sound source buttons/indicators in the room visualization
    const sources = page.locator("button").filter({ hasText: /Hz/ });
    await expect(sources.first()).toBeVisible();
  });

  test("should display listener icon", async ({ page }) => {
    // Look for the listener (headphones emoji or icon)
    await expect(page.getByText("🎧")).toBeVisible();
  });

  test("should have play controls", async ({ page }) => {
    // Check for Play All button
    await expect(page.getByRole("button", { name: /play all/i })).toBeVisible();
  });
});
