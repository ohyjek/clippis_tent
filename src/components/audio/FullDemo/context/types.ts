/**
 * types.ts - Type re-exports for the spatial audio demo
 *
 * Re-exports commonly used types from @clippis/types for convenience.
 * All types are defined in the shared @clippis/types package.
 *
 * We do this because if we have to change from @clippis/types to a different package, we only have to change it in one place.
 */
import type { CalculateAudioParameters } from "@/lib/spatial-audio-engine";
import type {
  AudioSourceType,
  DirectivityPattern,
  DistanceModel,
  DrawingMode,
  DrawnRoom,
  Position,
  SpeakerState,
  Wall,
  Bounds,
  AudioNodes,
  SelectOption,
} from "@clippis/types";
import type { Accessor, Setter } from "solid-js";

/** Context value type - exposes all state and actions to components */
interface DemoContextValue {
  // Room state
  rooms: Accessor<DrawnRoom[]>;
  setRooms: Setter<DrawnRoom[]>;
  selectedRoomId: Accessor<string | null>;
  setSelectedRoomId: Setter<string | null>;
  selectedRoom: () => DrawnRoom | undefined;
  allWalls: () => Wall[];

  // Drawing state
  drawingMode: Accessor<DrawingMode>;
  setDrawingMode: Setter<DrawingMode>;
  isDrawing: Accessor<boolean>;
  setIsDrawing: Setter<boolean>;
  drawStart: Accessor<Position | null>;
  setDrawStart: Setter<Position | null>;
  drawEnd: Accessor<Position | null>;
  setDrawEnd: Setter<Position | null>;

  // Speaker state
  speakers: Accessor<SpeakerState[]>;
  setSpeakers: Setter<SpeakerState[]>;
  selectedSpeaker: Accessor<string>;
  setSelectedSpeaker: Setter<string>;
  getSelectedSpeaker: () => SpeakerState | undefined;
  getSpeakerById: (id: string) => SpeakerState | undefined;

  // Perspective state
  currentPerspective: Accessor<string>;
  setCurrentPerspective: Setter<string>;
  isCurrentPerspective: (id: string) => boolean;
  getPerspectivePosition: () => Position;
  getPerspectiveFacing: () => number;

  // Interaction state
  isMovingSpeaker: Accessor<string | null>;
  setIsMovingSpeaker: Setter<string | null>;
  isRotatingSpeaker: Accessor<string | null>;
  setIsRotatingSpeaker: Setter<string | null>;

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
  roomRef: Accessor<HTMLDivElement | undefined>;
  setRoomRef: (ref: HTMLDivElement | undefined) => void;

  // Room actions
  addRoom: (start: Position, end: Position) => void;
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
  microphoneStream: Accessor<MediaStream | null>;
  microphoneEnabled: Accessor<boolean>;
  requestMicrophone: () => Promise<boolean>;
  stopMicrophone: () => void;

  // Audio actions
  startPlayback: (speakerId: string) => void;
  stopPlayback: (speakerId: string) => void;
  togglePlayback: (speakerId: string) => void;
  stopAllPlayback: () => void;

  // Computed values
  getAudioParams: (speaker: SpeakerState) => CalculateAudioParameters;
  calculateDisplayGain: (speaker: SpeakerState) => number;
  getWallCount: (speaker: SpeakerState) => number;

  // Interaction handlers
  handleSpeakerMoveStart: (speakerId: string) => (e: MouseEvent) => void;
  handleSpeakerRotateStart: (speakerId: string) => (e: MouseEvent) => void;
  handleCanvasClick: () => void;
  handleCanvasMouseDown: (e: MouseEvent) => void;
  handleCanvasMouseMove: (e: MouseEvent) => void;
  handleCanvasMouseUp: () => void;

  // Reset
  resetDemo: () => void;

  // Color index for new rooms
  nextColorIndex: Accessor<number>;
}

export type {
  // Geometry
  Position,
  Wall,
  Bounds,
  // Audio
  DirectivityPattern,
  DistanceModel,
  AudioSourceType,
  SpeakerState,
  DrawnRoom,
  AudioNodes,
  // UI
  DrawingMode,
  SelectOption,
  //Component
  DemoContextValue,
};
