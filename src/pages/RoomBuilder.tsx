/**
 * RoomBuilder.tsx - Room Building Tool
 *
 * A dedicated page for creating and editing rooms with:
 * - Rectangle drawing via click-drag
 * - Room list with selection, rename, delete
 * - Speaker and listener placement with real-time audio
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
import { Button, Speaker } from "@/components/ui";
import styles from "./RoomBuilder.module.css";

// ============================================================================
// TYPES
// ============================================================================

/** Room with bounds for the builder */
interface BuilderRoom {
  id: string;
  label: string;
  bounds: { x: number; y: number; width: number; height: number };
  walls: Wall[];
  center: Position;
  color: string;
}

/** Speaker state */
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

type DrawingMode = "select" | "rectangle";

// Room colors palette
const ROOM_COLORS = [
  "#8b5cf6", // Purple
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#ec4899", // Pink
  "#6366f1", // Indigo
  "#14b8a6", // Teal
];

// ============================================================================
// HELPERS
// ============================================================================

/** Convert room coordinates to CSS percentage */
const toPercent = (val: number) => 50 + val * 20;

/** Create walls from bounds */
function createWallsFromBounds(bounds: { x: number; y: number; width: number; height: number }): Wall[] {
  const halfW = bounds.width / 2;
  const halfH = bounds.height / 2;
  const left = bounds.x - halfW;
  const right = bounds.x + halfW;
  const top = bounds.y - halfH;
  const bottom = bounds.y + halfH;

  return [
    { start: { x: left, y: top }, end: { x: right, y: top } },     // Top
    { start: { x: right, y: top }, end: { x: right, y: bottom } }, // Right
    { start: { x: right, y: bottom }, end: { x: left, y: bottom } }, // Bottom
    { start: { x: left, y: bottom }, end: { x: left, y: top } },   // Left
  ];
}

/** Create a new room from two corner positions */
function createRoomFromCorners(start: Position, end: Position, id: string, color: string): BuilderRoom {
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
  };
}

// ============================================================================
// DRAWING PREVIEW COMPONENT
// ============================================================================

interface DrawingPreviewProps {
  start: () => Position | null;
  end: () => Position | null;
  toPercent: (val: number) => number;
}

function DrawingPreview(props: DrawingPreviewProps) {
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

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function RoomBuilder() {
  let canvasRef: HTMLDivElement | undefined;

  // Room state
  const [rooms, setRooms] = createSignal<BuilderRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = createSignal<string | null>(null);
  const [nextColorIndex, setNextColorIndex] = createSignal(0);
  const [isDraggingRoom, setIsDraggingRoom] = createSignal<string | null>(null);
  const [isResizingRoom, setIsResizingRoom] = createSignal<{
    roomId: string;
    handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w";
  } | null>(null);

  // Drawing state
  const [drawingMode, setDrawingMode] = createSignal<DrawingMode>("rectangle");
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [drawStart, setDrawStart] = createSignal<Position | null>(null);
  const [drawEnd, setDrawEnd] = createSignal<Position | null>(null);

  // Listener state
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 0, y: 0 });
  const [listenerFacing, setListenerFacing] = createSignal(0);
  const [isDraggingListener, setIsDraggingListener] = createSignal(false);
  const [isRotatingListener, setIsRotatingListener] = createSignal(false);

  // Speaker state
  const [speakers, setSpeakers] = createSignal<SpeakerState[]>([]);
  const [selectedSpeaker, setSelectedSpeaker] = createSignal<string | null>(null);
  const [isMovingSpeaker, setIsMovingSpeaker] = createSignal<string | null>(null);
  const [isRotatingSpeaker, setIsRotatingSpeaker] = createSignal<string | null>(null);

  // Audio state
  const [distanceModel] = createSignal<DistanceModel>("inverse");
  const [playingSpeakers, setPlayingSpeakers] = createSignal<Set<string>>(new Set());
  const audioNodes = new Map<string, AudioNodes>();

  // Get all walls from all rooms
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);

  // Get selected room
  const selectedRoom = () => rooms().find((r) => r.id === selectedRoomId());

  // ============================================================================
  // COORDINATE HELPERS
  // ============================================================================

  const getPositionFromEvent = (e: MouseEvent): Position => {
    if (!canvasRef) return { x: 0, y: 0 };
    const rect = canvasRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    return {
      x: Math.max(-2.4, Math.min(2.4, x)),
      y: Math.max(-2.4, Math.min(2.4, y)),
    };
  };

  const getScreenPosition = (pos: Position): { x: number; y: number } => {
    if (!canvasRef) return { x: 0, y: 0 };
    const rect = canvasRef.getBoundingClientRect();
    return {
      x: rect.left + (0.5 + pos.x * 0.2) * rect.width,
      y: rect.top + (0.5 + pos.y * 0.2) * rect.height,
    };
  };

  // ============================================================================
  // DRAWING HANDLERS
  // ============================================================================

  const handleCanvasMouseDown = (e: MouseEvent) => {
    if (drawingMode() !== "rectangle") return;
    
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
      // Only create room if it has some size
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

  const updateRoomLabel = (label: string) => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, label } : r))
    );
  };

  const updateRoomColor = (color: string) => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, color } : r))
    );
  };

  const deleteSelectedRoom = () => {
    const id = selectedRoomId();
    if (!id) return;
    setRooms((prev) => prev.filter((r) => r.id !== id));
    setSelectedRoomId(null);
  };

  /** Start dragging a room to reposition it */
  const handleRoomDragStart = (roomId: string) => (e: MouseEvent) => {
    // Only allow dragging in select mode
    if (drawingMode() !== "select") return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setSelectedRoomId(roomId);
    setIsDraggingRoom(roomId);

    const room = rooms().find((r) => r.id === roomId);
    if (!room) return;

    // Track offset from click position to room center
    const startPos = getPositionFromEvent(e);
    const offsetX = room.bounds.x - startPos.x;
    const offsetY = room.bounds.y - startPos.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newPos = getPositionFromEvent(moveEvent);
      const newCenterX = newPos.x + offsetX;
      const newCenterY = newPos.y + offsetY;

      // Clamp to keep room in bounds
      const halfW = room.bounds.width / 2;
      const halfH = room.bounds.height / 2;
      const clampedX = Math.max(-2.4 + halfW, Math.min(2.4 - halfW, newCenterX));
      const clampedY = Math.max(-2.4 + halfH, Math.min(2.4 - halfH, newCenterY));

      const newBounds = { ...room.bounds, x: clampedX, y: clampedY };
      const newWalls = createWallsFromBounds(newBounds);

      setRooms((prev) =>
        prev.map((r) =>
          r.id === roomId
            ? { ...r, bounds: newBounds, walls: newWalls, center: { x: clampedX, y: clampedY } }
            : r
        )
      );
    };

    const handleMouseUp = () => {
      setIsDraggingRoom(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  /** Start resizing a room from a handle */
  const handleRoomResizeStart =
    (roomId: string, handle: "nw" | "ne" | "sw" | "se" | "n" | "s" | "e" | "w") =>
    (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const room = rooms().find((r) => r.id === roomId);
      if (!room) return;

      setIsResizingRoom({ roomId, handle });

      // Calculate initial edges
      const b = room.bounds;
      let left = b.x - b.width / 2;
      let right = b.x + b.width / 2;
      let top = b.y - b.height / 2;
      let bottom = b.y + b.height / 2;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const pos = getPositionFromEvent(moveEvent);
        const minSize = 0.3; // Minimum room size

        // Update edges based on which handle is being dragged
        if (handle.includes("w")) left = Math.min(pos.x, right - minSize);
        if (handle.includes("e")) right = Math.max(pos.x, left + minSize);
        if (handle.includes("n")) top = Math.min(pos.y, bottom - minSize);
        if (handle.includes("s")) bottom = Math.max(pos.y, top + minSize);

        // Clamp to canvas bounds
        left = Math.max(-2.4, left);
        right = Math.min(2.4, right);
        top = Math.max(-2.4, top);
        bottom = Math.min(2.4, bottom);

        const newWidth = right - left;
        const newHeight = bottom - top;
        const newCenterX = (left + right) / 2;
        const newCenterY = (top + bottom) / 2;

        const newBounds = {
          x: newCenterX,
          y: newCenterY,
          width: newWidth,
          height: newHeight,
        };
        const newWalls = createWallsFromBounds(newBounds);

        setRooms((prev) =>
          prev.map((r) =>
            r.id === roomId
              ? { ...r, bounds: newBounds, walls: newWalls, center: { x: newCenterX, y: newCenterY } }
              : r
          )
        );
      };

      const handleMouseUp = () => {
        setIsResizingRoom(null);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

  // ============================================================================
  // LISTENER HANDLERS
  // ============================================================================

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

  const handleListenerRotate = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setIsRotatingListener(true);

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

  // ============================================================================
  // SPEAKER HANDLERS
  // ============================================================================

  const addSpeaker = () => {
    const index = speakers().length;
    const newSpeaker: SpeakerState = {
      id: `speaker-${Date.now()}`,
      position: { x: 0, y: 0 },
      facing: 0,
      color: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
      directivity: "cardioid",
      frequency: 440 + index * 110,
    };
    setSpeakers((prev) => [...prev, newSpeaker]);
    setSelectedSpeaker(newSpeaker.id);
  };

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

  const handleSpeakerRotateStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsRotatingSpeaker(speakerId);

    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

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

  // ============================================================================
  // AUDIO
  // ============================================================================

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
    return calculateAudioParameters(
      sourceConfig,
      listener,
      allWalls(),
      distanceModel(),
      audioStore.masterVolume()
    );
  };

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

  // Real-time audio updates
  createEffect(() => {
    const lPos = listenerPos();
    const lFacing = listenerFacing();
    const speakerList = speakers();
    const masterVol = audioStore.masterVolume();
    const audioContext = audioStore.getAudioContext();

    void lPos;
    void lFacing;
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

  onCleanup(() => {
    stopAllPlayback();
  });

  // ============================================================================
  // UI HELPERS
  // ============================================================================

  const calculateDisplayGain = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.directionalGain * params.wallAttenuation;
  };

  const getWallCount = (speaker: SpeakerState): number => {
    const params = getAudioParams(speaker);
    return params.wallCount;
  };

  const isPlaying = (speakerId: string) => playingSpeakers().has(speakerId);

  // ============================================================================
  // RENDER
  // ============================================================================

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
            variant={drawingMode() === "rectangle" ? "primary" : "outline"}
            icon="⬜"
            onClick={() => setDrawingMode("rectangle")}
          >
            Draw Room
          </Button>
        </div>

        <div class={styles.toolbarGroup}>
          <span class={styles.toolLabel}>Audio</span>
          <Button variant="outline" icon="🎤" onClick={addSpeaker}>
            Add Speaker
          </Button>
          <Show when={selectedSpeaker()}>
            {(speakerId) => (
              <Button
                variant={isPlaying(speakerId()) ? "danger" : "success"}
                icon={isPlaying(speakerId()) ? "⏹️" : "🔊"}
                onClick={() => togglePlayback(speakerId())}
              >
                {isPlaying(speakerId()) ? "Stop" : "Play"}
              </Button>
            )}
          </Show>
        </div>

        <div class={styles.toolbarGroup}>
          <span class={styles.toolLabel}>Actions</span>
          <Button variant="outline" icon="🗑️" onClick={stopAllPlayback}>
            Stop All
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div class={styles.mainContent}>
        {/* Canvas */}
        <div class={styles.canvasWrapper}>
          <h3 class={styles.canvasTitle}>
            {drawingMode() === "rectangle" ? "Click and drag to draw a room" : "Click to select rooms or audio sources"}
          </h3>

          <div
            ref={canvasRef}
            class={`${styles.canvas} ${drawingMode() === "select" ? styles.selectMode : ""}`}
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

            {/* Rooms */}
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
                      class={`${styles.roomArea} ${selectedRoomId() === room.id ? styles.selected : ""} ${isDraggingRoom() === room.id ? styles.dragging : ""} ${isResizingRoom()?.roomId === room.id ? styles.resizing : ""} ${drawingMode() === "rectangle" ? styles.drawMode : ""}`}
                      style={{
                        left: `${left}%`,
                        top: `${top}%`,
                        width: `${width}%`,
                        height: `${height}%`,
                        "border-color": room.color,
                        background: `${room.color}20`,
                      }}
                      onClick={handleRoomClick(room.id)}
                      onMouseDown={handleRoomDragStart(room.id)}
                    >
                      <span class={styles.roomAreaLabel}>{room.label}</span>
                    </div>
                    {/* Walls */}
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
                    {/* Resize handles for selected room */}
                    <Show when={selectedRoomId() === room.id && drawingMode() === "select"}>
                      {/* Corner handles */}
                      <div
                        class={`${styles.resizeHandle} ${styles.nw}`}
                        style={{ left: `${left}%`, top: `${top}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "nw")}
                      />
                      <div
                        class={`${styles.resizeHandle} ${styles.ne}`}
                        style={{ left: `${left + width}%`, top: `${top}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "ne")}
                      />
                      <div
                        class={`${styles.resizeHandle} ${styles.sw}`}
                        style={{ left: `${left}%`, top: `${top + height}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "sw")}
                      />
                      <div
                        class={`${styles.resizeHandle} ${styles.se}`}
                        style={{ left: `${left + width}%`, top: `${top + height}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "se")}
                      />
                      {/* Edge handles */}
                      <div
                        class={`${styles.resizeHandle} ${styles.n}`}
                        style={{ left: `${left + width / 2}%`, top: `${top}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "n")}
                      />
                      <div
                        class={`${styles.resizeHandle} ${styles.s}`}
                        style={{ left: `${left + width / 2}%`, top: `${top + height}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "s")}
                      />
                      <div
                        class={`${styles.resizeHandle} ${styles.w}`}
                        style={{ left: `${left}%`, top: `${top + height / 2}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "w")}
                      />
                      <div
                        class={`${styles.resizeHandle} ${styles.e}`}
                        style={{ left: `${left + width}%`, top: `${top + height / 2}%` }}
                        onMouseDown={handleRoomResizeStart(room.id, "e")}
                      />
                    </Show>
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

            {/* Audio sources container - disabled in draw mode */}
            <div class={drawingMode() === "rectangle" ? styles.audioSourcesDrawMode : styles.audioSources}>
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
          </div>

          <div class={styles.statusBar}>
            <span>
              Listener: ({listenerPos().x.toFixed(1)}, {listenerPos().y.toFixed(1)})
            </span>
            <span>{rooms().length} room{rooms().length !== 1 ? "s" : ""}</span>
            <span>{speakers().length} speaker{speakers().length !== 1 ? "s" : ""}</span>
            <span class={styles.hint}>
              {drawingMode() === "rectangle" ? "Click and drag to draw" : "Drag rooms to move"}
            </span>
          </div>
        </div>

        {/* Sidebar */}
        <div class={styles.sidebar}>
          {/* Property Panel */}
          <Show when={selectedRoom()}>
            {(room) => (
              <div class={styles.panel}>
                <h4 class={styles.panelTitle}>Room Properties</h4>

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
                  <Button variant="danger" icon="🗑️" onClick={deleteSelectedRoom}>
                    Delete Room
                  </Button>
                </div>
              </div>
            )}
          </Show>

          {/* Room List */}
          <div class={styles.panel}>
            <h4 class={styles.panelTitle}>Rooms</h4>

            <Show
              when={rooms().length > 0}
              fallback={<div class={styles.emptyState}>No rooms yet. Draw one!</div>}
            >
              <div class={styles.roomList}>
                <For each={rooms()}>
                  {(room) => (
                    <div
                      class={`${styles.roomListItem} ${selectedRoomId() === room.id ? styles.selected : ""}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <div
                        class={styles.roomColorSwatch}
                        style={{ background: room.color }}
                      />
                      <span class={styles.roomListName}>{room.label}</span>
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
