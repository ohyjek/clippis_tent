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
import type { SpeakerState, AudioNodes, DrawnRoom, DrawingMode, Position, Wall } from "./types";
import { ROOM_COLORS, DEFAULT_ATTENUATION, DEFAULT_MAX_DISTANCE, DEFAULT_REAR_GAIN } from "../constants";
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

  // Listener state
  listenerPos: Accessor<Position>;
  setListenerPos: Setter<Position>;
  listenerFacing: Accessor<number>;
  setListenerFacing: Setter<number>;

  // Speaker state
  speakers: Accessor<SpeakerState[]>;
  setSpeakers: Setter<SpeakerState[]>;
  selectedSpeaker: Accessor<string>;
  setSelectedSpeaker: Setter<string>;
  getSelectedSpeaker: () => SpeakerState | undefined;

  // Interaction state
  isDraggingListener: Accessor<boolean>;
  setIsDraggingListener: Setter<boolean>;
  isRotatingListener: Accessor<boolean>;
  setIsRotatingListener: Setter<boolean>;
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

  // Room ref for coordinate calculations
  roomRef: Accessor<HTMLDivElement | undefined>;
  setRoomRef: (ref: HTMLDivElement | undefined) => void;

  // Room actions
  addRoom: (start: Position, end: Position) => void;
  deleteSelectedRoom: () => void;
  updateRoomAttenuation: (attenuation: number) => void;
  updateRoomLabel: (label: string) => void;
  updateRoomColor: (color: string) => void;
  handleRoomClick: (roomId: string) => (e: MouseEvent) => void;

  // Speaker actions
  addSpeaker: () => void;
  deleteSelectedSpeaker: () => void;
  updateDirectivity: (pattern: DirectivityPattern) => void;
  updateFrequency: (frequency: number) => void;
  updateSpeakerColor: (color: string) => void;

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
  handleListenerMove: (e: MouseEvent) => void;
  handleListenerRotate: (e: MouseEvent) => void;
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

  // Listener state
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 0, y: 0 });
  const [listenerFacing, setListenerFacing] = createSignal(0);

  // Speakers state
  const [speakers, setSpeakers] = createSignal<SpeakerState[]>([
    {
      id: "speaker-1",
      position: { x: -1, y: 0 },
      facing: 0,
      color: SPEAKER_COLORS[0],
      directivity: "cardioid",
      frequency: 440,
    },
  ]);

  // UI state
  const [selectedSpeaker, setSelectedSpeaker] = createSignal<string>("speaker-1");
  const [isDraggingListener, setIsDraggingListener] = createSignal(false);
  const [isRotatingListener, setIsRotatingListener] = createSignal(false);
  const [isMovingSpeaker, setIsMovingSpeaker] = createSignal<string | null>(null);
  const [isRotatingSpeaker, setIsRotatingSpeaker] = createSignal<string | null>(null);

  // Audio settings
  const [distanceModel, setDistanceModel] = createSignal<DistanceModel>("inverse");
  const [maxDistance, setMaxDistance] = createSignal(DEFAULT_MAX_DISTANCE);
  const [rearGainFloor, setRearGainFloor] = createSignal(DEFAULT_REAR_GAIN);

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

  // Audio parameter calculation
  const getAudioParams = (speaker: SpeakerState) => {
    const listener = createListener(listenerPos(), listenerFacing());
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

  const updateRoomAttenuation = (attenuation: number) => {
    const id = selectedRoomId();
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
    const index = speakers().length;
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
    };
    setSpeakers((prev) => [...prev, newSpeaker]);
    setSelectedSpeaker(newSpeaker.id);
  };

  const deleteSelectedSpeaker = () => {
    const id = selectedSpeaker();
    if (!id) return;
    stopPlayback(id);
    setSpeakers((prev) => prev.filter((s) => s.id !== id));
    const remaining = speakers().filter((s) => s.id !== id);
    if (remaining.length > 0) {
      setSelectedSpeaker(remaining[0].id);
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
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, frequency } : s))
    );
    const nodes = audioNodes.get(speakerId);
    if (nodes) {
      nodes.oscillator.frequency.value = frequency;
    }
  };

  const updateSpeakerColor = (color: string) => {
    const speakerId = selectedSpeaker();
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, color } : s))
    );
  };

  // ============================================================================
  // AUDIO ACTIONS
  // ============================================================================

  const startPlayback = (speakerId: string) => {
    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = speaker.frequency;
    oscillator.type = "sine";

    const params = getAudioParams(speaker);
    gainNode.gain.value = params.volume;
    panner.pan.value = params.pan;

    oscillator.start();

    audioNodes.set(speakerId, { oscillator, gainNode, panner });
    setPlayingSpeakers((prev) => new Set([...prev, speakerId]));
  };

  const stopPlayback = (speakerId: string) => {
    const nodes = audioNodes.get(speakerId);
    if (nodes) {
      nodes.oscillator.stop();
      nodes.oscillator.disconnect();
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

  const handleListenerMove = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setIsDraggingListener(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setListenerPos(getPositionFromEvent(moveEvent, roomRefValue));
    };

    const handleMouseUp = () => {
      setIsDraggingListener(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleListenerRotate = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setIsRotatingListener(true);

    let currentAngle = listenerFacing();
    let prevRawAngle = Math.atan2(
      e.clientY - getScreenPosition(listenerPos(), roomRefValue).y,
      e.clientX - getScreenPosition(listenerPos(), roomRefValue).x
    );

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const listenerScreen = getScreenPosition(listenerPos(), roomRefValue);
      const rawAngle = Math.atan2(
        moveEvent.clientY - listenerScreen.y,
        moveEvent.clientX - listenerScreen.x
      );

      let delta = rawAngle - prevRawAngle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      currentAngle += delta;
      prevRawAngle = rawAngle;

      setListenerFacing(currentAngle);
    };

    const handleMouseUp = () => {
      setIsRotatingListener(false);
      const normalized = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle));
      setListenerFacing(normalized);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleSpeakerMoveStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsMovingSpeaker(speakerId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent, roomRefValue);
      setSpeakers((prev) =>
        prev.map((s) => (s.id === speakerId ? { ...s, position: pos } : s))
      );
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
    let prevRawAngle = Math.atan2(
      e.clientY - speakerScreen.y,
      e.clientX - speakerScreen.x
    );

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
    setRooms([]);
    setSelectedRoomId(null);
    setNextColorIndex(0);
    setDrawingMode("select");
    setListenerPos({ x: 0, y: 0 });
    setListenerFacing(0);
    setSpeakers([
      {
        id: "speaker-1",
        position: { x: -1, y: 0 },
        facing: 0,
        color: SPEAKER_COLORS[0],
        directivity: "cardioid",
        frequency: 440,
      },
    ]);
    setSelectedSpeaker("speaker-1");
    setDistanceModel("inverse");
  };

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Update audio in real-time when anything changes
  createEffect(() => {
    const lPos = listenerPos();
    const lFacing = listenerFacing();
    const speakerList = speakers();
    const dModel = distanceModel();
    const masterVol = audioStore.masterVolume();
    const audioContext = audioStore.getAudioContext();

    // Track dependencies
    void lPos;
    void lFacing;
    void dModel;
    void masterVol;

    if (!audioContext) return;

    for (const speaker of speakerList) {
      const nodes = audioNodes.get(speaker.id);
      if (nodes) {
        const params = getAudioParams(speaker);
        nodes.gainNode.gain.linearRampToValueAtTime(
          params.volume,
          audioContext.currentTime + 0.02
        );
        nodes.panner.pan.value = params.pan;
      }
    }
  });

  // Cleanup on unmount
  onCleanup(() => {
    stopAllPlayback();
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

    // Listener state
    listenerPos,
    setListenerPos,
    listenerFacing,
    setListenerFacing,

    // Speaker state
    speakers,
    setSpeakers,
    selectedSpeaker,
    setSelectedSpeaker,
    getSelectedSpeaker,

    // Interaction state
    isDraggingListener,
    setIsDraggingListener,
    isRotatingListener,
    setIsRotatingListener,
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
    handleListenerMove,
    handleListenerRotate,
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
