/**
 * hooks/index.ts - Barrel export for custom hooks
 *
 * Provides reusable hooks for:
 * - Drag/rotation interactions (useDragHandler, useRotationHandler)
 * - Audio playback management (useAudioPlayback)
 * - Microphone access (useMicrophone)
 * - Room management (useRoomManager)
 * - Speaker management (useSpeakerManager)
 * - Canvas drawing (useCanvasDrawing)
 */

// Interaction hooks
export { useDragHandler, useRotationHandler } from "./useDragHandler";

// Audio hooks
export {
  useAudioPlayback,
  type AudioNodes,
  type PlaybackParams,
  type AudioPlaybackState,
} from "./useAudioPlayback";
export { useMicrophone, type MicrophoneOptions, type MicrophoneState } from "./useMicrophone";

// State management hooks
export { useRoomManager, type RoomConfig, type RoomManagerState } from "./useRoomManager";
export {
  useSpeakerManager,
  type SpeakerManagerOptions,
  type SpeakerManagerState,
} from "./useSpeakerManager";
export {
  useCanvasDrawing,
  type CanvasDrawingOptions,
  type CanvasDrawingState,
} from "./useCanvasDrawing";
