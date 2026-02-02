/**
 * spatial-utils.ts - Coordinate and geometry utilities for spatial audio
 *
 * Single source of truth for:
 * - Coordinate conversion (room ↔ screen ↔ percentage)
 * - Room/wall geometry creation
 * - Distance and angle calculations
 * - ID generation
 *
 * The coordinate system uses:
 * - Origin (0,0) at center
 * - Room coordinates typically -2.5 to 2.5
 * - X increases to the right
 * - Y increases downward
 */

import type { Position, Wall, Bounds, DrawnRoom, SpeakerState } from "@clippis/types";
import { createUniqueId } from "solid-js";

// ============================================================================
// CONSTANTS
// ============================================================================

/** Default wall attenuation (0=transparent, 1=fully blocking) */
export const DEFAULT_ATTENUATION = 0.5;

/** Minimum room size threshold for drawing */
export const MIN_ROOM_SIZE = 0.2;

// ============================================================================
// ID GENERATION
// ============================================================================

/**
 * Generate a unique ID using SolidJS createUniqueId
 *
 * @returns Unique ID string
 */
export function generateId(): string {
  return createUniqueId();
}

// ============================================================================
// COORDINATE CONVERSION
// ============================================================================

/**
 * Convert room coordinates to percentage for rendering
 *
 * Maps room coordinates (-2.5 to 2.5) to CSS percentage (0-100%)
 * Center (0,0) maps to 50%
 *
 * @param val - Room coordinate value
 * @returns Percentage value for CSS positioning
 */
export function toPercent(val: number): number {
  return 50 + val * 20;
}

/**
 * Convert percentage to room coordinates
 *
 * Inverse of toPercent
 *
 * @param percent - CSS percentage value
 * @returns Room coordinate value
 */
export function fromPercent(percent: number): number {
  return (percent - 50) / 20;
}

/**
 * Convert mouse event to room coordinates
 *
 * Takes a mouse event and the container element, returns the position
 * in room coordinate space (clamped to valid range).
 *
 * @param e - Mouse event
 * @param containerRef - Reference to the container element
 * @param clamp - Whether to clamp coordinates (default: true)
 * @returns Position in room coordinates
 */
export function getPositionFromEvent(
  e: MouseEvent,
  containerRef: HTMLElement | undefined,
  clamp = true
): Position {
  if (!containerRef) return { x: 0, y: 0 };

  const rect = containerRef.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
  const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;

  if (clamp) {
    return {
      x: Math.max(-2.4, Math.min(2.4, x)),
      y: Math.max(-2.4, Math.min(2.4, y)),
    };
  }

  return { x, y };
}

/**
 * Convert room position to screen coordinates
 *
 * Useful for calculating angles for rotation interactions.
 *
 * @param pos - Room position
 * @param containerRef - Reference to the container element
 * @returns Screen coordinates (pixels)
 */
export function getScreenPosition(
  pos: Position,
  containerRef: HTMLElement | undefined
): { x: number; y: number } {
  if (!containerRef) return { x: 0, y: 0 };

  const rect = containerRef.getBoundingClientRect();
  return {
    x: rect.left + (0.5 + pos.x * 0.2) * rect.width,
    y: rect.top + (0.5 + pos.y * 0.2) * rect.height,
  };
}

/**
 * Convert room position to CSS position object
 *
 * Returns an object suitable for inline styles.
 *
 * @param pos - Room position
 * @returns CSS position object with left and top as percentages
 */
export function toCssPosition(pos: Position): { left: string; top: string } {
  return {
    left: `${toPercent(pos.x)}%`,
    top: `${toPercent(pos.y)}%`,
  };
}

// ============================================================================
// GEOMETRY CALCULATIONS
// ============================================================================

/**
 * Calculate distance between two positions
 *
 * @param a - First position
 * @param b - Second position
 * @returns Euclidean distance
 */
export function distanceBetween(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate angle from one position to another
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Angle in radians (0 = right, PI/2 = down)
 */
export function angleBetween(from: Position, to: Position): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * Normalize angle to range [-PI, PI]
 *
 * @param angle - Angle in radians
 * @returns Normalized angle
 */
export function normalizeAngle(angle: number): number {
  return Math.atan2(Math.sin(angle), Math.cos(angle));
}

// ============================================================================
// ROOM/WALL GEOMETRY
// ============================================================================

/**
 * Create walls from rectangular bounds
 *
 * @param bounds - Rectangle with center position and dimensions
 * @returns Array of four wall segments (clockwise from top-left)
 */
export function createWallsFromBounds(bounds: Bounds): Wall[] {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const left = bounds.x - halfW;
  const right = bounds.x + halfW;
  const top = bounds.y - halfH;
  const bottom = bounds.y + halfH;

  return [
    { start: { x: left, y: top }, end: { x: right, y: top } }, // Top
    { start: { x: right, y: top }, end: { x: right, y: bottom } }, // Right
    { start: { x: right, y: bottom }, end: { x: left, y: bottom } }, // Bottom
    { start: { x: left, y: bottom }, end: { x: left, y: top } }, // Left
  ];
}

/**
 * Create room from two corner positions (for drag-to-draw)
 *
 * @param start - First corner position
 * @param end - Second corner position
 * @param id - Unique room identifier
 * @param color - Room color
 * @param attenuation - Wall attenuation (default: DEFAULT_ATTENUATION)
 * @returns Complete DrawnRoom object
 */
export function createRoomFromCorners(
  start: Position,
  end: Position,
  id: string,
  color: string,
  attenuation = DEFAULT_ATTENUATION
): DrawnRoom {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  const width = maxX - minX;
  const height = maxY - minY;
  const center = { x: minX + width / 2, y: minY + height / 2 };
  const bounds: Bounds = { x: center.x, y: center.y, width, height };
  const walls = createWallsFromBounds(bounds);

  return {
    id,
    label: `Room ${id.slice(-4)}`,
    bounds,
    walls,
    center,
    color,
    attenuation,
  };
}

/**
 * Check if a room meets minimum size requirements
 *
 * @param start - First corner position
 * @param end - Second corner position
 * @returns true if room is large enough
 */
export function isValidRoomSize(start: Position, end: Position): boolean {
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);
  return width > MIN_ROOM_SIZE && height > MIN_ROOM_SIZE;
}

/**
 * Check if a speaker is inside a room
 *
 * @param room - The room to check
 * @param speaker - The speaker to check
 * @returns true if the speaker is inside the room
 * @returns false if the speaker is outside the room
 */
export const isSpeakerInsideRoom = (room: DrawnRoom, speaker: SpeakerState) => {
  const speakerPosition = speaker.position;
  const roomBounds = room.bounds;
  const roomWidth = roomBounds.width;
  const roomHeight = roomBounds.height;
  const roomX = roomBounds.x;
  const roomY = roomBounds.y;
  const roomMinX = roomX - roomWidth / 2;
  const roomMaxX = roomX + roomWidth / 2;
  const roomMinY = roomY - roomHeight / 2;
  const roomMaxY = roomY + roomHeight / 2;
  if (
    speakerPosition.x >= roomMinX &&
    speakerPosition.x <= roomMaxX &&
    speakerPosition.y >= roomMinY &&
    speakerPosition.y <= roomMaxY
  ) {
    return true;
  }
  return false;
};

// ============================================================================
// COLLECTION HELPERS
// ============================================================================

/**
 * Update an item in an array by ID
 *
 * Generic helper for the common pattern of updating a specific item in a list.
 *
 * @param items - Array of items with id property
 * @param id - ID of item to update
 * @param updates - Partial updates to apply
 * @returns New array with updated item
 */
export function updateItemById<T extends { id: string }>(
  items: T[],
  id: string,
  updates: Partial<Omit<T, "id">>
): T[] {
  return items.map((item) => (item.id === id ? { ...item, ...updates } : item));
}
