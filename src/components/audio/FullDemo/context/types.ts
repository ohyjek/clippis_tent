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
  AudioSourceType,
  SpeakerState,
  DrawnRoom,
  DrawingMode,
  SelectOption,
} from "@clippis/types";

/** Audio nodes for continuous playback - supports both oscillator and microphone sources */
export interface AudioNodes {
  /** Audio source - either oscillator or media stream source */
  source: OscillatorNode | MediaStreamAudioSourceNode;
  /** Source type for cleanup handling */
  sourceType: AudioSourceType;
  /** Gain node for volume control */
  gainNode: GainNode;
  /** Stereo panner for spatial positioning */
  panner: StereoPannerNode;
}

/** Re-export commonly used types from @clippis/types */
export type {
  Position,
  Wall,
  DirectivityPattern,
  DistanceModel,
  AudioSourceType,
  SpeakerState,
  DrawnRoom,
  DrawingMode,
  SelectOption,
};
