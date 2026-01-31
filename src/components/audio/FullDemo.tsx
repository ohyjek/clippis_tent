/**
 * FullDemo.tsx - Complete Spatial Audio Playground (Tab 1 of The Tent)
 *
 * The comprehensive demo combining all spatial audio features:
 * - Draggable listener with facing direction
 * - Multiple speakers with configurable directivity patterns
 * - Continuous tone playback with real-time updates
 * - Room boundaries with wall attenuation
 * - Multiple distance attenuation models
 *
 * Now powered by the advanced SpatialAudioEngine.
 */
import { createSignal, createEffect, onCleanup, For } from "solid-js";
import {
  Position,
  Room,
  Wall,
  createRectangularRoom,
  SPEAKER_COLORS,
} from "@/lib/spatial-audio";
import {
  SpatialAudioEngine,
  Listener,
  SourceConfig,
  DirectivityPattern,
  DistanceModel,
  calculateAudioParameters,
  createListener,
} from "@/lib/spatial-audio-engine";
import { audioStore } from "@/stores/audio";
import { Button, Slider, Speaker, SelectField } from "@/components/ui";
import styles from "./FullDemo.module.css";

/** Extended speaker data for UI state */
interface SpeakerState {
  id: string;
  position: Position;
  facing: number;
  color: string;
  directivity: DirectivityPattern;
  frequency: number;
  playing: boolean;
}

// Singleton audio engine instance
let engine: SpatialAudioEngine | null = null;

function getEngine(): SpatialAudioEngine {
  if (!engine) {
    engine = new SpatialAudioEngine();
  }
  return engine;
}

export function FullDemo() {
  let roomRef: HTMLDivElement | undefined;

  // Room configuration - two adjacent rooms
  const [rooms] = createSignal<Room[]>([
    createRectangularRoom({ x: -1.2, y: 0 }, 2.2, 4, "room-a", "Room A"),
    createRectangularRoom({ x: 1.2, y: 0 }, 2.2, 4, "room-b", "Room B"),
  ]);

  // Get all walls from all rooms
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);

  // Listener state with facing direction
  const [listener, setListener] = createSignal<Listener>(
    createListener({ x: 1.2, y: 0 }, 0)
  );

  // Speakers state
  const [speakers, setSpeakers] = createSignal<SpeakerState[]>([
    {
      id: "speaker-1",
      position: { x: -1.2, y: 0 },
      facing: 0,
      color: SPEAKER_COLORS[0],
      directivity: "cardioid",
      frequency: 440,
      playing: false,
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

  // Listener drag handling (move)
  const handleListenerDrag = (e: MouseEvent) => {
    e.stopPropagation();
    setIsDraggingListener(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent);
      setListener((prev) => ({ ...prev, position: pos }));
    };

    const handleMouseUp = () => {
      setIsDraggingListener(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Listener rotation handling
  const handleListenerRotate = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsRotatingListener(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const listenerScreen = getScreenPosition(listener().position);
      const angle = Math.atan2(
        moveEvent.clientY - listenerScreen.y,
        moveEvent.clientX - listenerScreen.x
      );
      setListener((prev) => ({ ...prev, facing: angle }));
    };

    const handleMouseUp = () => {
      setIsRotatingListener(false);
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
    initializeEngine();
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

  // Speaker rotate handling
  const handleSpeakerRotateStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    initializeEngine();
    setSelectedSpeaker(speakerId);
    setIsRotatingSpeaker(speakerId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const speaker = speakers().find((s) => s.id === speakerId);
      if (!speaker) return;

      const speakerScreen = getScreenPosition(speaker.position);
      const angle = Math.atan2(
        moveEvent.clientY - speakerScreen.y,
        moveEvent.clientX - speakerScreen.x
      );

      setSpeakers((prev) =>
        prev.map((s) => (s.id === speakerId ? { ...s, facing: angle } : s))
      );
    };

    const handleMouseUp = () => {
      setIsRotatingSpeaker(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Initialize engine
  const initializeEngine = () => {
    const eng = getEngine();
    if (!eng.isInitialized()) {
      eng.initialize();
      audioStore.initializeAudio();
    }
  };

  // Room click to initialize
  const handleRoomClick = () => {
    initializeEngine();
  };

  // Convert speaker state to engine source config
  const toSourceConfig = (speaker: SpeakerState): SourceConfig => ({
    id: speaker.id,
    position: speaker.position,
    facing: speaker.facing,
    directivity: speaker.directivity,
    volume: 1,
    frequency: speaker.frequency,
    waveform: "sine",
    playing: speaker.playing,
  });

  // Toggle continuous playback for a speaker
  const toggleSpeaker = (speakerId: string) => {
    initializeEngine();
    const eng = getEngine();
    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return;

    // Update engine walls and listener
    eng.setWalls(allWalls());
    eng.setListener(listener());
    eng.setDistanceModel(distanceModel());
    eng.setMasterVolume(audioStore.masterVolume());

    // Toggle
    const config = toSourceConfig(speaker);
    eng.setSource(config);
    const nowPlaying = eng.toggleSource(speakerId);

    // Update UI state
    setSpeakers((prev) =>
      prev.map((s) => (s.id === speakerId ? { ...s, playing: nowPlaying } : s))
    );
  };

  // Play one-shot beep
  const playBeep = (speakerId?: string) => {
    initializeEngine();
    const eng = getEngine();
    const targetId = speakerId ?? selectedSpeaker();
    const speaker = speakers().find((s) => s.id === targetId);
    if (!speaker) return;

    eng.setWalls(allWalls());
    eng.setListener(listener());
    eng.setDistanceModel(distanceModel());
    eng.setMasterVolume(audioStore.masterVolume());

    const config = toSourceConfig(speaker);
    eng.setSource(config);
    eng.playOneShot(targetId, 0.3);
  };

  // Update engine in real-time when positions/settings change
  createEffect(() => {
    const eng = getEngine();
    if (!eng.isInitialized()) return;

    const currentListener = listener();
    const currentSpeakers = speakers();
    const currentDistanceModel = distanceModel();
    const masterVol = audioStore.masterVolume();

    // Update engine state
    eng.setListener(currentListener);
    eng.setWalls(allWalls());
    eng.setDistanceModel(currentDistanceModel);
    eng.setMasterVolume(masterVol);

    // Update all source positions/facings
    for (const speaker of currentSpeakers) {
      if (speaker.playing) {
        eng.setSourcePosition(speaker.id, speaker.position);
        eng.setSourceFacing(speaker.id, speaker.facing);
      }
    }
  });

  // Calculate display gain for UI
  const calculateDisplayGain = (speaker: SpeakerState): number => {
    const config = toSourceConfig(speaker);
    const params = calculateAudioParameters(
      config,
      listener(),
      allWalls(),
      distanceModel(),
      audioStore.masterVolume()
    );
    return params.directionalGain * params.wallAttenuation;
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
      frequency: 440 + index * 110, // Different frequencies for each
      playing: false,
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

  // Reset to initial state
  const resetDemo = () => {
    const eng = getEngine();
    eng.stopAll();
    setListener(createListener({ x: 1.2, y: 0 }, 0));
    setSpeakers([
      {
        id: "speaker-1",
        position: { x: -1.2, y: 0 },
        facing: 0,
        color: SPEAKER_COLORS[0],
        directivity: "cardioid",
        frequency: 440,
        playing: false,
      },
    ]);
    setSelectedSpeaker("speaker-1");
    setDistanceModel("inverse");
  };

  // Get selected speaker info
  const getSelectedSpeaker = () => speakers().find((s) => s.id === selectedSpeaker());

  // Cleanup on unmount
  onCleanup(() => {
    getEngine().stopAll();
  });

  // Get wall count for status
  const getWallCount = (speakerId: string) => {
    const speaker = speakers().find((s) => s.id === speakerId);
    if (!speaker) return 0;
    const config = toSourceConfig(speaker);
    const params = calculateAudioParameters(config, listener(), allWalls());
    return params.wallCount;
  };

  // Count playing speakers
  const playingCount = () => speakers().filter((s) => s.playing).length;

  return (
    <div class={styles.container}>
      <div class={styles.controls}>
        <Button variant="primary" icon="➕" onClick={addSpeaker}>
          Add Speaker
        </Button>
        <Button
          variant={getSelectedSpeaker()?.playing ? "danger" : "success"}
          icon={getSelectedSpeaker()?.playing ? "⏹️" : "🔊"}
          onClick={() => toggleSpeaker(selectedSpeaker())}
        >
          {getSelectedSpeaker()?.playing ? "Stop" : "Play"}
        </Button>
        <Button variant="outline" icon="🔔" onClick={() => playBeep()}>
          Beep
        </Button>
        <Slider
          label="Volume"
          min={0}
          max={1}
          step={0.01}
          value={audioStore.masterVolume()}
          onInput={(e) => audioStore.updateMasterVolume(parseFloat(e.currentTarget.value))}
          showValue
        />
        <Button variant="outline" icon="🔄" onClick={resetDemo}>
          Reset
        </Button>
      </div>

      {/* Audio settings panel */}
      <div class={styles.settingsPanel}>
        <SelectField
          label="Distance Model"
          options={distanceModelOptions}
          value={distanceModel()}
          onChange={(e) => setDistanceModel(e.currentTarget.value as DistanceModel)}
        />
        <SelectField
          label="Speaker Pattern"
          options={directivityOptions}
          value={getSelectedSpeaker()?.directivity ?? "cardioid"}
          onChange={(e) => updateDirectivity(e.currentTarget.value as DirectivityPattern)}
        />
      </div>

      {!getEngine().isInitialized() && (
        <div class={styles.banner}>
          <p>
            🔊 <strong>Click a speaker</strong> to start a continuous tone, then drag
            to hear real-time changes!
          </p>
        </div>
      )}

      <div class={styles.roomCard}>
        <h2 class={styles.roomTitle}>The Tent</h2>

        <div class={styles.room} ref={roomRef} onClick={handleRoomClick}>
          {/* Room boundaries */}
          <For each={rooms()}>
            {(room) => (
              <>
                <div
                  class={styles.roomArea}
                  style={{
                    left: `${toPercent(room.center.x - 1.1)}%`,
                    top: `${toPercent(room.center.y - 2)}%`,
                    width: `${2.2 * 20}%`,
                    height: `${4 * 20}%`,
                  }}
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
                        }}
                      />
                    );
                  }}
                </For>
              </>
            )}
          </For>

          {/* Sound path lines */}
          <svg class={styles.pathSvg}>
            <For each={speakers()}>
              {(speaker) => {
                const wallCount = getWallCount(speaker.id);
                return (
                  <line
                    x1={`${toPercent(speaker.position.x)}%`}
                    y1={`${toPercent(speaker.position.y)}%`}
                    x2={`${toPercent(listener().position.x)}%`}
                    y2={`${toPercent(listener().position.y)}%`}
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
                isPlaying={speaker.playing}
                isMoving={isMovingSpeaker() === speaker.id}
                isRotating={isRotatingSpeaker() === speaker.id}
                onClick={() => {
                  setSelectedSpeaker(speaker.id);
                  toggleSpeaker(speaker.id);
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

          {/* Listener with facing direction */}
          <div
            class={`${styles.listenerContainer} ${isDraggingListener() || isRotatingListener() ? styles.active : ""}`}
            style={{
              left: `${toPercent(listener().position.x)}%`,
              top: `${toPercent(listener().position.y)}%`,
            }}
          >
            {/* Facing direction indicator */}
            <div
              class={styles.listenerDirection}
              style={{
                transform: `rotate(${(listener().facing * 180) / Math.PI}deg)`,
              }}
              onMouseDown={handleListenerRotate}
              title="Drag to rotate your facing direction"
            />
            {/* Listener icon */}
            <div
              class={`${styles.listener} ${isDraggingListener() ? styles.dragging : ""}`}
              onMouseDown={handleListenerDrag}
              title="Drag to move • The wedge shows your facing direction"
            >
              🎧
            </div>
          </div>
        </div>

        <div class={styles.statusBar}>
          <span>
            Pos: ({listener().position.x.toFixed(1)}, {listener().position.y.toFixed(1)})
          </span>
          <span>Facing: {((listener().facing * 180) / Math.PI).toFixed(0)}°</span>
          <span>
            {speakers().length} speaker{speakers().length !== 1 ? "s" : ""}
            {playingCount() > 0 && ` (${playingCount()} playing)`}
          </span>
          <span class={styles.hint}>Drag icon to move • Drag wedge to rotate</span>
        </div>
      </div>

      <div class={styles.legend}>
        <h4>Advanced Spatial Audio Demo</h4>
        <p>
          This demo uses the <strong>advanced audio engine</strong> with listener facing
          direction, configurable directivity patterns, and multiple distance models.
        </p>
        <ul>
          <li>
            <strong>Listener</strong>: Drag icon to move, drag the wedge to change facing
            direction (affects stereo panning)
          </li>
          <li>
            <strong>Speakers</strong>: Click to toggle, drag icon to move, drag cone to
            rotate
          </li>
          <li>
            <strong>Distance Model</strong>: Changes how sound falls off with distance
          </li>
          <li>
            <strong>Directivity Pattern</strong>: Changes the speaker's sound projection
            shape
          </li>
        </ul>
      </div>
    </div>
  );
}
