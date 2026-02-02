/**
 * DemoContext.tsx - SolidJS context for the spatial audio demo
 *
 * Provides shared state and actions for all demo components.
 * Composes specialized hooks for room, speaker, audio, and interaction management.
 */
import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onCleanup,
  type JSX,
} from "solid-js";
import type { DistanceModel } from "@clippis/types";
import { calculateAudioParameters, createListener } from "@lib/spatial-audio-engine";
import { audioStore } from "@stores/audio";
import {
  useMicrophone,
  useAudioPlayback,
  useRoomManager,
  useSpeakerManager,
  useCanvasDrawing,
} from "@lib/hooks";
import type { SpeakerState, Position, AudioSourceType, DemoContextValue } from "./types";
import {
  ROOM_COLORS,
  DEFAULT_MAX_DISTANCE,
  DEFAULT_REAR_GAIN,
  DEFAULT_SPEAKERS,
} from "../constants";
import { getPositionFromEvent, getScreenPosition, DEFAULT_ATTENUATION } from "../utils";
import { showToast } from "@stores/toast";
import { logger } from "@lib/logger";
import { isSpeakerInsideRoom } from "@lib/spatial-utils";

// ============================================================================
// SolidJS Context Value
//
// The value that contains the Provider Component and that can be used with useContext
// ============================================================================

const DemoContext = createContext<DemoContextValue>();

/**
 * Hook to access the demo context
 * @returns The demo context value.
 * @throws An error if the hook is used outside of a DemoProvider.
 */
export function useDemoContext() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}

// ============================================================================
// PROVIDER
// ============================================================================

/**
 * Provider component for the demo context.
 *
 * Provides shared state and actions for all demo components.
 * Composes specialized hooks for
 * - room management
 * - speaker management
 * - audio playback management
 * - canvas drawing
 * - microphone management
 * - audio parameter calculations
 * - display gain calculations
 * - wall count calculations
 * - room actions
 * - speaker actions
 * - audio actions
 * - interaction handlers
 * - reset
 * - effects
 * - context value
 *
 * @param props - The props for the provider.
 * @returns The provider component.
 */
export function DemoProvider(props: { children: JSX.Element }) {
  // Room ref for coordinate calculations
  let roomRefValue: HTMLDivElement | undefined;
  const [roomRef, setRoomRefSignal] = createSignal<HTMLDivElement | undefined>(undefined);
  const setRoomRef = (ref: HTMLDivElement | undefined) => {
    roomRefValue = ref;
    setRoomRefSignal(ref);
  };

  // ============================================================================
  // COMPOSED HOOKS
  // ============================================================================

  // Room management
  const roomManager = useRoomManager();

  // Speaker management (with audio stop callback)
  const speakerManager = useSpeakerManager({
    initialSpeakers: DEFAULT_SPEAKERS,
    onStopPlayback: (id) => audioPlayback.stop(id),
  });

  // Microphone management
  const microphone = useMicrophone({
    onDisabled: () => {
      // Stop all speakers using microphone
      speakerManager.speakers().forEach((speaker) => {
        if (speaker.sourceType === "microphone" && audioPlayback.isPlaying(speaker.id)) {
          audioPlayback.stop(speaker.id);
        }
      });
    },
  });

  // Audio playback management
  const audioPlayback = useAudioPlayback();

  // Canvas drawing
  const [nextColorIndex, setNextColorIndex] = createSignal(0);
  const drawing = useCanvasDrawing({
    getPositionFromEvent: (e) => getPositionFromEvent(e, roomRefValue),
    onDrawComplete: (start, end) => {
      const color = ROOM_COLORS[nextColorIndex() % ROOM_COLORS.length];
      const id = `room-${Date.now()}`;
      const added = roomManager.addRoom(start, end, {
        id,
        color,
        attenuation: DEFAULT_ATTENUATION,
      });
      if (added) {
        setNextColorIndex((i) => i + 1);
      }
    },
  });

  // ============================================================================
  // LOCAL STATE (not in a store!)
  // ============================================================================

  // Interaction state
  const [isMovingSpeaker, setIsMovingSpeaker] = createSignal<string | null>(null);
  const [isRotatingSpeaker, setIsRotatingSpeaker] = createSignal<string | null>(null);

  // Audio settings
  const [distanceModel, setDistanceModel] = createSignal<DistanceModel>("inverse");
  const [maxDistance, setMaxDistance] = createSignal(DEFAULT_MAX_DISTANCE);
  const [rearGainFloor, setRearGainFloor] = createSignal(DEFAULT_REAR_GAIN);

  // Visual settings
  const [showSoundPaths, setShowSoundPaths] = createSignal(false);

  // Self-hearing setting
  const [hearSelf, setHearSelf] = createSignal(false);

  // ============================================================================
  // COMPUTED VALUES (from store managers) TODO: memoize ??
  // ============================================================================

  /**
   * Calculate the effective attenuation for the current speaker.
   *
   * Uses the MAXIMUM attenuation of all rooms containing the speaker and the perspective speaker.
   * This ensures that a fully-blocking inner room can't be "diluted" by
   * adding a less-blocking outer room around it.
   *
   * If the speaker is not inside any room, returns DEFAULT_ATTENUATION
   * so that walls still block sound properly.
   *
   * @returns The effective attenuation for the current speaker.
   */
  const effectiveAttenuation = (speaker: SpeakerState): number => {
    const roomList = roomManager.rooms();
    if (roomList.length === 0) return DEFAULT_ATTENUATION;
    const perspectiveSpeaker = speakerManager.getCurrentPerspectiveSpeaker();
    if (!perspectiveSpeaker) return DEFAULT_ATTENUATION;

    let maxAttenuation = -1;
    for (const room of roomList) {
      // logger.audio.debug("Room:", room.id, room.attenuation);

      if (isSpeakerInsideRoom(room, perspectiveSpeaker)) {
        maxAttenuation = Math.max(maxAttenuation, room.attenuation);
      }
      if (isSpeakerInsideRoom(room, speaker)) {
        maxAttenuation = Math.max(maxAttenuation, room.attenuation);
      }
    }

    // logger.audio.debug("Info", { maxAttenuation });
    return maxAttenuation >= 0 ? maxAttenuation : DEFAULT_ATTENUATION;
  };

  /**
   * Calculate the audio parameters for a speaker.
   * @param speaker - The speaker to calculate the audio parameters for.
   * @returns The audio parameters for the speaker.
   */
  const getAudioParams = (speaker: SpeakerState) => {
    // logger.audio.debug("Getting audio params for speaker:", speaker.id);
    const listener = createListener(
      speakerManager.getPerspectivePosition(),
      speakerManager.getPerspectiveFacing()
    );
    const sourceConfig = {
      id: speaker.id,
      position: speaker.position,
      facing: speaker.facing,
      directivity: speaker.directivity,
      volume: 1,
      frequency: speaker.frequency,
      waveform: "sine" as const,
      playing: true,
    };
    const transmission = 1 - effectiveAttenuation(speaker);
    // logger.audio.debug("Transmission Value:", transmission);
    const params = calculateAudioParameters(sourceConfig, listener, roomManager.allWalls(), {
      distanceModel: distanceModel(),
      masterVolume: audioStore.masterVolume(),
      attenuationPerWall: transmission,
      maxDistance: maxDistance(),
      rearGainFloor: rearGainFloor(),
    });

    // logger.audio.debug("Audio Parameters:", { speakerId: speaker.id }, params);
    return params;
  };

  /**
   * Calculate the display gain for a speaker.
   * @param speaker - The speaker to calculate the display gain for.
   * @returns The display gain for the speaker.
   */
  const calculateDisplayGain = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.directionalGain * params.wallAttenuation;
  };

  /**
   * Get the wall count for a speaker.
   * @param speaker - The speaker to get the wall count for.
   * @returns The wall count for the speaker.
   */
  const getWallCount = (speaker: SpeakerState): number => {
    return getAudioParams(speaker).wallCount;
  };

  // ============================================================================
  // ROOM ACTIONS (delegated to hook)
  // ============================================================================

  /**
   * Add a room to the room manager.
   * @param start - The start position of the room.
   * @param end - The end position of the room.
   */
  const addRoom = (start: Position, end: Position): void => {
    const color = ROOM_COLORS[nextColorIndex() % ROOM_COLORS.length];
    const id = `room-${Date.now()}`;
    if (roomManager.addRoom(start, end, { id, color, attenuation: DEFAULT_ATTENUATION })) {
      setNextColorIndex((i) => i + 1);
    } else {
      showToast({
        type: "error",
        message: "Failed to add room. Please try again.",
      });
      logger.error("Failed to add room. Please try again.");
    }
  };

  /**
   * Update the attenuation for a room.
   * @param attenuation - The attenuation to set for the room.
   * @param roomId - The ID of the room to update.
   */
  const updateRoomAttenuation = (attenuation: number, roomId?: string) => {
    const id = roomId ?? roomManager.selectedRoomId();
    if (id) roomManager.updateRoom(id, { attenuation });
  };

  /**
   * Update the label for a room.
   * @param label - The label to set for the room.
   */
  const updateRoomLabel = (label: string) => {
    const id = roomManager.selectedRoomId();
    if (id) roomManager.updateRoom(id, { label });
  };

  /**
   * Update the color for a room.
   * @param color - The color to set for the room.
   */
  const updateRoomColor = (color: string) => {
    const id = roomManager.selectedRoomId();
    if (id) roomManager.updateRoom(id, { color });
  };

  /**
   * Handle the click event for a room.
   * @param roomId - The ID of the room to handle the click event for.
   * @returns The event handler for the click event.
   */
  const handleRoomClick = (roomId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    if (drawing.drawingMode() === "select") {
      roomManager.setSelectedRoomId(roomId);
    }
  };

  // ============================================================================
  // SPEAKER ACTIONS (delegated to hook)
  // ============================================================================

  /**
   * Update the frequency for a speaker.
   * @param frequency - The frequency to set for the speaker.
   */
  const updateFrequency = (frequency: number) => {
    speakerManager.updateFrequency(frequency);
    audioPlayback.updateFrequency(speakerManager.selectedSpeaker(), frequency);
  };

  /**
   * Update the source type for a speaker.
   * @param sourceType - The source type to set for the speaker.
   */
  const updateSourceType = (sourceType: AudioSourceType) => {
    const speakerId = speakerManager.selectedSpeaker();
    const wasPlaying = audioPlayback.isPlaying(speakerId);

    if (wasPlaying) {
      audioPlayback.stop(speakerId);
    }

    speakerManager.updateSourceType(sourceType);

    if (wasPlaying) {
      startPlayback(speakerId);
    }
  };

  // ============================================================================
  // AUDIO ACTIONS
  // ============================================================================

  /**
   * Start playback for a speaker.
   * @param speakerId - The ID of the speaker to start playback for.
   */
  const startPlayback = async (speakerId: string) => {
    audioStore.initializeAudio();
    const speaker = speakerManager.getSpeakerById(speakerId);
    if (!speaker) return;

    // Request microphone if needed
    if (speaker.sourceType === "microphone") {
      const hasAccess = await microphone.request();
      if (!hasAccess) return;
    }

    // Calculate initial parameters
    const isSelf = speakerId === speakerManager.currentPerspective() && !hearSelf();
    const params = getAudioParams(speaker);

    await audioPlayback.start({
      speakerId,
      sourceType: speaker.sourceType,
      frequency: speaker.frequency,
      initialGain: isSelf ? 0 : params.volume,
      initialPan: isSelf ? 0 : params.pan,
      microphoneStream: microphone.stream(),
    });
  };

  /**
   * Toggle playback for a speaker.
   * @param speakerId - The ID of the speaker to toggle playback for.
   */
  const togglePlayback = (speakerId: string) => {
    if (audioPlayback.isPlaying(speakerId)) {
      audioPlayback.stop(speakerId);
    } else {
      startPlayback(speakerId);
    }
  };

  /**
   * Stop all playback.
   */
  const stopAllPlayback = () => {
    audioPlayback.stopAll();
    microphone.stop();
  };

  // ============================================================================
  // INTERACTION HANDLERS
  // ============================================================================

  /**
   * Handle the start of a speaker move.
   * @param speakerId - The ID of the speaker to handle the start of the move for.
   * @returns The event handler for the start of the move.
   * @note stops the propagation and prevents the default behavior of the event
   * @note initializes the audio context
   * @note sets the selected speaker
   * @note sets the is moving speaker state
   * @note creates the event handler for the mouse move event
   * @note creates the event handler for the mouse up event
   * @note adds the event listeners for the mouse move and mouse up events
   * @note removes the event listeners for the mouse move and mouse up events
   * @note removes the event listeners for the mouse move and mouse up events
   */
  const handleSpeakerMoveStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    speakerManager.setSelectedSpeaker(speakerId);
    setIsMovingSpeaker(speakerId);

    /**
     * Handle the mouse move event for the speaker.
     * @param moveEvent - The mouse move event.
     */
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent, roomRefValue);
      speakerManager.updatePosition(speakerId, pos);
    };

    /**
     * Handle the mouse up event for the speaker.
     * @note also removes the event listeners for the mouse move and mouse up events
     */
    const handleMouseUp = () => {
      setIsMovingSpeaker(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  /**
   * Curried function to handle the start of a speaker rotation. (we curry to capture the speakerId in the closure)
   * @param speakerId - The ID of the speaker to handle the start of the rotation for.
   * @returns The event handler for the start of the rotation.
   */
  const handleSpeakerRotateStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    speakerManager.setSelectedSpeaker(speakerId);
    setIsRotatingSpeaker(speakerId);

    const speaker = speakerManager.getSpeakerById(speakerId);
    if (!speaker) return;

    let currentAngle = speaker.facing;
    const speakerScreen = getScreenPosition(speaker.position, roomRefValue);
    let prevRawAngle = Math.atan2(e.clientY - speakerScreen.y, e.clientX - speakerScreen.x);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentSpeaker = speakerManager.getSpeakerById(speakerId);
      if (!currentSpeaker) return;

      const currentScreen = getScreenPosition(currentSpeaker.position, roomRefValue);
      const rawAngle = Math.atan2(
        moveEvent.clientY - currentScreen.y,
        moveEvent.clientX - currentScreen.x
      );

      let delta = rawAngle - prevRawAngle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      currentAngle += delta;
      prevRawAngle = rawAngle;

      speakerManager.updateFacing(speakerId, currentAngle);
    };

    const handleMouseUp = () => {
      setIsRotatingSpeaker(null);
      const normalized = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle));
      speakerManager.updateFacing(speakerId, normalized);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  /**
   * Handle the click event for the canvas.
   */
  const handleCanvasClick = () => {
    if (drawing.drawingMode() === "select") {
      audioStore.initializeAudio();
      roomManager.setSelectedRoomId(null);
    }
  };

  // ============================================================================
  // RESET
  // ============================================================================

  /**
   * Reset the demo.
   * - Stops all playback
   * - Clears the rooms
   * - Resets the color index
   * - Sets the drawing mode to select
   * - Resets the speakers
   * - Resets the distance model
   */
  const resetDemo = () => {
    stopAllPlayback();
    roomManager.clearRooms();
    setNextColorIndex(0);
    drawing.setDrawingMode("select");
    speakerManager.reset(DEFAULT_SPEAKERS);
    setDistanceModel("inverse");
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Update audio in real-time when anything changes
  createEffect(() => {
    const speakerList = speakerManager.speakers();
    const dModel = distanceModel();
    const masterVol = audioStore.masterVolume();
    const perspective = speakerManager.currentPerspective();
    const maxDist = maxDistance();
    const rearFloor = rearGainFloor();
    const canHearSelf = hearSelf();
    const audioContext = audioStore.getAudioContext();

    // Track dependencies
    void dModel;
    void masterVol;
    void perspective;
    void maxDist;
    void rearFloor;
    void canHearSelf;

    if (!audioContext) return;

    // TODO: analysis and optimizations
    for (const speaker of speakerList) {
      if (!audioPlayback.isPlaying(speaker.id)) continue;

      // If this speaker is the current perspective (you)
      if (speaker.id === perspective) {
        if (canHearSelf) {
          audioPlayback.updateParams(speaker.id, audioStore.masterVolume(), 0);
        } else {
          audioPlayback.updateParams(speaker.id, 0, 0);
        }
        continue;
      }

      // Calculate and apply spatial audio parameters
      const params = getAudioParams(speaker);
      audioPlayback.updateParams(speaker.id, params.volume, params.pan);
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    stopAllPlayback();
  });

  // ============================================================================
  // Reactive Provider Context Value for DOM
  // ============================================================================
  const value: DemoContextValue = {
    // Room state (from hook)
    rooms: roomManager.rooms,
    setRooms: roomManager.setRooms,
    selectedRoomId: roomManager.selectedRoomId,
    setSelectedRoomId: roomManager.setSelectedRoomId,
    selectedRoom: roomManager.selectedRoom,
    allWalls: roomManager.allWalls,

    // Drawing state (from hook)
    drawingMode: drawing.drawingMode,
    setDrawingMode: drawing.setDrawingMode,
    isDrawing: drawing.isDrawing,
    setIsDrawing: () => {
      /* controlled by hook */
    },
    drawStart: drawing.drawStart,
    setDrawStart: () => {
      /* controlled by hook */
    },
    drawEnd: drawing.drawEnd,
    setDrawEnd: () => {
      /* controlled by hook */
    },

    // Speaker state (from hook)
    speakers: speakerManager.speakers,
    setSpeakers: speakerManager.setSpeakers,
    selectedSpeaker: speakerManager.selectedSpeaker,
    setSelectedSpeaker: speakerManager.setSelectedSpeaker,
    getSelectedSpeaker: speakerManager.getSelectedSpeaker,
    getSpeakerById: speakerManager.getSpeakerById,

    // Perspective state (from hook)
    currentPerspective: speakerManager.currentPerspective,
    setCurrentPerspective: speakerManager.setCurrentPerspective,
    isCurrentPerspective: speakerManager.isCurrentPerspective,
    getPerspectivePosition: speakerManager.getPerspectivePosition,
    getPerspectiveFacing: speakerManager.getPerspectiveFacing,

    // Interaction state
    isMovingSpeaker,
    setIsMovingSpeaker,
    isRotatingSpeaker,
    setIsRotatingSpeaker,

    // Audio state
    distanceModel,
    setDistanceModel,
    maxDistance,
    setMaxDistance,
    rearGainFloor,
    setRearGainFloor,
    playingSpeakers: audioPlayback.playingSpeakers,
    isPlaying: audioPlayback.isPlaying,

    // Visual settings
    showSoundPaths,
    setShowSoundPaths,

    // Self-hearing setting
    hearSelf,
    setHearSelf,

    // Room ref
    roomRef,
    setRoomRef,

    // Room actions
    addRoom,
    deleteSelectedRoom: roomManager.deleteSelectedRoom,
    updateRoomAttenuation,
    updateRoomLabel,
    updateRoomColor,
    handleRoomClick,

    // Speaker actions
    addSpeaker: speakerManager.addSpeaker,
    deleteSelectedSpeaker: speakerManager.deleteSelectedSpeaker,
    updateDirectivity: speakerManager.updateDirectivity,
    updateFrequency,
    updateSpeakerColor: speakerManager.updateColor,
    updateSourceType,

    // Microphone state (from hook)
    microphoneStream: microphone.stream,
    microphoneEnabled: microphone.enabled,
    requestMicrophone: microphone.request,
    stopMicrophone: microphone.stop,

    // Audio actions
    startPlayback,
    stopPlayback: audioPlayback.stop,
    togglePlayback,
    stopAllPlayback,

    // Computed values
    getAudioParams,
    calculateDisplayGain,
    getWallCount,

    // Interaction handlers
    handleSpeakerMoveStart,
    handleSpeakerRotateStart,
    handleCanvasClick,
    handleCanvasMouseDown: drawing.handleMouseDown,
    handleCanvasMouseMove: drawing.handleMouseMove,
    handleCanvasMouseUp: drawing.handleMouseUp,

    // Reset
    resetDemo,

    // Color index
    nextColorIndex,
  };

  return <DemoContext.Provider value={value}>{props.children}</DemoContext.Provider>;
}
