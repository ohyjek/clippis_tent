/**
 * utils.ts - Utility functions for the spatial audio demo
 *
 * Re-exports commonly used utilities from @/lib/spatial-utils
 * and provides demo-specific helpers.
 */

// Re-export only what's actually used by demo components
export {
  toPercent,
  getPositionFromEvent,
  getScreenPosition,
  DEFAULT_ATTENUATION,
} from "@lib/spatial-utils";

import { FREQUENCY_NOTES } from "./constants";

/**
 * Get closest note name for a frequency
 *
 * @param frequency - Frequency in Hz
 * @returns Musical note name (e.g., "A4")
 */
export function getNoteName(frequency: number): string {
  let closest = 440;
  let minDiff = Math.abs(frequency - 440);

  for (const freq of Object.keys(FREQUENCY_NOTES).map(Number)) {
    const diff = Math.abs(frequency - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = freq;
    }
  }

  return FREQUENCY_NOTES[closest] ?? "A4";
}
