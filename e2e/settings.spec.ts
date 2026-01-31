/**
 * settings.spec.ts - E2E tests for the Settings page
 *
 * Tests the audio settings configuration.
 */
import { test, expect } from "@playwright/test";

test.describe("Settings Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
  });

  test("should display settings page heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();
  });

  test("should display audio device section", async ({ page }) => {
    await expect(page.getByText("Audio Devices")).toBeVisible();
  });

  test("should have output device selector", async ({ page }) => {
    // Look for output device dropdown
    await expect(page.getByText("Output Device")).toBeVisible();
    const selects = page.getByRole("combobox");
    await expect(selects.first()).toBeVisible();
  });

  test("should display audio processing section", async ({ page }) => {
    await expect(page.getByText("Audio Processing")).toBeVisible();
  });

  test("should have spatial audio toggle", async ({ page }) => {
    await expect(page.getByText("Spatial Audio")).toBeVisible();
    const checkbox = page.getByRole("checkbox").first();
    await expect(checkbox).toBeVisible();
  });

  test("should toggle spatial audio setting", async ({ page }) => {
    const checkbox = page.getByRole("checkbox").first();
    const initialState = await checkbox.isChecked();

    // Click to toggle
    await checkbox.click();

    // Verify state changed
    const newState = await checkbox.isChecked();
    expect(newState).not.toBe(initialState);
  });

  test("should display master volume slider", async ({ page }) => {
    await expect(page.getByText("Master Volume")).toBeVisible();
    const slider = page.getByRole("slider");
    await expect(slider).toBeVisible();
  });

  test("should adjust master volume", async ({ page }) => {
    const slider = page.getByRole("slider");

    // Change the value - verifies slider is interactive
    await slider.fill("0.5");
    await expect(slider).toBeVisible();
  });
});
