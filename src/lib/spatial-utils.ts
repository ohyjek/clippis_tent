/**
 * spatial-utils.ts - Coordinate conversion utilities for spatial audio
 *
 * These utilities handle conversion between:
 * - Room coordinates: Used for audio calculations (typically -2.5 to 2.5)
 * - Screen coordinates: Pixel positions from mouse events
 * - Percentage coordinates: CSS positioning (0-100%)
 *
 * The coordinate system uses:
 * - Origin (0,0) at center
 * - X increases to the right
 * - Y increases downward
 */

import type { Position } from "./spatial-audio";

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
