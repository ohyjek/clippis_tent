import type { Position, Wall, Bounds } from "./geometry";

// ============================================================================
// Core Audio Types
// ============================================================================

/**
 * Directivity pattern for speakers/microphones
 */
export type DirectivityPattern =
  | "omnidirectional"
  | "cardioid"
  | "supercardioid"
  | "hypercardioid"
  | "figure8"
  | "hemisphere";

/**
 * Distance attenuation model
 */
export type DistanceModel = "linear" | "inverse" | "exponential";

/**
 * Oscillator waveform type (Web Audio API)
 */
export type WaveformType = OscillatorType;

/**
 * Audio source type for speakers
 */
export type AudioSourceType = "oscillator" | "microphone";

// ============================================================================
// Speaker Types
// ============================================================================

/**
 * Basic speaker definition
 */
export interface Speaker {
  id: string;
  position: Position;
  facing: number;
  color: string;
}

/**
 * Extended speaker state with audio properties
 */
export interface SpeakerState extends Speaker {
  directivity: DirectivityPattern;
  frequency: number;
  /** Audio source type - oscillator for testing, microphone for real voice */
  sourceType: AudioSourceType;
}

/**
 * Full speaker/source configuration for audio engine
 */
export interface SourceConfig {
  id: string;
  position: Position;
  facing: number;
  directivity: DirectivityPattern;
  volume: number;
  frequency: number;
  waveform: WaveformType;
  playing: boolean;
}

// ============================================================================
// Sound Source Types
// ============================================================================

/**
 * A sound source in space
 */
export interface SoundSource {
  id: string;
  position: Position;
  frequency: number;
}

// ============================================================================
// Listener Types
// ============================================================================

/**
 * Listener/receiver position and orientation
 */
export interface Listener {
  position: Position;
  facing: number;
  earSeparation?: number;
}

// ============================================================================
// Room & Acoustic Types
// ============================================================================

/**
 * Basic room definition
 */
export interface Room {
  id: string;
  walls: Wall[];
  center: Position;
  label?: string;
}

/**
 * Acoustic material properties
 */
export interface Material {
  name: string;
  absorption: number;
  transmission: number;
}

/**
 * Wall with acoustic properties
 */
export interface AcousticWall extends Wall {
  material: Material;
}

/**
 * Opening in a room (door, window, etc.)
 */
export interface Opening {
  position: Position;
  width: number;
  transmission: number;
}

/**
 * Room with acoustic properties
 */
export interface AcousticRoom {
  id: string;
  walls: AcousticWall[];
  openings: Opening[];
  center: Position;
  label?: string;
}

/**
 * Drawn room in the demo canvas
 */
export interface DrawnRoom {
  id: string;
  label: string;
  bounds: Bounds;
  walls: Wall[];
  center: Position;
  color: string;
  attenuation: number;
}

// ============================================================================
// Audio Parameter Types
// ============================================================================

/**
 * Spatial audio parameters for a source
 */
export interface SpatialParams {
  volume: number;
  pan: number;
  distance: number;
}

/**
 * Full audio parameters including directional effects
 */
export interface AudioParameters {
  volume: number;
  pan: number;
  distance: number;
  directionalGain: number;
  wallAttenuation: number;
  wallCount: number;
}

/**
 * Options for audio parameter calculation
 */
export interface AudioParameterOptions {
  distanceModel?: DistanceModel;
  masterVolume?: number;
  attenuationPerWall?: number;
  maxDistance?: number;
  rearGainFloor?: number;
}
