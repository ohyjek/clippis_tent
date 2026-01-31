/**
 * FullDemo.tsx - Complete Spatial Audio Playground (Tab 1 of The Tent)
 *
 * The comprehensive demo combining all spatial audio features:
 * - Draggable listener with facing direction (same UI as speakers)
 * - Multiple speakers with configurable directivity patterns
 * - Continuous tone playback with real-time updates
 * - Room boundaries with wall attenuation
 * - Multiple distance attenuation models
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
}

/** Audio nodes for continuous playback */
interface AudioNodes {
  oscillator: OscillatorNode;
  gainNode: GainNode;
  panner: StereoPannerNode;
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

  // Listener state (position + facing, same as speakers)
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 1.2, y: 0 });
  const [listenerFacing, setListenerFacing] = createSignal(0);

  // Speakers state
  const [speakers, setSpeakers] = createSignal<SpeakerState[]>([
    {
      id: "speaker-1",
      position: { x: -1.2, y: 0 },
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

  // Room click to initialize audio
  const handleRoomClick = () => {
    audioStore.initializeAudio();
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
    return calculateAudioParameters(
      sourceConfig,
      listener,
      allWalls(),
      distanceModel(),
      audioStore.masterVolume()
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

  // Play one-shot beep
  const playBeep = () => {
    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const speaker = speakers().find((s) => s.id === selectedSpeaker());
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
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  // Reset to initial state
  const resetDemo = () => {
    stopAllPlayback();
    setListenerPos({ x: 1.2, y: 0 });
    setListenerFacing(0);
    setSpeakers([
      {
        id: "speaker-1",
        position: { x: -1.2, y: 0 },
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
      <div class={styles.controls}>
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
        <Button variant="outline" icon="🔔" onClick={playBeep}>
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

      {!audioStore.audioInitialized() && (
        <div class={styles.banner}>
          <p>
            🔊 <strong>Click anywhere</strong> to enable audio, then click a speaker to
            start a continuous tone!
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

          {/* Listener - uses same Speaker component style */}
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
          <span>
            Listener: ({listenerPos().x.toFixed(1)}, {listenerPos().y.toFixed(1)})
          </span>
          <span>Facing: {((listenerFacing() * 180) / Math.PI).toFixed(0)}°</span>
          <span>
            {speakers().length} speaker{speakers().length !== 1 ? "s" : ""}
            {playingSpeakers().size > 0 && ` (${playingSpeakers().size} playing)`}
          </span>
          <span class={styles.hint}>Drag icon to move • Drag cone to rotate</span>
        </div>
      </div>

      <div class={styles.legend}>
        <h4>Advanced Spatial Audio Demo</h4>
        <p>
          This demo uses <strong>listener-relative panning</strong> - sounds are panned
          based on where they are relative to which way you're facing.
        </p>
        <ul>
          <li>
            <strong>🎧 Listener</strong>: Drag icon to move, drag cone to rotate facing
          </li>
          <li>
            <strong>🎤 Speakers</strong>: Click to toggle sound, drag icon to move, drag
            cone to rotate
          </li>
          <li>
            <strong>Distance Model</strong>: Changes how volume falls off with distance
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
