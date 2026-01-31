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

import type {
  Position,
  Wall,
  Listener,
  DirectivityPattern,
  DistanceModel,
  SourceConfig,
  Material,
  AcousticWall,
  Opening,
  AcousticRoom,
  AudioParameters,
  AudioParameterOptions,
} from "@clippis/types";

import {
  calculateDistance,
  calculateAngleToPoint,
  normalizeAngle,
  countWallsBetween,
  calculateWallAttenuation,
} from "./spatial-audio";

// Re-export types for consumers
export type {
  Listener,
  DirectivityPattern,
  DistanceModel,
  SourceConfig,
  Material,
  AcousticWall,
  Opening,
  AcousticRoom,
  AudioParameters,
  AudioParameterOptions,
};

// ============================================================================
// PREDEFINED MATERIALS
// ============================================================================

export const MATERIALS: Record<string, Material> = {
  concrete: { name: "Concrete", absorption: 0.02, transmission: 0.05 },
  brick: { name: "Brick", absorption: 0.03, transmission: 0.08 },
  drywall: { name: "Drywall", absorption: 0.1, transmission: 0.3 },
  glass: { name: "Glass", absorption: 0.03, transmission: 0.2 },
  wood: { name: "Wood", absorption: 0.1, transmission: 0.15 },
  curtain: { name: "Curtain", absorption: 0.5, transmission: 0.6 },
  acoustic_panel: { name: "Acoustic Panel", absorption: 0.8, transmission: 0.1 },
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
      attenuation = Math.pow(refDistance / d, rolloffFactor);
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
    const params = calculateAudioParameters(source, this.listener, this.walls, {
      distanceModel: this.distanceModel,
      masterVolume: this.masterVolume,
    });
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

    const params = calculateAudioParameters(source, this.listener, this.walls, {
      distanceModel: this.distanceModel,
      masterVolume: this.masterVolume,
    });
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

    const params = calculateAudioParameters(source, this.listener, this.walls, {
      distanceModel: this.distanceModel,
      masterVolume: this.masterVolume,
    });

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

    return calculateAudioParameters(source, this.listener, this.walls, {
      distanceModel: this.distanceModel,
      masterVolume: this.masterVolume,
    });
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
