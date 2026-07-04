/**
 * utils.ts - Utility functions for the spatial audio demo
 *
 * Re-exports commonly used utilities from @/lib/spatial-utils
 * and provides demo-specific helpers.
 */

// Re-export only what's actually used by demo components
export {
  DEFAULT_ATTENUATION,
  getPositionFromEvent,
  getScreenPosition,
  sizeToPercent,
  toPercent,
} from "@lib/spatial-utils";

import { DEFAULT_ATTENUATION, isSpeakerInsideRoom } from "@lib/spatial-utils";
import type { DrawnRoom, Position } from "@tentchat/types";
import { FREQUENCY_NOTES, OBSERVER_ID } from "./constants";

/**
 * Effective wall attenuation for a set of positions, given the drawn rooms.
 *
 * Uses the MAXIMUM attenuation among all rooms containing any of the given
 * positions. This ensures a fully-blocking inner room can't be "diluted" by
 * adding a less-blocking outer room around it. Room attenuations are clamped
 * to [0, 1].
 *
 * If no room contains any of the positions, returns `fallback` so that walls
 * still block sound properly.
 *
 * @param rooms - Drawn rooms to test against
 * @param positions - Position(s) whose containing rooms should count
 * @param fallback - Attenuation when no room contains any position
 * @returns Effective attenuation in [0, 1]
 */
export function maxWallAttenuationAt(
  rooms: readonly DrawnRoom[],
  positions: readonly Position[],
  fallback: number = DEFAULT_ATTENUATION
): number {
  let maxAttenuation = -1;
  for (const room of rooms) {
    if (positions.some((position) => isSpeakerInsideRoom(room, { position }))) {
      const attenuation = Math.min(1, Math.max(0, room.attenuation));
      maxAttenuation = Math.max(maxAttenuation, attenuation);
    }
  }
  return maxAttenuation >= 0 ? maxAttenuation : fallback;
}

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

/**
 * Display name for a speaker by id — single source for the panels' labels.
 *
 * @param speakers - Current speaker list (index order defines "Speaker N")
 * @param speakerId - Speaker to name
 * @param observerLabel - Wording for the observer entry (varies by panel)
 */
export function getSpeakerDisplayName(
  speakers: readonly { id: string }[],
  speakerId: string,
  observerLabel = "Observer"
): string {
  if (speakerId === OBSERVER_ID) return observerLabel;
  const index = speakers.findIndex((s) => s.id === speakerId);
  return index >= 0 ? `Speaker ${index}` : "Unknown";
}
