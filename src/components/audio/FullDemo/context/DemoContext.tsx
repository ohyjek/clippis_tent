/**
 * DemoContext.tsx - SolidJS context for the spatial audio demo
 *
 * Provides shared state and actions for all demo components.
 * Handles rooms, speakers, listener, drawing, and audio playback.
 */
import {
  createContext,
  useContext,
  createSignal,
  createEffect,
  onCleanup,
  type JSX,
  type Accessor,
  type Setter,
} from "solid-js";
import { SPEAKER_COLORS } from "@/lib/spatial-audio";
import {
  calculateAudioParameters,
  createListener,
  type DirectivityPattern,
  type DistanceModel,
} from "@/lib/spatial-audio-engine";
import { audioStore } from "@/stores/audio";
import type {
  SpeakerState,
  AudioNodes,
  DrawnRoom,
  DrawingMode,
  Position,
  Wall,
  AudioSourceType,
} from "./types";
import { showToast } from "@/stores/toast";
import {
  ROOM_COLORS,
  DEFAULT_ATTENUATION,
  DEFAULT_MAX_DISTANCE,
  DEFAULT_REAR_GAIN,
} from "../constants";
import { createRoomFromCorners, getPositionFromEvent, getScreenPosition } from "../utils";

/** Context value type */
interface DemoContextValue {
  // Room state
  rooms: Accessor<DrawnRoom[]>;
  setRooms: Setter<DrawnRoom[]>;
  selectedRoomId: Accessor<string | null>;
  setSelectedRoomId: Setter<string | null>;
  selectedRoom: Accessor<DrawnRoom | undefined>;
  allWalls: Accessor<Wall[]>;

  // Drawing state
  drawingMode: Accessor<DrawingMode>;
  setDrawingMode: Setter<DrawingMode>;
  isDrawing: Accessor<boolean>;
  setIsDrawing: Setter<boolean>;
  drawStart: Accessor<Position | null>;
  setDrawStart: Setter<Position | null>;
  drawEnd: Accessor<Position | null>;
  setDrawEnd: Setter<Position | null>;

  // Speaker state - all entities are speakers (including observer)
  speakers: Accessor<SpeakerState[]>;
  setSpeakers: Setter<SpeakerState[]>;
  selectedSpeaker: Accessor<string>;
  setSelectedSpeaker: Setter<string>;
  getSelectedSpeaker: () => SpeakerState | undefined;
  getSpeakerById: (id: string) => SpeakerState | undefined;

  // Perspective state - which speaker is "you"
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
  getAudioParams: (speaker: SpeakerState) => ReturnType<typeof calculateAudioParameters>;
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

const DemoContext = createContext<DemoContextValue>();

/** Hook to access the demo context */
export function useDemoContext() {
  const context = useContext(DemoContext);
  if (!context) {
    throw new Error("useDemoContext must be used within a DemoProvider");
  }
  return context;
}

/** Provider component that wraps demo components */
export function DemoProvider(props: { children: JSX.Element }) {
  // Room ref for coordinate calculations
  let roomRefValue: HTMLDivElement | undefined;
  const [roomRef, setRoomRefSignal] = createSignal<HTMLDivElement | undefined>(undefined);
  const setRoomRef = (ref: HTMLDivElement | undefined) => {
    roomRefValue = ref;
    setRoomRefSignal(ref);
  };

  // Room state
  const [rooms, setRooms] = createSignal<DrawnRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = createSignal(0);

  // Drawing state
  const [drawingMode, setDrawingMode] = createSignal<DrawingMode>("select");
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [drawStart, setDrawStart] = createSignal<Position | null>(null);
  const [drawEnd, setDrawEnd] = createSignal<Position | null>(null);

  // Computed values
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);
  const selectedRoom = () => rooms().find((r) => r.id === selectedRoomId());

  // Observer speaker ID - the "you" speaker that starts as the default perspective
  const OBSERVER_ID = "observer";

  // Speakers state - observer is just another speaker
  const [speakers, setSpeakers] = createSignal<SpeakerState[]>([
    {
      id: OBSERVER_ID,
      position: { x: 0, y: 0 },
      facing: 0,
      color: "#3b82f6", // Blue for observer
      directivity: "omnidirectional",
      frequency: 440,
      sourceType: "oscillator", // Default to oscillator for demo
    },
    {
      id: "speaker-1",
      position: { x: -1, y: 0 },
      facing: 0,
      color: SPEAKER_COLORS[0],
      directivity: "cardioid",
      frequency: 440,
      sourceType: "oscillator",
    },
  ]);

  // Microphone state
  const [microphoneStream, setMicrophoneStream] = createSignal<MediaStream | null>(null);
  const microphoneEnabled = () => microphoneStream() !== null;

  // UI state
  const [selectedSpeaker, setSelectedSpeaker] = createSignal<string>(OBSERVER_ID);
  const [isMovingSpeaker, setIsMovingSpeaker] = createSignal<string | null>(null);
  const [isRotatingSpeaker, setIsRotatingSpeaker] = createSignal<string | null>(null);

  // Perspective state - which speaker ID is "you"
  const [currentPerspective, setCurrentPerspective] = createSignal<string>(OBSERVER_ID);

  // Perspective helpers
  const isCurrentPerspective = (id: string) => currentPerspective() === id;

  const getPerspectivePosition = (): Position => {
    const speaker = speakers().find((s) => s.id === currentPerspective());
    return speaker?.position ?? { x: 0, y: 0 };
  };

  const getPerspectiveFacing = (): number => {
    const speaker = speakers().find((s) => s.id === currentPerspective());
    return speaker?.facing ?? 0;
  };

  // Helper to get speaker by ID
  const getSpeakerById = (id: string) => speakers().find((s) => s.id === id);

  // Audio settings
  const [distanceModel, setDistanceModel] = createSignal<DistanceModel>("inverse");
  const [maxDistance, setMaxDistance] = createSignal(DEFAULT_MAX_DISTANCE);
  const [rearGainFloor, setRearGainFloor] = createSignal(DEFAULT_REAR_GAIN);

  // Visual settings
  const [showSoundPaths, setShowSoundPaths] = createSignal(false);

  // Self-hearing setting - whether you hear your own speaker's audio
  const [hearSelf, setHearSelf] = createSignal(false);

  // Playing state
  const [playingSpeakers, setPlayingSpeakers] = createSignal<Set<string>>(new Set());
  const audioNodes = new Map<string, AudioNodes>();

  // Computed helpers
  const effectiveAttenuation = (): number => {
    const roomList = rooms();
    if (roomList.length === 0) return DEFAULT_ATTENUATION;
    const sum = roomList.reduce((acc, r) => acc + r.attenuation, 0);
    return sum / roomList.length;
  };

  const getSelectedSpeaker = () => speakers().find((s) => s.id === selectedSpeaker());
  const isPlaying = (speakerId: string) => playingSpeakers().has(speakerId);

  // Audio parameter calculation - uses current perspective as the listener
  const getAudioParams = (speaker: SpeakerState) => {
    // Create listener from current perspective (you hear from this position)
    const listener = createListener(getPerspectivePosition(), getPerspectiveFacing());
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
    const transmission = 1 - effectiveAttenuation();
    return calculateAudioParameters(sourceConfig, listener, allWalls(), {
      distanceModel: distanceModel(),
      masterVolume: audioStore.masterVolume(),
      attenuationPerWall: transmission,
      maxDistance: maxDistance(),
      rearGainFloor: rearGainFloor(),
    });
  };

  const calculateDisplayGain = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.directionalGain * params.wallAttenuation;
  };

  const getWallCount = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.wallCount;
  };

  // ============================================================================
  // ROOM ACTIONS
  // ============================================================================

  const addRoom = (start: Position, end: Position) => {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.y - start.y);

    if (width > 0.2 && height > 0.2) {
      const color = ROOM_COLORS[nextColorIndex() % ROOM_COLORS.length];
      const id = `room-${Date.now()}`;
      const room = createRoomFromCorners(start, end, id, color);

      setRooms((prev) => [...prev, room]);
      setSelectedRoomId(id);
      setNextColorIndex((i) => i + 1);
    }
  };

  const deleteSelectedRoom = () => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setSelectedRoomId(null);
  };

  const updateRoomAttenuation = (attenuation: number, roomId?: string) => {
    const id = roomId ?? selectedRoomId();
    if (!id) return;
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, attenuation } : r)));
  };

  const updateRoomLabel = (label: string) => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, label } : r)));
  };

  const updateRoomColor = (color: string) => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, color } : r)));
  };

  const handleRoomClick = (roomId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    if (drawingMode() === "select") {
      setSelectedRoomId(roomId);
    }
  };

  // ============================================================================
  // SPEAKER ACTIONS
  // ============================================================================

  const addSpeaker = () => {
    const currentSpeakers = speakers();
    const index = currentSpeakers.length;
    const newSpeaker: SpeakerState = {
      id: `speaker-${Date.now()}`,
      position: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
      },
      facing: 0,
      color: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
      directivity: "cardioid",
      frequency: 440 + index * 110,
      sourceType: "oscillator",
    };
    setSpeakers((prev) => [...prev, newSpeaker]);
    setSelectedSpeaker(newSpeaker.id);

    // If there were no speakers, set this as the perspective (you)
    if (currentSpeakers.length === 0) {
      setCurrentPerspective(newSpeaker.id);
    }
  };

  const deleteSelectedSpeaker = () => {
    const id = selectedSpeaker();
    if (!id) return;
    stopPlayback(id);

    const remaining = speakers().filter((s) => s.id !== id);

    // If deleting the current perspective, switch to another speaker if available
    if (currentPerspective() === id) {
      if (remaining.length > 0) {
        setCurrentPerspective(remaining[0].id);
      } else {
        // No speakers left - clear perspective
        setCurrentPerspective("");
      }
    }

    setSpeakers((prev) => prev.filter((s) => s.id !== id));
    if (remaining.length > 0) {
      setSelectedSpeaker(remaining[0].id);
    } else {
      // No speakers left - clear selection
      setSelectedSpeaker("");
    }
  };

  const updateDirectivity = (pattern: DirectivityPattern) => {
    const speakerId = selectedSpeaker();
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, directivity: pattern } : s))
    );
  };

  const updateFrequency = (frequency: number) => {
    const speakerId = selectedSpeaker();
    setSpeakers((prev) => prev.map((s) => (s.id === speakerId ? { ...s, frequency } : s)));
    const nodes = audioNodes.get(speakerId);
    if (nodes && nodes.sourceType === "oscillator") {
      (nodes.source as OscillatorNode).frequency.value = frequency;
    }
  };

  const updateSpeakerColor = (color: string) => {
    const speakerId = selectedSpeaker();
    setSpeakers((prev) => prev.map((s) => (s.id === speakerId ? { ...s, color } : s)));
  };

  const updateSourceType = (sourceType: AudioSourceType) => {
    const speakerId = selectedSpeaker();
    const wasPlaying = playingSpeakers().has(speakerId);

    // Stop current playback if playing
    if (wasPlaying) {
      stopPlayback(speakerId);
    }

    setSpeakers((prev) => prev.map((s) => (s.id === speakerId ? { ...s, sourceType } : s)));

    // Restart with new source type if was playing
    if (wasPlaying) {
      startPlayback(speakerId);
    }
  };

  // ============================================================================
  // MICROPHONE MANAGEMENT
  // ============================================================================

  const requestMicrophone = async (): Promise<boolean> => {
    // Already have a stream
    if (microphoneStream()) return true;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioStore.echoCancellationEnabled(),
          noiseSuppression: audioStore.noiseSuppressionEnabled(),
          autoGainControl: true,
        },
      });
      setMicrophoneStream(stream);
      showToast({ type: "success", message: "Microphone enabled" });
      return true;
    } catch (err) {
      console.error("Failed to get microphone:", err);
      showToast({
        type: "error",
        message: "Could not access microphone. Please check permissions.",
      });
      return false;
    }
  };

  const stopMicrophone = () => {
    const stream = microphoneStream();
    if (stream) {
      // Stop all speakers using microphone
      speakers().forEach((speaker) => {
        if (speaker.sourceType === "microphone" && playingSpeakers().has(speaker.id)) {
          stopPlayback(speaker.id);
        }
      });

      // Stop all tracks
      stream.getTracks().forEach((track) => track.stop());
      setMicrophoneStream(null);
      showToast({ type: "info", message: "Microphone disabled" });
    }
  };

  // ============================================================================
  // AUDIO ACTIONS
  // ============================================================================

  const startPlayback = async (speakerId: string) => {
    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

    // Stop existing playback if any
    if (audioNodes.has(speakerId)) {
      stopPlayback(speakerId);
    }

    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    let source: OscillatorNode | MediaStreamAudioSourceNode;

    if (speaker.sourceType === "microphone") {
      // Request microphone if not already enabled
      const hasAccess = await requestMicrophone();
      if (!hasAccess) return;

      const stream = microphoneStream();
      if (!stream) return;

      source = audioContext.createMediaStreamSource(stream);
    } else {
      // Create oscillator for test tone
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = speaker.frequency;
      oscillator.type = "sine";
      oscillator.start();
      source = oscillator;
    }

    // Connect the audio graph: source → panner → gain → destination
    source.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Apply initial audio parameters
    // Check if this is the current perspective and self-hearing is disabled
    if (speakerId === currentPerspective() && !hearSelf()) {
      // Mute yourself if hear-self is off
      gainNode.gain.value = 0;
      panner.pan.value = 0;
    } else {
      // Apply spatial audio parameters
      const params = getAudioParams(speaker);
      gainNode.gain.value = params.volume;
      panner.pan.value = params.pan;
    }

    audioNodes.set(speakerId, {
      source,
      sourceType: speaker.sourceType,
      gainNode,
      panner,
    });
    setPlayingSpeakers((prev) => new Set([...prev, speakerId]));
  };

  const stopPlayback = (speakerId: string) => {
    const nodes = audioNodes.get(speakerId);
    if (nodes) {
      // Only stop oscillator (microphone source doesn't need stopping)
      if (nodes.sourceType === "oscillator") {
        (nodes.source as OscillatorNode).stop();
      }
      nodes.source.disconnect();
      nodes.gainNode.disconnect();
      nodes.panner.disconnect();
      audioNodes.delete(speakerId);
    }
    setPlayingSpeakers((prev) => {
      const next = new Set(prev);
      next.delete(speakerId);
      return next;
    });
  };

  const togglePlayback = (speakerId: string) => {
    if (playingSpeakers().has(speakerId)) {
      stopPlayback(speakerId);
    } else {
      startPlayback(speakerId);
    }
  };

  const stopAllPlayback = () => {
    for (const id of audioNodes.keys()) {
      stopPlayback(id);
    }
  };

  // ============================================================================
  // INTERACTION HANDLERS
  // ============================================================================

  const handleSpeakerMoveStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsMovingSpeaker(speakerId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent, roomRefValue);
      setSpeakers((prev) => prev.map((s) => (s.id === speakerId ? { ...s, position: pos } : s)));
    };

    const handleMouseUp = () => {
      setIsMovingSpeaker(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleSpeakerRotateStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsRotatingSpeaker(speakerId);

    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

    let currentAngle = speaker.facing;
    const speakerScreen = getScreenPosition(speaker.position, roomRefValue);
    let prevRawAngle = Math.atan2(e.clientY - speakerScreen.y, e.clientX - speakerScreen.x);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentSpeaker = speakers().find((s) => s.id === speakerId);
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

      setSpeakers((prev) =>
        prev.map((s) => (s.id === speakerId ? { ...s, facing: currentAngle } : s))
      );
    };

    const handleMouseUp = () => {
      setIsRotatingSpeaker(null);
      const normalized = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle));
      setSpeakers((prev) =>
        prev.map((s) => (s.id === speakerId ? { ...s, facing: normalized } : s))
      );
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleCanvasClick = () => {
    if (drawingMode() === "select") {
      audioStore.initializeAudio();
      setSelectedRoomId(null);
    }
  };

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (drawingMode() !== "draw") return;

    const pos = getPositionFromEvent(e, roomRefValue);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawEnd(pos);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (!isDrawing()) return;
    setDrawEnd(getPositionFromEvent(e, roomRefValue));
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing()) return;

    const start = drawStart();
    const end = drawEnd();

    if (start && end) {
      addRoom(start, end);
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  };

  // ============================================================================
  // RESET
  // ============================================================================

  const resetDemo = () => {
    stopAllPlayback();
    stopMicrophone();
    setRooms([]);
    setSelectedRoomId(null);
    setNextColorIndex(0);
    setDrawingMode("select");
    setSpeakers([
      {
        id: OBSERVER_ID,
        position: { x: 0, y: 0 },
        facing: 0,
        color: "#3b82f6",
        directivity: "omnidirectional",
        frequency: 440,
        sourceType: "oscillator", // Default to oscillator for demo
      },
      {
        id: "speaker-1",
        position: { x: -1, y: 0 },
        facing: 0,
        color: SPEAKER_COLORS[0],
        directivity: "cardioid",
        frequency: 440,
        sourceType: "oscillator",
      },
    ]);
    setSelectedSpeaker(OBSERVER_ID);
    setDistanceModel("inverse");
    setCurrentPerspective(OBSERVER_ID);
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Update audio in real-time when anything changes
  createEffect(() => {
    const speakerList = speakers();
    const dModel = distanceModel();
    const masterVol = audioStore.masterVolume();
    const perspective = currentPerspective();
    const maxDist = maxDistance();
    const rearFloor = rearGainFloor();
    const canHearSelf = hearSelf();
    const audioContext = audioStore.getAudioContext();

    // Track dependencies (speakerList includes positions/facings)
    void dModel;
    void masterVol;
    void perspective;
    void maxDist;
    void rearFloor;
    void canHearSelf;

    if (!audioContext) return;

    for (const speaker of speakerList) {
      const nodes = audioNodes.get(speaker.id);
      if (!nodes) continue;

      // If this speaker is the current perspective (you)
      if (speaker.id === perspective) {
        if (canHearSelf) {
          // Hear yourself at full volume, centered
          nodes.gainNode.gain.linearRampToValueAtTime(
            audioStore.masterVolume(),
            audioContext.currentTime + 0.02
          );
          nodes.panner.pan.value = 0;
        } else {
          // Mute yourself - you don't hear yourself
          nodes.gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.02);
          nodes.panner.pan.value = 0;
        }
        continue;
      }

      // Otherwise, calculate audio from the current perspective position
      const params = getAudioParams(speaker);
      nodes.gainNode.gain.linearRampToValueAtTime(params.volume, audioContext.currentTime + 0.02);
      nodes.panner.pan.value = params.pan;
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    stopAllPlayback();
    stopMicrophone();
  });

  const value: DemoContextValue = {
    // Room state
    rooms,
    setRooms,
    selectedRoomId,
    setSelectedRoomId,
    selectedRoom,
    allWalls,

    // Drawing state
    drawingMode,
    setDrawingMode,
    isDrawing,
    setIsDrawing,
    drawStart,
    setDrawStart,
    drawEnd,
    setDrawEnd,

    // Speaker state - all entities are speakers
    speakers,
    setSpeakers,
    selectedSpeaker,
    setSelectedSpeaker,
    getSelectedSpeaker,
    getSpeakerById,

    // Perspective state
    currentPerspective,
    setCurrentPerspective,
    isCurrentPerspective,
    getPerspectivePosition,
    getPerspectiveFacing,

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
    playingSpeakers,
    isPlaying,

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
    deleteSelectedRoom,
    updateRoomAttenuation,
    updateRoomLabel,
    updateRoomColor,
    handleRoomClick,

    // Speaker actions
    addSpeaker,
    deleteSelectedSpeaker,
    updateDirectivity,
    updateFrequency,
    updateSpeakerColor,
    updateSourceType,

    // Microphone state
    microphoneStream,
    microphoneEnabled,
    requestMicrophone,
    stopMicrophone,

    // Audio actions
    startPlayback,
    stopPlayback,
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
    handleCanvasMouseDown,
    handleCanvasMouseMove,
    handleCanvasMouseUp,

    // Reset
    resetDemo,

    // Color index
    nextColorIndex,
  };

  return <DemoContext.Provider value={value}>{props.children}</DemoContext.Provider>;
}
