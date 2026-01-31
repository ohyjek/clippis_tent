/**
 * types.ts - Type definitions for the spatial audio demo
 *
 * Contains all interfaces and type aliases used across demo components.
 */
import type { Position, Wall } from "@/lib/spatial-audio";
import type { DirectivityPattern, DistanceModel } from "@/lib/spatial-audio-engine";

/** Extended speaker data for UI state */
export interface SpeakerState {
  id: string;
  position: Position;
  facing: number;
  color: string;
  directivity: DirectivityPattern;
  frequency: number;
}

/** Audio nodes for continuous playback */
export interface AudioNodes {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  panner: StereoPannerNode;
}

/** Room with bounds for drawing */
export interface DrawnRoom {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  walls: Wall[];
  center: Position;
  color: string;
  attenuation: number;
}

/** Drawing mode for the canvas */
export type DrawingMode = "select" | "draw";

/** Option for dropdown selects */
export interface SelectOption {
  value: string;
  label: string;
}

/** Re-export commonly used types from dependencies */
export type { Position, Wall, DirectivityPattern, DistanceModel };
