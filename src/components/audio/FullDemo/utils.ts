/**
 * utils.ts - Utility functions for the spatial audio demo
 *
 * Re-exports shared utilities from @/lib/spatial-utils and adds
 * demo-specific helpers like frequency-to-note conversion.
 */

// Re-export shared utilities from central location
export {
  toPercent,
  fromPercent,
  getPositionFromEvent,
  getScreenPosition,
  toCssPosition,
  createWallsFromBounds,
  createRoomFromCorners,
  isValidRoomSize,
  distanceBetween,
  angleBetween,
  normalizeAngle,
  generateId,
  updateItemById,
  DEFAULT_ATTENUATION,
  MIN_ROOM_SIZE,
} from "@/lib/spatial-utils";

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
