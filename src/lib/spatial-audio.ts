/**
 * Spatial Audio Utilities
 *
 * This module provides functions for calculating spatial audio parameters
 * (volume and stereo panning) based on listener and sound source positions.
 */

/** 2D position in the audio room */
export interface Position {
  x: number;
  y: number;
}

/** Spatial audio parameters for a sound source */
export interface SpatialParams {
  /** Volume level (0 to 1) */
  volume: number;
  /** Stereo pan position (-1 = left, 0 = center, 1 = right) */
  pan: number;
  /** Distance from listener to sound source */
  distance: number;
}

/** Sound source with position and frequency */
export interface SoundSource {
  id: string;
  position: Position;
  frequency: number;
}

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
 * Calculate volume based on distance using inverse distance attenuation
 *
 * Uses the formula: volume = 1 / (1 + distance)
 * This provides a smooth falloff that never reaches zero
 *
 * @param distance - Distance from listener to sound source
 * @param masterVolume - Master volume multiplier (0 to 1)
 * @param gainFactor - Additional gain reduction factor (default 0.3)
 */
export function calculateVolume(
  distance: number,
  masterVolume = 1,
  gainFactor = 0.3
): number {
  const baseVolume = 1.0 / (1.0 + distance);
  return Math.max(0, Math.min(1, baseVolume * masterVolume * gainFactor));
}

/**
 * Calculate stereo pan position based on horizontal offset
 *
 * @param dx - Horizontal distance (positive = right, negative = left)
 * @param panWidth - Width factor for pan calculation (default 3)
 * @returns Pan value clamped between -1 (left) and 1 (right)
 */
export function calculatePan(dx: number, panWidth = 3): number {
  return Math.max(-1, Math.min(1, dx / panWidth));
}

/**
 * Calculate all spatial audio parameters for a sound source
 *
 * @param listenerPos - The listener's position in the room
 * @param sourcePos - The sound source's position
 * @param masterVolume - Master volume level (0 to 1)
 */
export function calculateSpatialParams(
  listenerPos: Position,
  sourcePos: Position,
  masterVolume = 1
): SpatialParams {
  const dx = sourcePos.x - listenerPos.x;
  const dy = sourcePos.y - listenerPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  return {
    distance,
    volume: calculateVolume(distance, masterVolume),
    pan: calculatePan(dx),
  };
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
 * Cardinal direction test positions for spatial audio verification
 */
export const CARDINAL_DIRECTIONS = [
  { x: -2, y: 0, name: "Left", frequency: 330 },
  { x: 2, y: 0, name: "Right", frequency: 440 },
  { x: 0, y: -2, name: "Front", frequency: 550 },
  { x: 0, y: 2, name: "Back", frequency: 660 },
] as const;
