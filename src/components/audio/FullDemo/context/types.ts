/**
 * types.ts - Type re-exports for the spatial audio demo
 *
 * Re-exports commonly used types from @tentchat/types for convenience.
 * All types are defined in the shared @tentchat/types package.
 *
 * We do this because if we have to change from @tentchat/types to a different package, we only have to change it in one place.
 */

import type {
  AudioNodes,
  AudioParameters,
  AudioSourceType,
  Bounds,
  DirectivityPattern,
  DistanceModel,
  DrawingMode,
  DrawnRoom,
  Position,
  RemotePeerState,
  SelectOption,
  SpeakerState,
  Wall,
} from "@tentchat/types";
import type { Accessor, Setter } from "solid-js";

/** Context value type - exposes all state and actions to components */
interface DemoContextValue {
  // Room state
  rooms: Accessor<DrawnRoom[]>;
  selectedRoomId: Accessor<string | null>;
  setSelectedRoomId: Setter<string | null>;
  selectedRoom: () => DrawnRoom | undefined;

  // Drawing state
  drawingMode: Accessor<DrawingMode>;
  setDrawingMode: Setter<DrawingMode>;
  isDrawing: Accessor<boolean>;
  drawStart: Accessor<Position | null>;
  drawEnd: Accessor<Position | null>;

  // Speaker state
  speakers: Accessor<SpeakerState[]>;
  selectedSpeaker: Accessor<string>;
  setSelectedSpeaker: Setter<string>;
  getSelectedSpeaker: () => SpeakerState | undefined;

  // Perspective state
  currentPerspective: Accessor<string>;
  setCurrentPerspective: Setter<string>;
  isCurrentPerspective: (id: string) => boolean;
  getPerspectivePosition: () => Position;

  // Interaction state
  isMovingSpeaker: Accessor<string | null>;
  isRotatingSpeaker: Accessor<string | null>;

  // Audio state
  distanceModel: Accessor<DistanceModel>;
  setDistanceModel: Setter<DistanceModel>;
  maxDistance: Accessor<number>;
  setMaxDistance: Setter<number>;
  rearGainFloor: Accessor<number>;
  setRearGainFloor: Setter<number>;
  playingSpeakers: Accessor<Set<string>>;
  isPlaying: (speakerId: string) => boolean;

  // Visual settings
  showSoundPaths: Accessor<boolean>;
  setShowSoundPaths: Setter<boolean>;

  // Self-hearing setting
  hearSelf: Accessor<boolean>;
  setHearSelf: Setter<boolean>;

  // Room ref for coordinate calculations
  setRoomRef: (ref: HTMLDivElement | undefined) => void;

  // Room actions
  deleteSelectedRoom: () => void;
  updateRoomAttenuation: (attenuation: number, roomId?: string) => void;
  updateRoomLabel: (label: string) => void;
  updateRoomColor: (color: string) => void;
  handleRoomClick: (roomId: string) => (e: MouseEvent) => void;

  // Speaker actions
  addSpeaker: () => void;
  deleteSelectedSpeaker: () => void;
  updateDirectivity: (pattern: DirectivityPattern) => void;
  updateFrequency: (frequency: number) => void;
  updateSpeakerColor: (color: string) => void;
  updateSourceType: (sourceType: AudioSourceType) => void;

  // Microphone state
  microphoneEnabled: Accessor<boolean>;

  // Audio actions
  togglePlayback: (speakerId: string) => void;

  // Computed values
  calculateDisplayGain: (speaker: SpeakerState) => number;
  getWallCount: (speaker: SpeakerState) => number;

  // Remote peer (WebRTC) — not consumed by the panels yet; integration surface for issue #33
  remotePeerState: Accessor<RemotePeerState | null>;
  remoteAudioParams: Accessor<AudioParameters | null>;
  webRTCConnectionState: Accessor<RTCPeerConnectionState | null>;

  // Interaction handlers
  handleSpeakerMoveStart: (speakerId: string) => (e: MouseEvent) => void;
  handleSpeakerRotateStart: (speakerId: string) => (e: MouseEvent) => void;
  handleCanvasClick: () => void;
  handleCanvasMouseDown: (e: MouseEvent) => void;
  handleCanvasMouseMove: (e: MouseEvent) => void;
  handleCanvasMouseUp: () => void;

  // Reset
  resetDemo: () => void;
}

export type {
  AudioNodes,
  AudioSourceType,
  Bounds,
  // Component
  DemoContextValue,
  // Audio
  DirectivityPattern,
  DistanceModel,
  // UI
  DrawingMode,
  DrawnRoom,
  // Geometry
  Position,
  SelectOption,
  SpeakerState,
  Wall,
};
