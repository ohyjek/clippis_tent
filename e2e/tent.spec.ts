/**
 * tent.spec.ts - E2E tests for The Tent page
 *
 * Tests the spatial audio playground functionality.
 * The Tent is the home page at route "/"
 */
import { test, expect } from "@playwright/test";

test.describe("The Tent Page", () => {
  test.beforeEach(async ({ page }) => {
    // The Tent is the home page
    await page.goto("/");
  });

  test("should display The Tent heading", async ({ page }) => {
    // Use h1 specifically to avoid matching other headings
    await expect(page.locator("h1")).toContainText(/the tent/i);
  });

  test("should display tab navigation", async ({ page }) => {
    // Check for the tablist and tabs (using role="tab" for accessibility)
    await expect(page.getByRole("tablist")).toBeVisible();
    await expect(page.getByRole("tab", { name: /full demo/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /listener/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /speaker/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /room/i })).toBeVisible();
  });

  test("should switch between tabs", async ({ page }) => {
    // Click Speaker tab
    await page.getByRole("tab", { name: /speaker/i }).click();

    // Verify Speaker tab is now selected
    const speakerTab = page.getByRole("tab", { name: /speaker/i });
    await expect(speakerTab).toHaveAttribute("aria-selected", "true");
  });

  test("should display room visualization", async ({ page }) => {
    // Look for the room container
    const room = page.locator("[class*='room']");
    await expect(room.first()).toBeVisible();
  });

  test("should display listener icon in the room", async ({ page }) => {
    // Look for listener element in the room (using Speaker component with 🎧 icon)
    const listenerInRoom = page.locator("[class*='speaker']").filter({ hasText: "🎧" });
    await expect(listenerInRoom.first()).toBeVisible();
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
