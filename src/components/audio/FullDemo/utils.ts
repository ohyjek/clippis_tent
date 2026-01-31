/**
 * utils.ts - Utility functions for the spatial audio demo
 *
 * Contains helper functions for room creation, coordinate conversion, and audio.
 */
import type { Position, Wall, DrawnRoom } from "./context/types";
import { FREQUENCY_NOTES, DEFAULT_ATTENUATION } from "./constants";

/**
 * Get closest note name for a frequency
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
 * Create walls from rectangular bounds
 * @param bounds - Rectangle with center position and dimensions
 * @returns Array of four wall segments
 */
export function createWallsFromBounds(bounds: {
  x: number;
  y: number;
  width: number;
  height: number;
}): Wall[] {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const left = bounds.x - halfW;
  const right = bounds.x + halfW;
  const top = bounds.y - halfH;
  const bottom = bounds.y + halfH;

  return [
    { start: { x: left, y: top }, end: { x: right, y: top } },
    { start: { x: right, y: top }, end: { x: right, y: bottom } },
    { start: { x: right, y: bottom }, end: { x: left, y: bottom } },
    { start: { x: left, y: bottom }, end: { x: left, y: top } },
  ];
}

/**
 * Create room from two corner positions (for drag-to-draw)
 * @param start - First corner position
 * @param end - Second corner position
 * @param id - Unique room identifier
 * @param color - Room color
 * @returns Complete DrawnRoom object
 */
export function createRoomFromCorners(
  start: Position,
  end: Position,
  id: string,
  color: string
): DrawnRoom {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  const width = maxX - minX;
  const height = maxY - minY;
  const center = { x: minX + width / 2, y: minY + height / 2 };

  const bounds = { x: center.x, y: center.y, width, height };
  const walls = createWallsFromBounds(bounds);

  return {
    id,
    label: `Room ${id.slice(-4)}`,
    bounds,
    walls,
    center,
    color,
    attenuation: DEFAULT_ATTENUATION,
  };
}

/**
 * Convert room coordinates to percentage for rendering
 * Room coordinates range from -2.5 to 2.5, mapped to 0-100%
 * @param val - Room coordinate value
 * @returns Percentage value for CSS
 */
export function toPercent(val: number): number {
  return 50 + val * 20;
}

/**
 * Convert mouse event to room coordinates
 * @param e - Mouse event
 * @param roomRef - Reference to the room container element
 * @returns Position in room coordinates
 */
export function getPositionFromEvent(e: MouseEvent, roomRef: HTMLDivElement | undefined): Position {
  if (!roomRef) return { x: 0, y: 0 };
  const rect = roomRef.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
  const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
  return {
    x: Math.max(-2.4, Math.min(2.4, x)),
    y: Math.max(-2.4, Math.min(2.4, y)),
  };
}

/**
 * Get screen position for angle calculations
 * @param pos - Room position
 * @param roomRef - Reference to the room container element
 * @returns Screen coordinates
 */
export function getScreenPosition(
  pos: Position,
  roomRef: HTMLDivElement | undefined
): { x: number; y: number } {
  if (!roomRef) return { x: 0, y: 0 };
  const rect = roomRef.getBoundingClientRect();
  return {
    x: rect.left + (0.5 + pos.x * 0.2) * rect.width,
    y: rect.top + (0.5 + pos.y * 0.2) * rect.height,
  };
}
