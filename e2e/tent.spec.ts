/**
 * tent.spec.ts - E2E tests for The Tent page
 *
 * Tests the spatial audio playground functionality.
 */
import { test, expect } from "@playwright/test";

test.describe("The Tent Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tent");
  });

  test("should display The Tent heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /the tent/i })).toBeVisible();
  });

  test("should display tab navigation", async ({ page }) => {
    // Check for the three demo tabs
    await expect(page.getByRole("button", { name: /listener/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /speaker/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /room/i })).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    // Click Speaker tab
    await page.click("button:has-text('Speaker')");

    // Verify Speaker tab is now active (has active class)
    const speakerTab = page.getByRole("button", { name: /speaker/i });
    await expect(speakerTab).toHaveClass(/active/);
  });

  test("should display room visualization", async ({ page }) => {
    // Look for the room container
    const room = page.locator("[class*='room']");
    await expect(room.first()).toBeVisible();
  });

  test("should display listener icon in the room", async ({ page }) => {
    // Look for listener (headphones emoji)
    await expect(page.getByText("🎧")).toBeVisible();
  });

  test("should display play button", async ({ page }) => {
    // Check for play button in the controls
    const playButton = page.getByRole("button", { name: /play/i });
    await expect(playButton).toBeVisible();
  });

  test("should have interactive room elements", async ({ page }) => {
    // The room should be clickable/interactive
    const room = page.locator("[class*='room']").first();
    await expect(room).toBeVisible();

    // Clicking the room should trigger some interaction
    // (In the actual app, this initializes audio)
    await room.click();
  });
});
