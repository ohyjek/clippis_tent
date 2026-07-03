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

// Audio hooks
export {
  type AudioNodes,
  type AudioPlaybackState,
  type PlaybackParams,
  useAudioPlayback,
} from "@lib/hooks/useAudioPlayback";
export {
  type CanvasDrawingOptions,
  type CanvasDrawingState,
  useCanvasDrawing,
} from "@lib/hooks/useCanvasDrawing";
// Interaction hooks
export { useDragHandler, useRotationHandler } from "@lib/hooks/useDragHandler";
export {
  type MicrophoneOptions,
  type MicrophoneState,
  useMicrophone,
} from "@lib/hooks/useMicrophone";
export {
  type RemoteSpeakerOptions,
  type UseRemoteSpeakerReturn,
  useRemoteSpeaker,
} from "@lib/hooks/useRemoteSpeaker";
// State management hooks
export { type RoomConfig, type RoomManagerState, useRoomManager } from "@lib/hooks/useRoomManager";
export {
  type SpeakerManagerOptions,
  type SpeakerManagerState,
  useSpeakerManager,
} from "@lib/hooks/useSpeakerManager";
