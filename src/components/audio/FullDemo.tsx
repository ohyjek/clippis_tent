/**
 * FullDemo.tsx - Complete Spatial Audio Playground
 *
 * The comprehensive demo combining all spatial audio features:
 * - Draw rooms by clicking and dragging
 * - Draggable listener with facing direction
 * - Multiple speakers with configurable directivity patterns
 * - Continuous tone playback with real-time updates
 * - Room boundaries with configurable wall attenuation
 * - Multiple distance attenuation models
 */
import { createSignal, createEffect, onCleanup, For, Show } from "solid-js";
import {
  Position,
  Wall,
  SPEAKER_COLORS,
} from "@/lib/spatial-audio";
import {
  DirectivityPattern,
  DistanceModel,
  calculateAudioParameters,
  createListener,
} from "@/lib/spatial-audio-engine";
import { audioStore } from "@/stores/audio";
import { Button, Slider, Speaker } from "@/components/ui";
import styles from "./FullDemo.module.css";

/** Extended speaker data for UI state */
interface SpeakerState {
  id: string;
  position: Position;
  facing: number;
  color: string;
  directivity: DirectivityPattern;
  frequency: number;
}

/** Audio nodes for continuous playback */
interface AudioNodes {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  panner: StereoPannerNode;
}

/** Room with bounds for drawing */
interface DrawnRoom {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  walls: Wall[];
  center: Position;
  color: string;
  attenuation: number;
}

type DrawingMode = "select" | "draw";

// Room colors
const ROOM_COLORS = [
  "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b",
  "#ef4444", "#ec4899", "#6366f1", "#14b8a6",
];

const DEFAULT_ATTENUATION = 0.7;

/**
 * Musical note names with octave
 * Maps common frequencies to their note names
 */
const FREQUENCY_NOTES: Record<number, string> = {
  220: "A3",
  233: "A#3",
  247: "B3",
  262: "C4",
  277: "C#4",
  294: "D4",
  311: "D#4",
  330: "E4",
  349: "F4",
  370: "F#4",
  392: "G4",
  415: "G#4",
  440: "A4",
  466: "A#4",
  494: "B4",
  523: "C5",
  554: "C#5",
  587: "D5",
  622: "D#5",
  659: "E5",
  698: "F5",
  740: "F#5",
  784: "G5",
  831: "G#5",
  880: "A5",
};

/** Get closest note name for a frequency */
function getNoteName(frequency: number): string {
  // Find closest match
  let closest = 440;
  let minDiff = Math.abs(frequency - 440);

  for (const freq of Object.keys(FREQUENCY_NOTES).map(Number)) {
    const diff = Math.abs(frequency - freq);
    if (diff < minDiff) {
      minDiff = diff;
      closest = freq;
    }
  }

  return FREQUENCY_NOTES[closest] ?? "A4";
}

/** Create walls from bounds */
function createWallsFromBounds(bounds: { x: number; y: number; width: number; height: number }): Wall[] {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const left = bounds.x - halfW;
  const right = bounds.x + halfW;
  const top = bounds.y - halfH;
  const bottom = bounds.y + halfH;

  return [
    { start: { x: left, y: top }, end: { x: right, y: top } },
    { start: { x: right, y: top }, end: { x: right, y: bottom } },
    { start: { x: right, y: bottom }, end: { x: left, y: bottom } },
    { start: { x: left, y: bottom }, end: { x: left, y: top } },
  ];
}

/** Create room from two corners */
function createRoomFromCorners(start: Position, end: Position, id: string, color: string): DrawnRoom {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);

  const width = maxX - minX;
  const height = maxY - minY;
  const center = { x: minX + width / 2, y: minY + height / 2 };

  const bounds = { x: center.x, y: center.y, width, height };
  const walls = createWallsFromBounds(bounds);

  return {
    id,
    label: `Room ${id.slice(-4)}`,
    bounds,
    walls,
    center,
    color,
    attenuation: DEFAULT_ATTENUATION,
  };
}

/** Drawing preview component */
function DrawingPreview(props: {
  start: () => Position | null;
  end: () => Position | null;
  toPercent: (val: number) => number;
}) {
  const start = () => props.start();
  const end = () => props.end();

  const left = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.min(props.toPercent(s.x), props.toPercent(e.x));
  };

  const top = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.min(props.toPercent(s.y), props.toPercent(e.y));
  };

  const widthPct = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.abs(props.toPercent(e.x) - props.toPercent(s.x));
  };

  const heightPct = () => {
    const s = start();
    const e = end();
    if (!s || !e) return 0;
    return Math.abs(props.toPercent(e.y) - props.toPercent(s.y));
  };

  const dimensions = () => {
    const s = start();
    const e = end();
    if (!s || !e) return "0.0 × 0.0";
    const w = Math.abs(e.x - s.x).toFixed(1);
    const h = Math.abs(e.y - s.y).toFixed(1);
    return `${w} × ${h}`;
  };

  return (
    <div
      class={styles.drawPreview}
      style={{
        left: `${left()}%`,
        top: `${top()}%`,
        width: `${widthPct()}%`,
        height: `${heightPct()}%`,
      }}
      data-dimensions={dimensions()}
    />
  );
}

export function FullDemo() {
  let roomRef: HTMLDivElement | undefined;

  // Room state - now mutable for drawing
  const [rooms, setRooms] = createSignal<DrawnRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = createSignal(0);

  // Drawing state
  const [drawingMode, setDrawingMode] = createSignal<DrawingMode>("select");
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [drawStart, setDrawStart] = createSignal<Position | null>(null);
  const [drawEnd, setDrawEnd] = createSignal<Position | null>(null);

  // Get all walls from all rooms
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);

  // Get selected room
  const selectedRoom = () => rooms().find((r) => r.id === selectedRoomId());

  // Listener state (position + facing, same as speakers)
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

  // Playing state - manage audio nodes directly for proper reactivity
  const [playingSpeakers, setPlayingSpeakers] = createSignal<Set<string>>(new Set());
  const audioNodes = new Map<string, AudioNodes>();

  // Calculate effective attenuation per wall
  const effectiveAttenuation = (): number => {
    const roomList = rooms();
    if (roomList.length === 0) return DEFAULT_ATTENUATION;
    const sum = roomList.reduce((acc, r) => acc + r.attenuation, 0);
    return sum / roomList.length;
  };

  // Directivity pattern options
  const directivityOptions = [
    { value: "omnidirectional", label: "Omni (all directions)" },
    { value: "cardioid", label: "Cardioid (heart-shaped)" },
    { value: "supercardioid", label: "Supercardioid (tighter)" },
    { value: "hypercardioid", label: "Hypercardioid (very tight)" },
    { value: "figure8", label: "Figure-8 (front + back)" },
    { value: "hemisphere", label: "Hemisphere (front only)" },
  ];

  // Distance model options
  const distanceModelOptions = [
    { value: "inverse", label: "Inverse (natural)" },
    { value: "linear", label: "Linear (predictable)" },
    { value: "exponential", label: "Exponential (dramatic)" },
  ];

  // Convert mouse event to room coordinates
  const getPositionFromEvent = (e: MouseEvent): Position => {
    if (!roomRef) return { x: 0, y: 0 };
    const rect = roomRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    return {
      x: Math.max(-2.4, Math.min(2.4, x)),
      y: Math.max(-2.4, Math.min(2.4, y)),
    };
  };

  // Get screen position for angle calculations
  const getScreenPosition = (pos: Position): { x: number; y: number } => {
    if (!roomRef) return { x: 0, y: 0 };
    const rect = roomRef.getBoundingClientRect();
    return {
      x: rect.left + (0.5 + pos.x * 0.2) * rect.width,
      y: rect.top + (0.5 + pos.y * 0.2) * rect.height,
    };
  };

  // Convert room coordinates to percentage for rendering
  const toPercent = (val: number) => 50 + val * 20;

  // ============================================================================
  // DRAWING HANDLERS
  // ============================================================================

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (drawingMode() !== "draw") return;

    const pos = getPositionFromEvent(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawEnd(pos);
  };

  const handleCanvasMouseMove = (e: MouseEvent) => {
    if (!isDrawing()) return;
    setDrawEnd(getPositionFromEvent(e));
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing()) return;

    const start = drawStart();
    const end = drawEnd();

    if (start && end) {
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
    }

    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  };

  // ============================================================================
  // ROOM MANAGEMENT
  // ============================================================================

  const handleRoomClick = (roomId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    if (drawingMode() === "select") {
      setSelectedRoomId(roomId);
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
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, attenuation } : r))
    );
  };

  // ============================================================================
  // LISTENER HANDLERS
  // ============================================================================

  // Listener move handling
  const handleListenerMove = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setIsDraggingListener(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setListenerPos(getPositionFromEvent(moveEvent));
    };

    const handleMouseUp = () => {
      setIsDraggingListener(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Listener rotation handling (with continuous angle tracking)
  const handleListenerRotate = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setIsRotatingListener(true);

    // Track cumulative angle to avoid flicker at ±π boundary
    let currentAngle = listenerFacing();
    let prevRawAngle = Math.atan2(
      e.clientY - getScreenPosition(listenerPos()).y,
      e.clientX - getScreenPosition(listenerPos()).x
    );

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const listenerScreen = getScreenPosition(listenerPos());
      const rawAngle = Math.atan2(
        moveEvent.clientY - listenerScreen.y,
        moveEvent.clientX - listenerScreen.x
      );

      // Calculate delta, handling wrap-around
      let delta = rawAngle - prevRawAngle;
      if (delta > Math.PI) delta -= 2 * Math.PI;
      if (delta < -Math.PI) delta += 2 * Math.PI;

      currentAngle += delta;
      prevRawAngle = rawAngle;

      setListenerFacing(currentAngle);
    };

    const handleMouseUp = () => {
      setIsRotatingListener(false);
      // Normalize angle to [-π, π] when done
      const normalized = Math.atan2(Math.sin(currentAngle), Math.cos(currentAngle));
      setListenerFacing(normalized);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Speaker move handling
  const handleSpeakerMoveStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsMovingSpeaker(speakerId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent);
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

  // Speaker rotate handling (with continuous angle tracking)
  const handleSpeakerRotateStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsRotatingSpeaker(speakerId);

    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

    // Track cumulative angle to avoid flicker at ±π boundary
    let currentAngle = speaker.facing;
    const speakerScreen = getScreenPosition(speaker.position);
    let prevRawAngle = Math.atan2(
      e.clientY - speakerScreen.y,
      e.clientX - speakerScreen.x
    );

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentSpeaker = speakers().find((s) => s.id === speakerId);
      if (!currentSpeaker) return;

      const currentScreen = getScreenPosition(currentSpeaker.position);
      const rawAngle = Math.atan2(
        moveEvent.clientY - currentScreen.y,
        moveEvent.clientX - currentScreen.x
      );

      // Calculate delta, handling wrap-around
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
      // Normalize angle to [-π, π] when done
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

  // Canvas click to initialize audio (when not drawing)
  const handleCanvasClick = () => {
    if (drawingMode() === "select") {
      audioStore.initializeAudio();
      setSelectedRoomId(null); // Deselect room when clicking empty space
    }
  };

  // Calculate audio parameters for a speaker
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
    // Convert attenuation (0-1) to "transmission" (what gets through)
    const transmission = 1 - effectiveAttenuation();
    return calculateAudioParameters(
      sourceConfig,
      listener,
      allWalls(),
      distanceModel(),
      audioStore.masterVolume(),
      transmission
    );
  };

  // Start continuous playback for a speaker
  const startPlayback = (speakerId: string) => {
    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

    // Create audio nodes
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = speaker.frequency;
    oscillator.type = "sine";

    // Set initial params
    const params = getAudioParams(speaker);
    gainNode.gain.value = params.volume;
    panner.pan.value = params.pan;

    oscillator.start();

    // Store nodes
    audioNodes.set(speakerId, { oscillator, gainNode, panner });
    setPlayingSpeakers((prev) => new Set([...prev, speakerId]));
  };

  // Stop playback for a speaker
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

  // Toggle playback
  const togglePlayback = (speakerId: string) => {
    if (playingSpeakers().has(speakerId)) {
      stopPlayback(speakerId);
    } else {
      startPlayback(speakerId);
    }
  };

  // Stop all playback
  const stopAllPlayback = () => {
    for (const id of audioNodes.keys()) {
      stopPlayback(id);
    }
  };

  // Update audio in real-time when anything changes
  createEffect(() => {
    // Track all dependencies
    const lPos = listenerPos();
    const lFacing = listenerFacing();
    const speakerList = speakers();
    const dModel = distanceModel();
    const masterVol = audioStore.masterVolume();
    const audioContext = audioStore.getAudioContext();

    // Suppress unused variable warnings
    void lPos;
    void lFacing;
    void dModel;
    void masterVol;

    if (!audioContext) return;

    // Update all playing speakers
    for (const speaker of speakerList) {
      const nodes = audioNodes.get(speaker.id);
      if (nodes) {
        const params = getAudioParams(speaker);
        // Smooth volume transitions
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

  // Calculate display gain for UI (for the cone opacity)
  const calculateDisplayGain = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.directionalGain * params.wallAttenuation;
  };

  // Get wall count for status display
  const getWallCount = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.wallCount;
  };

  // Add a new speaker
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

  // Update selected speaker's directivity
  const updateDirectivity = (pattern: DirectivityPattern) => {
    const speakerId = selectedSpeaker();
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, directivity: pattern } : s))
    );
  };

  // Update selected speaker's frequency
  const updateFrequency = (frequency: number) => {
    const speakerId = selectedSpeaker();
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, frequency } : s))
    );
    // Update playing audio if active
    const nodes = audioNodes.get(speakerId);
    if (nodes) {
      nodes.oscillator.frequency.value = frequency;
    }
  };

  // Delete selected speaker
  const deleteSelectedSpeaker = () => {
    const id = selectedSpeaker();
    if (!id) return;
    stopPlayback(id);
    setSpeakers((prev) => prev.filter((s) => s.id !== id));
    // Select another speaker if available
    const remaining = speakers().filter((s) => s.id !== id);
    if (remaining.length > 0) {
      setSelectedSpeaker(remaining[0].id);
    }
  };

  // Update room label
  const updateRoomLabel = (label: string) => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, label } : r))
    );
  };

  // Update room color
  const updateRoomColor = (color: string) => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, color } : r))
    );
  };

  // Reset to initial state
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

  // Get selected speaker
  const getSelectedSpeaker = () => speakers().find((s) => s.id === selectedSpeaker());

  // Check if playing
  const isPlaying = (speakerId: string) => playingSpeakers().has(speakerId);

  return (
    <div class={styles.container}>
      {/* Toolbar */}
      <div class={styles.toolbar}>
        <div class={styles.toolbarGroup}>
          <span class={styles.toolLabel}>Mode</span>
          <Button
            variant={drawingMode() === "select" ? "primary" : "outline"}
            icon="👆"
            onClick={() => setDrawingMode("select")}
          >
            Select
          </Button>
          <Button
            variant={drawingMode() === "draw" ? "primary" : "outline"}
            icon="✏️"
            onClick={() => setDrawingMode("draw")}
          >
            Draw Room
          </Button>
        </div>
        <div class={styles.toolbarGroup}>
          <span class={styles.toolLabel}>Audio</span>
          <Button variant="primary" icon="➕" onClick={addSpeaker}>
            Add Speaker
          </Button>
          <Button
            variant={isPlaying(selectedSpeaker()) ? "danger" : "success"}
            icon={isPlaying(selectedSpeaker()) ? "⏹️" : "🔊"}
            onClick={() => togglePlayback(selectedSpeaker())}
          >
            {isPlaying(selectedSpeaker()) ? "Stop" : "Play"}
          </Button>
        </div>
        <div class={styles.toolbarGroup}>
          <span class={styles.toolLabel}>Volume</span>
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={audioStore.masterVolume()}
            onInput={(e) => audioStore.updateMasterVolume(parseFloat(e.currentTarget.value))}
            showValue
          />
        </div>
        <Button variant="outline" icon="🔄" onClick={resetDemo}>
          Reset
        </Button>
      </div>

      {!audioStore.audioInitialized() && (
        <div class={styles.banner}>
          <p>
            🔊 <strong>Click anywhere</strong> to enable audio, then click a speaker to start!
          </p>
        </div>
      )}

      {/* Main content: Canvas + Sidebar */}
      <div class={styles.mainContent}>
        {/* Canvas area */}
        <div class={styles.canvasWrapper}>
          <h3 class={styles.canvasTitle}>
            {drawingMode() === "draw" ? "Click and drag to draw a room" : "Spatial Audio Playground"}
          </h3>

          <div
            class={`${styles.canvas} ${drawingMode() === "select" ? styles.selectMode : ""}`}
            ref={roomRef}
            onClick={handleCanvasClick}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            {/* Grid overlay */}
            <div class={styles.gridOverlay} />

            {/* Drawing preview */}
            <Show when={isDrawing() && drawStart()}>
              <DrawingPreview start={drawStart} end={drawEnd} toPercent={toPercent} />
            </Show>

            {/* Room boundaries */}
            <For each={rooms()}>
              {(room) => {
                const b = room.bounds;
                const left = toPercent(b.x - b.width / 2);
                const top = toPercent(b.y - b.height / 2);
                const width = b.width * 20;
                const height = b.height * 20;

                return (
                  <>
                    <div
                      class={`${styles.roomArea} ${selectedRoomId() === room.id ? styles.selected : ""} ${drawingMode() === "draw" ? styles.drawModeRoom : ""}`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        "border-color": room.color,
                        background: `${room.color}20`,
                      }}
                      onClick={handleRoomClick(room.id)}
                    >
                      <span class={styles.roomLabel}>{room.label}</span>
                    </div>
                    <For each={room.walls}>
                      {(wall) => {
                        const isVertical = wall.start.x === wall.end.x;
                        const length = isVertical
                          ? Math.abs(wall.end.y - wall.start.y)
                          : Math.abs(wall.end.x - wall.start.x);

                        return (
                          <div
                            class={`${styles.wall} ${isVertical ? styles.vertical : styles.horizontal}`}
                            style={{
                              left: `${toPercent(Math.min(wall.start.x, wall.end.x))}%`,
                              top: `${toPercent(Math.min(wall.start.y, wall.end.y))}%`,
                              [isVertical ? "height" : "width"]: `${length * 20}%`,
                              background: room.color,
                            }}
                          />
                        );
                      }}
                    </For>
                  </>
                );
              }}
            </For>

            {/* Sound path lines */}
            <svg class={styles.pathSvg}>
              <For each={speakers()}>
                {(speaker) => {
                  const wallCount = getWallCount(speaker);
                  return (
                    <line
                      x1={`${toPercent(speaker.position.x)}%`}
                      y1={`${toPercent(speaker.position.y)}%`}
                      x2={`${toPercent(listenerPos().x)}%`}
                      y2={`${toPercent(listenerPos().y)}%`}
                      class={`${styles.pathLine} ${wallCount > 0 ? styles.blocked : ""}`}
                      stroke-dasharray={wallCount > 0 ? "5,5" : "none"}
                      opacity={selectedSpeaker() === speaker.id ? 1 : 0.3}
                    />
                  );
                }}
              </For>
            </svg>

            {/* Speakers */}
            <For each={speakers()}>
              {(speaker) => (
                <Speaker
                  id={speaker.id}
                  position={speaker.position}
                  color={speaker.color}
                  facing={speaker.facing}
                  gain={calculateDisplayGain(speaker)}
                  isSelected={selectedSpeaker() === speaker.id}
                  isPlaying={isPlaying(speaker.id)}
                  isMoving={isMovingSpeaker() === speaker.id}
                  isRotating={isRotatingSpeaker() === speaker.id}
                  onClick={() => {
                    setSelectedSpeaker(speaker.id);
                    togglePlayback(speaker.id);
                  }}
                  onMoveStart={handleSpeakerMoveStart(speaker.id)}
                  onRotateStart={handleSpeakerRotateStart(speaker.id)}
                  style={{
                    left: `${toPercent(speaker.position.x)}%`,
                    top: `${toPercent(speaker.position.y)}%`,
                  }}
                />
              )}
            </For>

            {/* Listener */}
            <Speaker
              id="listener"
              position={listenerPos()}
              color="#3b82f6"
              facing={listenerFacing()}
              gain={1}
              isSelected={false}
              isPlaying={false}
              isMoving={isDraggingListener()}
              isRotating={isRotatingListener()}
              icon="🎧"
              onMoveStart={handleListenerMove}
              onRotateStart={handleListenerRotate}
              style={{
                left: `${toPercent(listenerPos().x)}%`,
                top: `${toPercent(listenerPos().y)}%`,
              }}
            />
          </div>

          <div class={styles.statusBar}>
            <span>🎧 ({listenerPos().x.toFixed(1)}, {listenerPos().y.toFixed(1)})</span>
            <span>{rooms().length} room{rooms().length !== 1 ? "s" : ""}</span>
            <span>
              {speakers().length} speaker{speakers().length !== 1 ? "s" : ""}
              {playingSpeakers().size > 0 && ` (${playingSpeakers().size} playing)`}
            </span>
            <span class={styles.hint}>
              {drawingMode() === "draw" ? "Click and drag to draw" : "Drag to move • Click to select"}
            </span>
          </div>
        </div>

        {/* Sidebar */}
        <div class={styles.sidebar}>
          {/* Speaker Properties */}
          <Show when={getSelectedSpeaker()}>
            {(speaker) => (
              <div class={styles.panel}>
                <h4 class={styles.panelTitle}>🎤 Speaker Properties</h4>

                <div class={styles.propertyGroup}>
                  <label class={styles.propertyLabel}>Pattern</label>
                  <select
                    class={styles.propertySelect}
                    value={speaker().directivity}
                    onChange={(e) => updateDirectivity(e.currentTarget.value as DirectivityPattern)}
                  >
                    <For each={directivityOptions}>
                      {(opt) => <option value={opt.value}>{opt.label}</option>}
                    </For>
                  </select>
                </div>

                <div class={styles.propertyGroup}>
                  <label class={styles.propertyLabel}>
                    Note: {getNoteName(speaker().frequency)} ({speaker().frequency} Hz)
                  </label>
                  <input
                    type="range"
                    class={styles.propertySlider}
                    min="220"
                    max="880"
                    step="10"
                    value={speaker().frequency}
                    onInput={(e) => updateFrequency(parseInt(e.currentTarget.value))}
                  />
                  <div class={styles.sliderLabels}>
                    <span>A3 (220)</span>
                    <span>A5 (880)</span>
                  </div>
                </div>

                <div class={styles.propertyGroup}>
                  <label class={styles.propertyLabel}>Color</label>
                  <div class={styles.colorSwatches}>
                    <For each={SPEAKER_COLORS}>
                      {(color) => (
                        <div
                          class={`${styles.colorSwatch} ${speaker().color === color ? styles.selected : ""}`}
                          style={{ background: color }}
                          onClick={() => {
                            setSpeakers((prev) =>
                              prev.map((s) => (s.id === speaker().id ? { ...s, color } : s))
                            );
                          }}
                        />
                      )}
                    </For>
                  </div>
                </div>

                <div class={styles.propertyGroup}>
                  <Button
                    variant={isPlaying(speaker().id) ? "danger" : "success"}
                    icon={isPlaying(speaker().id) ? "⏹️" : "▶️"}
                    onClick={() => togglePlayback(speaker().id)}
                  >
                    {isPlaying(speaker().id) ? "Stop" : "Play"}
                  </Button>
                  <Show when={speakers().length > 1}>
                    <Button variant="danger" icon="🗑️" onClick={deleteSelectedSpeaker}>
                      Delete
                    </Button>
                  </Show>
                </div>
              </div>
            )}
          </Show>

          {/* Room Properties */}
          <Show when={selectedRoom()}>
            {(room) => (
              <div class={styles.panel}>
                <h4 class={styles.panelTitle}>🚪 Room Properties</h4>

                <div class={styles.propertyGroup}>
                  <label class={styles.propertyLabel}>Name</label>
                  <input
                    type="text"
                    class={styles.propertyInput}
                    value={room().label}
                    onInput={(e) => updateRoomLabel(e.currentTarget.value)}
                  />
                </div>

                <div class={styles.propertyGroup}>
                  <label class={styles.propertyLabel}>Color</label>
                  <div class={styles.colorSwatches}>
                    <For each={ROOM_COLORS}>
                      {(color) => (
                        <div
                          class={`${styles.colorSwatch} ${room().color === color ? styles.selected : ""}`}
                          style={{ background: color }}
                          onClick={() => updateRoomColor(color)}
                        />
                      )}
                    </For>
                  </div>
                </div>

                <div class={styles.propertyGroup}>
                  <label class={styles.propertyLabel}>
                    Wall Attenuation: {Math.round(room().attenuation * 100)}%
                  </label>
                  <input
                    type="range"
                    class={styles.propertySlider}
                    min="0"
                    max="100"
                    value={room().attenuation * 100}
                    onInput={(e) => updateRoomAttenuation(parseInt(e.currentTarget.value) / 100)}
                  />
                  <div class={styles.sliderLabels}>
                    <span>Transparent</span>
                    <span>Solid</span>
                  </div>
                </div>

                <div class={styles.propertyGroup}>
                  <Button variant="danger" icon="🗑️" onClick={deleteSelectedRoom}>
                    Delete Room
                  </Button>
                </div>
              </div>
            )}
          </Show>

          {/* Audio Settings */}
          <div class={styles.panel}>
            <h4 class={styles.panelTitle}>⚙️ Audio Settings</h4>

            <div class={styles.propertyGroup}>
              <label class={styles.propertyLabel}>Distance Model</label>
              <select
                class={styles.propertySelect}
                value={distanceModel()}
                onChange={(e) => setDistanceModel(e.currentTarget.value as DistanceModel)}
              >
                <For each={distanceModelOptions}>
                  {(opt) => <option value={opt.value}>{opt.label}</option>}
                </For>
              </select>
            </div>
          </div>

          {/* Speakers List */}
          <div class={styles.panel}>
            <h4 class={styles.panelTitle}>🎤 Speakers</h4>
            <div class={styles.itemList}>
              <For each={speakers()}>
                {(speaker) => (
                  <div
                    class={`${styles.listItem} ${selectedSpeaker() === speaker.id ? styles.selected : ""}`}
                    onClick={() => setSelectedSpeaker(speaker.id)}
                  >
                    <div class={styles.itemSwatch} style={{ background: speaker.color }} />
                    <span class={styles.itemName}>
                      {getNoteName(speaker.frequency)} ({speaker.frequency} Hz)
                      {isPlaying(speaker.id) && " 🔊"}
                    </span>
                  </div>
                )}
              </For>
            </div>
          </div>

          {/* Rooms List */}
          <div class={styles.panel}>
            <h4 class={styles.panelTitle}>🚪 Rooms</h4>
            <Show
              when={rooms().length > 0}
              fallback={<div class={styles.emptyState}>No rooms yet. Draw one!</div>}
            >
              <div class={styles.itemList}>
                <For each={rooms()}>
                  {(room) => (
                    <div
                      class={`${styles.listItem} ${selectedRoomId() === room.id ? styles.selected : ""}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div class={styles.itemSwatch} style={{ background: room.color }} />
                      <span class={styles.itemName}>{room.label}</span>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </div>
      </div>
    </div>
  );
}
