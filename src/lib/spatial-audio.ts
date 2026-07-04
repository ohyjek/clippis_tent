/**
 * spatial-audio.ts - Core spatial audio math utilities
 *
 * Pure functions for calculating spatial audio parameters.
 * No side effects, fully tested (see spatial-audio.test.ts).
 *
 * Features:
 * - Distance and angle calculations
 * - Wall intersection detection and attenuation
 * - Sound source creation helpers (random position/frequency)
 * - Speaker color palette
 *
 * Coordinate system: x = left/right, y = up/down
 * Range: typically -2.5 to +2.5 in room coordinates
 */

import type { Position, SoundSource, Wall } from "@tentchat/types";

/** Musical note frequencies (E4 to G5) */
export const SOUND_FREQUENCIES = [330, 392, 440, 494, 523, 587, 659, 784] as const;

/**
 * Calculate the Euclidean distance between two positions
 */
export function calculateDistance(pos1: Position, pos2: Position): number {
  const dx = pos1.x - pos2.x;
  const dy = pos1.y - pos2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Generate a random position within the audio room bounds
 *
 * @param range - The range from center (-range to +range)
 */
export function randomPosition(range = 2): Position {
  return {
    x: Math.random() * range * 2 - range,
    y: Math.random() * range * 2 - range,
  };
}

/**
 * Pick a random frequency from the available musical notes
 */
export function randomFrequency(): number {
  return SOUND_FREQUENCIES[Math.floor(Math.random() * SOUND_FREQUENCIES.length)];
}

/**
 * Create a new sound source with random position and frequency
 */
export function createSoundSource(id?: string): SoundSource {
  return {
    id: id ?? `sound-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    position: randomPosition(),
    frequency: randomFrequency(),
  };
}

/**
 * Calculate the angle from one position to another
 *
 * @param from - Starting position
 * @param to - Target position
 * @returns Angle in radians (0 = right, PI/2 = down, PI/-PI = left, -PI/2 = up)
 */
export function calculateAngleToPoint(from: Position, to: Position): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  return Math.atan2(dy, dx);
}

/**
 * Normalize an angle to the range [-PI, PI]
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Check if a line segment intersects with a wall
 * Used for calculating sound occlusion through walls
 *
 * @param p1 - Start of the line (e.g., speaker position)
 * @param p2 - End of the line (e.g., listener position)
 * @param wall - The wall to check intersection with
 * @returns true if the line intersects the wall
 */
export function lineIntersectsWall(p1: Position, p2: Position, wall: Wall): boolean {
  const { start: p3, end: p4 } = wall;

  // Line segment intersection using cross products
  const d1 = direction(p3, p4, p1);
  const d2 = direction(p3, p4, p2);
  const d3 = direction(p1, p2, p3);
  const d4 = direction(p1, p2, p4);

  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }

  // Check for collinear cases
  if (d1 === 0 && onSegment(p3, p4, p1)) return true;
  if (d2 === 0 && onSegment(p3, p4, p2)) return true;
  if (d3 === 0 && onSegment(p1, p2, p3)) return true;
  if (d4 === 0 && onSegment(p1, p2, p4)) return true;

  return false;
}

/** Helper: Calculate cross product direction */
function direction(a: Position, b: Position, c: Position): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}

/** Helper: Check if point c lies on segment ab */
function onSegment(a: Position, b: Position, c: Position): boolean {
  return (
    Math.min(a.x, b.x) <= c.x &&
    c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y &&
    c.y <= Math.max(a.y, b.y)
  );
}

/**
 * Count how many walls a sound must pass through
 *
 * @param speakerPos - The speaker's position
 * @param listenerPos - The listener's position
 * @param walls - Array of walls to check
 * @returns Number of walls between speaker and listener
 */
export function countWallsBetween(
  speakerPos: Position,
  listenerPos: Position,
  walls: Wall[]
): number {
  return walls.filter((wall) => lineIntersectsWall(speakerPos, listenerPos, wall)).length;
}

/**
 * Calculate volume attenuation due to walls
 * Each wall reduces volume by a factor (default 0.3 = 70% reduction per wall)
 *
 * @param wallCount - Number of walls between speaker and listener
 * @param attenuationPerWall - Volume multiplier per wall (0 to 1)
 * @returns Total attenuation multiplier
 */
export function calculateWallAttenuation(wallCount: number, attenuationPerWall = 0.3): number {
  return attenuationPerWall ** wallCount;
}

/**
 * Speaker colors for visual identification
 */
export const SPEAKER_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
] as const;
