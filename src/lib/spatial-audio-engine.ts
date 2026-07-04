/**
 * spatial-audio-engine.ts - Advanced spatial audio calculations
 *
 * Pure functions for computing audio parameters from a source-listener pair:
 * - Multiple distance attenuation models (linear, inverse, exponential)
 * - Directivity patterns (omni, cardioid, supercardioid, hypercardioid, figure8, hemisphere)
 * - Listener directional hearing gain
 * - Stereo panning and wall occlusion
 *
 * Plus factory helpers for creating source/listener configurations.
 */

import {
  calculateAngleToPoint,
  calculateDistance,
  calculateWallAttenuation,
  countWallsBetween,
  normalizeAngle,
} from "@lib/spatial-audio";
import type {
  AudioParameterOptions,
  AudioParameters,
  DirectivityPattern,
  DistanceModel,
  Listener,
  Position,
  SourceConfig,
  Wall,
} from "@tentchat/types";

// ============================================================================
// RETURN TYPE EXPORTS
// (So we don't have to import the functions themselves in type files)
// ============================================================================

// ============================================================================
// DIRECTIVITY FUNCTIONS
// ============================================================================

/**
 * Calculate directivity gain based on pattern type
 *
 * @param pattern - The directivity pattern
 * @param angleDiff - Angle difference between facing and direction to listener
 * @returns Gain multiplier (0 to 1)
 */
export function calculateDirectivityGain(pattern: DirectivityPattern, angleDiff: number): number {
  const cos = Math.cos(angleDiff);

  switch (pattern) {
    case "omnidirectional":
      // Equal in all directions
      return 1.0;

    case "cardioid":
      // Standard cardioid: (1 + cos(θ)) / 2
      return 0.5 + 0.5 * cos;

    case "supercardioid":
      // Tighter pattern: 0.37 + 0.63 * cos(θ)
      return 0.37 + 0.63 * cos;

    case "hypercardioid":
      // Even tighter: 0.25 + 0.75 * cos(θ)
      return Math.max(0, 0.25 + 0.75 * cos);

    case "figure8":
      // Bidirectional: |cos(θ)|
      return Math.abs(cos);

    case "hemisphere":
      // Front hemisphere only
      return cos > 0 ? cos : 0;

    default:
      return 1.0;
  }
}

// ============================================================================
// DISTANCE ATTENUATION FUNCTIONS
// ============================================================================

/**
 * Calculate distance attenuation based on model
 *
 * All models now apply a hard cutoff at maxDistance where sound becomes silent.
 * This is more realistic than allowing infinitely propagating sound.
 *
 * @param distance - Distance from source to listener
 * @param model - Attenuation model
 * @param refDistance - Reference distance (where volume = 1)
 * @param maxDistance - Maximum distance (hard cutoff, volume = 0 beyond this)
 * @param rolloffFactor - How quickly volume decreases
 */
export function calculateDistanceAttenuation(
  distance: number,
  model: DistanceModel,
  refDistance = 1,
  maxDistance = 5,
  rolloffFactor = 1
): number {
  // Hard cutoff at max distance for all models
  if (distance >= maxDistance) {
    return 0;
  }

  // Clamp distance to reference minimum
  const d = Math.max(distance, refDistance);

  let attenuation: number;

  switch (model) {
    case "linear":
      // Linear: 1 - rolloff * (d - ref) / (max - ref)
      attenuation = Math.max(
        0,
        1 - rolloffFactor * ((d - refDistance) / (maxDistance - refDistance))
      );
      break;

    case "inverse":
      // Inverse: ref / (ref + rolloff * (d - ref))
      // Normalized to reach near-zero at maxDistance
      attenuation = refDistance / (refDistance + rolloffFactor * (d - refDistance));
      break;

    case "exponential":
      // Exponential: (ref / d) ^ rolloff
      attenuation = (refDistance / d) ** rolloffFactor;
      break;

    default:
      attenuation = 1.0;
  }

  // Apply smooth falloff near maxDistance to avoid abrupt cutoff
  // Use cosine interpolation in the last 20% of the range
  const falloffStart = maxDistance * 0.8;
  if (distance > falloffStart) {
    const t = (distance - falloffStart) / (maxDistance - falloffStart);
    const smoothFactor = 0.5 * (1 + Math.cos(t * Math.PI)); // 1 -> 0 smoothly
    attenuation *= smoothFactor;
  }

  return attenuation;
}

// ============================================================================
// STEREO PANNING
// ============================================================================

/**
 * Calculate stereo pan based on listener-relative position
 *
 * Takes into account the listener's facing direction to calculate
 * where the sound appears in the stereo field.
 *
 * @param listener - Listener with position and facing
 * @param sourcePos - Sound source position
 * @param panWidth - Width factor for pan calculation
 */
export function calculateStereoPan(listener: Listener, sourcePos: Position, panWidth = 3): number {
  // Calculate angle from listener to source
  const angleToSource = calculateAngleToPoint(listener.position, sourcePos);

  // Calculate relative angle (accounting for listener facing)
  const relativeAngle = normalizeAngle(angleToSource - listener.facing);

  // Project onto left-right axis (sin gives lateral component)
  // Positive sin = right, negative sin = left
  const lateralComponent = Math.sin(relativeAngle);

  // Scale by distance for more natural panning
  const distance = calculateDistance(listener.position, sourcePos);
  const distanceFactor = Math.min(1, distance / panWidth);

  return Math.max(-1, Math.min(1, lateralComponent * distanceFactor * 1.5));
}

// ============================================================================
// COMBINED AUDIO CALCULATION
// ============================================================================

/**
 * Calculate listener directional hearing gain
 *
 * Simulates human hearing - sounds in front are louder, sounds behind
 * are attenuated but still audible. Uses a modified cardioid-like pattern
 * with a minimum floor to ensure sounds from any direction can be heard.
 *
 * Humans can hear sounds from all directions, but sounds in front appear
 * louder due to ear shape and head-related transfer functions.
 *
 * @param listener - Listener with position and facing
 * @param sourcePos - Sound source position
 * @param minGain - Minimum gain floor for sounds behind (default 0.3)
 */
export function calculateListenerDirectionalGain(
  listener: Listener,
  sourcePos: Position,
  minGain = 0.3
): number {
  // Angle from listener to source
  const angleToSource = calculateAngleToPoint(listener.position, sourcePos);

  // Relative angle (how far off from where listener is facing)
  const relativeAngle = normalizeAngle(angleToSource - listener.facing);

  // Use a modified cardioid pattern with a minimum floor
  // Sounds directly in front: 1.0
  // Sounds to the side: ~0.65 + minGain/2
  // Sounds directly behind: minGain (default 0.3, still audible!)
  //
  // Formula: minGain + (1 - minGain) * (0.5 + 0.5 * cos(angle))
  // This maps the range [0, 1] to [minGain, 1]
  const rawGain = 0.5 + 0.5 * Math.cos(relativeAngle);
  const gain = minGain + (1 - minGain) * rawGain;

  return gain;
}

/**
 * Calculate all audio parameters for a source-listener pair
 *
 * @param source - Sound source configuration
 * @param listener - Listener configuration
 * @param walls - Array of walls for occlusion calculation
 * @param options - Audio calculation options
 * @returns Audio parameters
 * @example
 * const params = calculateAudioParameters(source, listener, walls, {
 *   distanceModel: "inverse",
 *   masterVolume: 1,
 *   attenuationPerWall: 0.3,
 *   maxDistance: 5,
 *   rearGainFloor: 0.3,
 * });
 */
export function calculateAudioParameters(
  source: SourceConfig,
  listener: Listener,
  walls: Wall[] = [],
  options: AudioParameterOptions = {}
): AudioParameters {
  const {
    distanceModel = "inverse",
    masterVolume = 1,
    attenuationPerWall = 0.3,
    maxDistance = 5,
    rearGainFloor = 0.3,
  } = options;

  // Distance
  const distance = calculateDistance(source.position, listener.position);

  // Distance attenuation (with max distance cutoff)
  const distanceAtten = calculateDistanceAttenuation(
    distance,
    distanceModel,
    1, // refDistance
    maxDistance
  );

  // Directional gain from source (speaker pointing direction)
  const angleToListener = calculateAngleToPoint(source.position, listener.position);
  const angleDiff = normalizeAngle(angleToListener - source.facing);
  const sourceDirectionalGain = calculateDirectivityGain(source.directivity, angleDiff);

  // Directional gain from listener (hearing direction, with floor)
  const listenerDirectionalGain = calculateListenerDirectionalGain(
    listener,
    source.position,
    rearGainFloor
  );

  // Combined directional gain (source + listener)
  const directionalGain = sourceDirectionalGain * listenerDirectionalGain;

  // Wall occlusion
  const wallCount = countWallsBetween(source.position, listener.position, walls);
  const wallAttenuation = calculateWallAttenuation(wallCount, attenuationPerWall);

  // Stereo pan (listener-relative)
  const pan = calculateStereoPan(listener, source.position);

  // Combined volume
  const volume = Math.min(
    1,
    source.volume * distanceAtten * directionalGain * wallAttenuation * masterVolume
  );

  return {
    volume,
    pan,
    distance,
    directionalGain,
    wallAttenuation,
    wallCount,
  };
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default source configuration
 */
export function createSourceConfig(id?: string, options: Partial<SourceConfig> = {}): SourceConfig {
  return {
    id: id ?? `source-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    position: { x: 0, y: 0 },
    facing: 0,
    directivity: "cardioid",
    volume: 1,
    frequency: 440,
    waveform: "sine",
    playing: false,
    ...options,
  };
}

/**
 * Create a default listener
 */
export function createListener(position: Position = { x: 0, y: 0 }, facing = 0): Listener {
  return { position, facing };
}
