/**
 * tent.spec.ts - E2E tests for The Tent page
 *
 * Tests the spatial audio demo functionality.
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

  test("should display canvas visualization", async ({ page }) => {
    // Look for the main canvas area (has grid overlay)
    const canvas = page.locator("[class*='canvas']");
    await expect(canvas.first()).toBeVisible();
  });

  test("should display listener icon in the canvas", async ({ page }) => {
    // Look for listener element (Speaker component with 🎧 icon)
    const listener = page.locator("text=🎧");
    await expect(listener.first()).toBeVisible();
  });

  test("should display toolbar with controls", async ({ page }) => {
    // Check for toolbar labels (use exact match to avoid "Distance Model" matching "Mode")
    await expect(page.getByText("Mode", { exact: true })).toBeVisible();
    await expect(page.getByText("Speakers", { exact: true })).toBeVisible();
    await expect(page.getByText("Volume", { exact: true })).toBeVisible();

    // Check for specific buttons in the toolbar
    await expect(page.getByRole("button", { name: /select/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /draw room/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /add speaker/i })).toBeVisible();
  });

  test("should display play button in speaker panel", async ({ page }) => {
    // Play button is in the speaker properties panel (per-speaker control)
    // The accessible name is "Play" (icon is aria-hidden)
    const playButton = page.getByRole("button", { name: /^play$/i });
    await expect(playButton).toBeVisible();
  });

  test("should have interactive canvas", async ({ page }) => {
    // The canvas should be clickable/interactive
    const canvas = page.locator("[class*='canvas']").first();
    await expect(canvas).toBeVisible();

    // Clicking the canvas should work (initializes audio in the app)
    await canvas.click();
  });

  test("should display speaker properties panel", async ({ page }) => {
    // The speaker properties panel should be visible (there's always at least one speaker)
    await expect(page.getByText("Speaker Properties")).toBeVisible();
  });

  test("should display audio settings panel", async ({ page }) => {
    // The audio settings panel with distance model, max distance, and rear gain
    await expect(page.getByText("Audio Settings")).toBeVisible();
    await expect(page.getByText("Distance Model")).toBeVisible();
    await expect(page.getByText("Max Distance")).toBeVisible();
    await expect(page.getByText("Rear Gain Floor")).toBeVisible();
  });
});
