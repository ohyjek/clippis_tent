/**
 * spatial-audio-engine.ts - Advanced spatial audio engine
 *
 * A centralized audio engine that manages:
 * - Listener with position and facing direction
 * - Sources with configurable directivity patterns
 * - Rooms with material properties and openings
 * - Multiple distance attenuation models
 * - Real-time audio parameter updates
 *
 * Uses Web Audio API for actual sound generation.
 */

import {
  Position,
  calculateDistance,
  calculateAngleToPoint,
  normalizeAngle,
  countWallsBetween,
  calculateWallAttenuation,
  Wall,
} from "./spatial-audio";

// ============================================================================
// TYPES
// ============================================================================

/** Listener with position, facing direction, and optional ear separation */
export interface Listener {
  position: Position;
  /** Facing direction in radians (0 = right, PI/2 = down) */
  facing: number;
  /** Distance between ears for binaural simulation (meters, default 0.2) */
  earSeparation?: number;
}

/** Directivity pattern types for sound sources */
export type DirectivityPattern =
  | "omnidirectional" // Equal in all directions
  | "cardioid" // Heart-shaped, loudest forward
  | "supercardioid" // Tighter than cardioid
  | "hypercardioid" // Even tighter
  | "figure8" // Front and back lobes
  | "hemisphere"; // Front half only

/** Distance attenuation model */
export type DistanceModel =
  | "linear" // Linear falloff
  | "inverse" // 1 / distance
  | "exponential"; // exponential decay

/** Configuration for a sound source */
export interface SourceConfig {
  id: string;
  position: Position;
  /** Facing direction in radians */
  facing: number;
  /** Directivity pattern */
  directivity: DirectivityPattern;
  /** Base volume (0 to 1) */
  volume: number;
  /** Frequency in Hz */
  frequency: number;
  /** Waveform type */
  waveform: OscillatorType;
  /** Whether currently playing */
  playing: boolean;
}

/** Material properties for acoustic surfaces */
export interface Material {
  /** Name for identification */
  name: string;
  /** Sound absorption coefficient (0 = reflects all, 1 = absorbs all) */
  absorption: number;
  /** Transmission coefficient (0 = blocks all, 1 = transmits all) */
  transmission: number;
}

/** Wall with material properties */
export interface AcousticWall extends Wall {
  material: Material;
}

/** Opening/doorway in a wall */
export interface Opening {
  /** Center position of the opening */
  position: Position;
  /** Width of the opening */
  width: number;
  /** Transmission factor (typically 0.8-1.0) */
  transmission: number;
}

/** Room with acoustic properties */
export interface AcousticRoom {
  id: string;
  walls: AcousticWall[];
  openings: Opening[];
  center: Position;
  label?: string;
}

/** Audio parameters calculated for a source-listener pair */
export interface AudioParameters {
  /** Final volume after all calculations */
  volume: number;
  /** Stereo pan (-1 to 1) */
  pan: number;
  /** Distance from source to listener */
  distance: number;
  /** Directional gain from source pattern */
  directionalGain: number;
  /** Wall attenuation factor */
  wallAttenuation: number;
  /** Number of walls between source and listener */
  wallCount: number;
}

// ============================================================================
// PREDEFINED MATERIALS
// ============================================================================

export const MATERIALS: Record<string, Material> = {
  concrete: { name: "Concrete", absorption: 0.02, transmission: 0.05 },
  brick: { name: "Brick", absorption: 0.03, transmission: 0.08 },
  drywall: { name: "Drywall", absorption: 0.10, transmission: 0.30 },
  glass: { name: "Glass", absorption: 0.03, transmission: 0.20 },
  wood: { name: "Wood", absorption: 0.10, transmission: 0.15 },
  curtain: { name: "Curtain", absorption: 0.50, transmission: 0.60 },
  acoustic_panel: { name: "Acoustic Panel", absorption: 0.80, transmission: 0.10 },
  open: { name: "Open", absorption: 1.0, transmission: 1.0 },
};

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
export function calculateDirectivityGain(
  pattern: DirectivityPattern,
  angleDiff: number
): number {
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
 * @param distance - Distance from source to listener
 * @param model - Attenuation model
 * @param refDistance - Reference distance (where volume = 1)
 * @param maxDistance - Maximum distance (where volume = 0 for linear)
 * @param rolloffFactor - How quickly volume decreases
 */
export function calculateDistanceAttenuation(
  distance: number,
  model: DistanceModel,
  refDistance = 1,
  maxDistance = 10,
  rolloffFactor = 1
): number {
  // Clamp distance to reference minimum
  const d = Math.max(distance, refDistance);

  switch (model) {
    case "linear":
      // Linear: 1 - rolloff * (d - ref) / (max - ref)
      return Math.max(
        0,
        1 - rolloffFactor * ((d - refDistance) / (maxDistance - refDistance))
      );

    case "inverse":
      // Inverse: ref / (ref + rolloff * (d - ref))
      return refDistance / (refDistance + rolloffFactor * (d - refDistance));

    case "exponential":
      // Exponential: (ref / d) ^ rolloff
      return Math.pow(refDistance / d, rolloffFactor);

    default:
      return 1.0;
  }
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
export function calculateStereoPan(
  listener: Listener,
  sourcePos: Position,
  panWidth = 3
): number {
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
 * Calculate all audio parameters for a source-listener pair
 *
 * @param source - Sound source configuration
 * @param listener - Listener configuration
 * @param walls - Array of walls for occlusion calculation
 * @param distanceModel - Distance attenuation model
 * @param masterVolume - Master volume multiplier
 */
export function calculateAudioParameters(
  source: SourceConfig,
  listener: Listener,
  walls: Wall[] = [],
  distanceModel: DistanceModel = "inverse",
  masterVolume = 1
): AudioParameters {
  // Distance
  const distance = calculateDistance(source.position, listener.position);

  // Distance attenuation
  const distanceAtten = calculateDistanceAttenuation(distance, distanceModel);

  // Directional gain from source
  const angleToListener = calculateAngleToPoint(source.position, listener.position);
  const angleDiff = normalizeAngle(angleToListener - source.facing);
  const directionalGain = calculateDirectivityGain(source.directivity, angleDiff);

  // Wall occlusion
  const wallCount = countWallsBetween(source.position, listener.position, walls);
  const wallAttenuation = calculateWallAttenuation(wallCount);

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
// AUDIO ENGINE CLASS
// ============================================================================

/** Active audio nodes for a playing source */
interface ActiveSource {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  panner: StereoPannerNode;
}

/**
 * SpatialAudioEngine - Manages real-time spatial audio
 *
 * Provides a centralized way to:
 * - Create and manage sound sources
 * - Update listener position/facing
 * - Calculate and apply audio parameters in real-time
 */
export class SpatialAudioEngine {
  private audioContext: AudioContext | null = null;
  private listener: Listener = { position: { x: 0, y: 0 }, facing: 0 };
  private sources: Map<string, SourceConfig> = new Map();
  private activeSources: Map<string, ActiveSource> = new Map();
  private walls: Wall[] = [];
  private distanceModel: DistanceModel = "inverse";
  private masterVolume = 1;

  /** Initialize the audio context (must be called after user interaction) */
  initialize(): boolean {
    if (!this.audioContext) {
      try {
        this.audioContext = new AudioContext();
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }

  /** Get the audio context (initializes if needed) */
  getContext(): AudioContext | null {
    return this.audioContext;
  }

  /** Check if initialized */
  isInitialized(): boolean {
    return this.audioContext !== null;
  }

  /** Set master volume */
  setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    this.updateAllSources();
  }

  /** Set distance attenuation model */
  setDistanceModel(model: DistanceModel): void {
    this.distanceModel = model;
    this.updateAllSources();
  }

  /** Set walls for occlusion */
  setWalls(walls: Wall[]): void {
    this.walls = walls;
    this.updateAllSources();
  }

  /** Update listener position and facing */
  setListener(listener: Listener): void {
    this.listener = listener;
    this.updateAllSources();
  }

  /** Update listener position only */
  setListenerPosition(position: Position): void {
    this.listener.position = position;
    this.updateAllSources();
  }

  /** Update listener facing only */
  setListenerFacing(facing: number): void {
    this.listener.facing = facing;
    this.updateAllSources();
  }

  /** Add or update a source */
  setSource(config: SourceConfig): void {
    this.sources.set(config.id, config);
    if (config.playing) {
      this.startSource(config.id);
    } else {
      this.stopSource(config.id);
    }
  }

  /** Update source position */
  setSourcePosition(id: string, position: Position): void {
    const source = this.sources.get(id);
    if (source) {
      source.position = position;
      this.updateSource(id);
    }
  }

  /** Update source facing */
  setSourceFacing(id: string, facing: number): void {
    const source = this.sources.get(id);
    if (source) {
      source.facing = facing;
      this.updateSource(id);
    }
  }

  /** Remove a source */
  removeSource(id: string): void {
    this.stopSource(id);
    this.sources.delete(id);
  }

  /** Start continuous playback for a source */
  startSource(id: string): void {
    if (!this.audioContext) return;

    const source = this.sources.get(id);
    if (!source) return;

    // Stop if already playing
    this.stopSource(id);

    // Create audio nodes
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const panner = this.audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Configure oscillator
    oscillator.frequency.value = source.frequency;
    oscillator.type = source.waveform;

    // Calculate and apply initial parameters
    const params = calculateAudioParameters(
      source,
      this.listener,
      this.walls,
      this.distanceModel,
      this.masterVolume
    );
    gainNode.gain.value = params.volume;
    panner.pan.value = params.pan;

    // Start
    oscillator.start();

    // Store
    this.activeSources.set(id, { oscillator, gainNode, panner });
    source.playing = true;
  }

  /** Stop playback for a source */
  stopSource(id: string): void {
    const active = this.activeSources.get(id);
    if (active) {
      active.oscillator.stop();
      active.oscillator.disconnect();
      active.gainNode.disconnect();
      active.panner.disconnect();
      this.activeSources.delete(id);
    }
    const source = this.sources.get(id);
    if (source) {
      source.playing = false;
    }
  }

  /** Toggle playback for a source */
  toggleSource(id: string): boolean {
    const source = this.sources.get(id);
    if (!source) return false;

    if (source.playing) {
      this.stopSource(id);
      return false;
    } else {
      this.startSource(id);
      return true;
    }
  }

  /** Stop all sources */
  stopAll(): void {
    for (const id of this.activeSources.keys()) {
      this.stopSource(id);
    }
  }

  /** Play a one-shot sound from a source */
  playOneShot(id: string, duration = 0.3): void {
    if (!this.audioContext) return;

    const source = this.sources.get(id);
    if (!source) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();
    const panner = this.audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.value = source.frequency;
    oscillator.type = source.waveform;

    const params = calculateAudioParameters(
      source,
      this.listener,
      this.walls,
      this.distanceModel,
      this.masterVolume
    );
    gainNode.gain.value = params.volume;
    panner.pan.value = params.pan;

    oscillator.start();
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /** Update audio parameters for a specific source */
  private updateSource(id: string): void {
    const active = this.activeSources.get(id);
    const source = this.sources.get(id);
    if (!active || !source || !this.audioContext) return;

    const params = calculateAudioParameters(
      source,
      this.listener,
      this.walls,
      this.distanceModel,
      this.masterVolume
    );

    // Smooth transitions
    const now = this.audioContext.currentTime;
    active.gainNode.gain.linearRampToValueAtTime(params.volume, now + 0.05);
    active.panner.pan.linearRampToValueAtTime(params.pan, now + 0.05);
  }

  /** Update all active sources */
  private updateAllSources(): void {
    for (const id of this.activeSources.keys()) {
      this.updateSource(id);
    }
  }

  /** Get current parameters for a source */
  getSourceParameters(id: string): AudioParameters | null {
    const source = this.sources.get(id);
    if (!source) return null;

    return calculateAudioParameters(
      source,
      this.listener,
      this.walls,
      this.distanceModel,
      this.masterVolume
    );
  }

  /** Cleanup */
  dispose(): void {
    this.stopAll();
    this.audioContext?.close();
    this.audioContext = null;
    this.sources.clear();
  }
}

// ============================================================================
// FACTORY FUNCTIONS
// ============================================================================

/**
 * Create a default source configuration
 */
export function createSourceConfig(
  id?: string,
  options: Partial<SourceConfig> = {}
): SourceConfig {
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
export function createListener(
  position: Position = { x: 0, y: 0 },
  facing = 0
): Listener {
  return { position, facing };
}

/**
 * Create an acoustic wall with material
 */
export function createAcousticWall(
  start: Position,
  end: Position,
  material: Material = MATERIALS.drywall
): AcousticWall {
  return { start, end, material };
}
