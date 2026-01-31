/**
 * types.ts - Type definitions for the spatial audio demo
 *
 * Contains all interfaces and type aliases used across demo components.
 */
import type {
  Position,
  Wall,
  DirectivityPattern,
  DistanceModel,
  SpeakerState,
  DrawnRoom,
  DrawingMode,
  SelectOption,
} from "@clippis/types";

/** Audio nodes for continuous playback */
export interface AudioNodes {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  panner: StereoPannerNode;
}

/** Re-export commonly used types from @clippis/types */
export type {
  Position,
  Wall,
  DirectivityPattern,
  DistanceModel,
  SpeakerState,
  DrawnRoom,
  DrawingMode,
  SelectOption,
};
