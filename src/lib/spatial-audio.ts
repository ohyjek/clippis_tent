/**
 * spatial-audio.ts - Core spatial audio math utilities
 *
 * Pure functions for calculating spatial audio parameters.
 * No side effects, fully tested (see spatial-audio.test.ts).
 *
 * Features:
 * - Distance-based volume attenuation (inverse square law)
 * - Stereo panning based on horizontal position
 * - Directional audio (cardioid speaking pattern)
 * - Wall/room boundary attenuation
 *
 * Coordinate system: x = left/right, y = up/down
 * Range: typically -2.5 to +2.5 in room coordinates
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

/** Speaker with position and facing direction */
export interface Speaker {
  id: string;
  position: Position;
  /** Facing direction in radians (0 = right, PI/2 = down, PI = left, -PI/2 = up) */
  facing: number;
  /** Speaker color for visual identification */
  color: string;
}

/** Room boundary/wall segment */
export interface Wall {
  /** Start point of the wall */
  start: Position;
  /** End point of the wall */
  end: Position;
}

/** Room with boundaries */
export interface Room {
  id: string;
  walls: Wall[];
  /** Room center position for labeling */
  center: Position;
  label?: string;
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
 * Calculate directional gain using a cardioid pattern
 * 
 * Sound is loudest when the speaker faces the listener, and quietest when facing away.
 * Uses the formula: gain = 0.5 + 0.5 * cos(θ)
 * 
 * @param speakerFacing - The direction the speaker is facing (radians)
 * @param speakerPos - The speaker's position
 * @param listenerPos - The listener's position
 * @returns Gain multiplier from 0 (facing away) to 1 (facing toward)
 */
export function calculateDirectionalGain(
  speakerFacing: number,
  speakerPos: Position,
  listenerPos: Position
): number {
  // Calculate the angle from speaker to listener
  const angleToListener = calculateAngleToPoint(speakerPos, listenerPos);
  
  // Calculate the difference between facing direction and direction to listener
  const angleDiff = normalizeAngle(angleToListener - speakerFacing);
  
  // Cardioid pattern: loudest when facing (diff = 0), quietest when facing away (diff = PI)
  return 0.5 + 0.5 * Math.cos(angleDiff);
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
  
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
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
    Math.min(a.x, b.x) <= c.x && c.x <= Math.max(a.x, b.x) &&
    Math.min(a.y, b.y) <= c.y && c.y <= Math.max(a.y, b.y)
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
  return walls.filter(wall => lineIntersectsWall(speakerPos, listenerPos, wall)).length;
}

/**
 * Calculate volume attenuation due to walls
 * Each wall reduces volume by a factor (default 0.3 = 70% reduction per wall)
 * 
 * @param wallCount - Number of walls between speaker and listener
 * @param attenuationPerWall - Volume multiplier per wall (0 to 1)
 * @returns Total attenuation multiplier
 */
export function calculateWallAttenuation(
  wallCount: number,
  attenuationPerWall = 0.3
): number {
  return Math.pow(attenuationPerWall, wallCount);
}

/**
 * Create a rectangular room with walls
 * 
 * @param center - Center position of the room
 * @param width - Width of the room
 * @param height - Height of the room
 * @param id - Room identifier
 * @param label - Optional room label
 */
export function createRectangularRoom(
  center: Position,
  width: number,
  height: number,
  id: string,
  label?: string
): Room {
  const halfW = width / 2;
  const halfH = height / 2;
  
  const topLeft = { x: center.x - halfW, y: center.y - halfH };
  const topRight = { x: center.x + halfW, y: center.y - halfH };
  const bottomRight = { x: center.x + halfW, y: center.y + halfH };
  const bottomLeft = { x: center.x - halfW, y: center.y + halfH };
  
  return {
    id,
    center,
    label,
    walls: [
      { start: topLeft, end: topRight },      // Top wall
      { start: topRight, end: bottomRight },  // Right wall
      { start: bottomRight, end: bottomLeft }, // Bottom wall
      { start: bottomLeft, end: topLeft },    // Left wall
    ],
  };
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

/**
 * Create a new speaker with random position
 */
export function createSpeaker(id?: string, index = 0): Speaker {
  return {
    id: id ?? `speaker-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    position: randomPosition(1.5),
    facing: 0, // Initially facing right
    color: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
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
