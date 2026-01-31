/**
 * FullDemo.tsx - Complete Spatial Audio Playground (Tab 1 of The Tent)
 *
 * The comprehensive demo combining all spatial audio features:
 * - Draggable listener position
 * - Multiple speakers with position, direction, and click-to-play
 * - Room boundaries with wall attenuation
 *
 * This is the default/primary demo that showcases all the concepts together.
 */
import { createSignal, For } from "solid-js";
import {
  Speaker as SpeakerData,
  Position,
  Room,
  Wall,
  createRectangularRoom,
  createSpeaker,
  countWallsBetween,
  calculateWallAttenuation,
  calculateDirectionalGain,
  calculateDistance,
  calculatePan,
} from "@/lib/spatial-audio";
import { audioStore } from "@/stores/audio";
import { Button, Slider, Speaker } from "@/components/ui";
import styles from "./FullDemo.module.css";

export function FullDemo() {
  let roomRef: HTMLDivElement | undefined;

  // Room configuration - two adjacent rooms
  const [rooms] = createSignal<Room[]>([
    createRectangularRoom({ x: -1.2, y: 0 }, 2.2, 4, "room-a", "Room A"),
    createRectangularRoom({ x: 1.2, y: 0 }, 2.2, 4, "room-b", "Room B"),
  ]);

  // Get all walls from all rooms
  const allWalls = (): Wall[] => rooms().flatMap((r) => r.walls);

  // State
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 1.2, y: 0 });
  const [speakers, setSpeakers] = createSignal<SpeakerData[]>([
    { ...createSpeaker("speaker-1", 0), position: { x: -1.2, y: 0 } },
  ]);
  const [selectedSpeaker, setSelectedSpeaker] = createSignal<string>("speaker-1");
  const [isDraggingListener, setIsDraggingListener] = createSignal(false);
  const [isMovingSpeaker, setIsMovingSpeaker] = createSignal<string | null>(null);
  const [isRotatingSpeaker, setIsRotatingSpeaker] = createSignal<string | null>(null);
  const [playingSpeaker, setPlayingSpeaker] = createSignal<string | null>(null);

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
  const getSpeakerScreenPosition = (speaker: SpeakerData): { x: number; y: number } => {
    if (!roomRef) return { x: 0, y: 0 };
    const rect = roomRef.getBoundingClientRect();
    return {
      x: rect.left + (0.5 + speaker.position.x * 0.2) * rect.width,
      y: rect.top + (0.5 + speaker.position.y * 0.2) * rect.height,
    };
  };

  // Convert room coordinates to percentage for rendering
  const toPercent = (val: number) => 50 + val * 20;

  // Listener drag handling
  const handleListenerDrag = (e: MouseEvent) => {
    e.stopPropagation();
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

  // Speaker move handling
  const handleSpeakerMoveStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsMovingSpeaker(speakerId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent);
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

  // Speaker rotate handling
  const handleSpeakerRotateStart = (speakerId: string) => (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    audioStore.initializeAudio();
    setSelectedSpeaker(speakerId);
    setIsRotatingSpeaker(speakerId);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const currentSpeaker = speakers().find((s) => s.id === speakerId);
      if (!currentSpeaker) return;

      const speakerScreen = getSpeakerScreenPosition(currentSpeaker);
      const angle = Math.atan2(
        moveEvent.clientY - speakerScreen.y,
        moveEvent.clientX - speakerScreen.x
      );

      setSpeakers((prev) => prev.map((s) => (s.id === speakerId ? { ...s, facing: angle } : s)));
    };

    const handleMouseUp = () => {
      setIsRotatingSpeaker(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      playSound(speakerId);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Room click to initialize audio
  const handleRoomClick = () => {
    audioStore.initializeAudio();
  };

  // Calculate effective gain for a speaker (direction + walls + distance)
  const calculateEffectiveGain = (speaker: SpeakerData): number => {
    const directionGain = calculateDirectionalGain(speaker.facing, speaker.position, listenerPos());
    const wallCount = countWallsBetween(speaker.position, listenerPos(), allWalls());
    const wallAttenuation = calculateWallAttenuation(wallCount);
    return directionGain * wallAttenuation;
  };

  // Play sound from a speaker
  const playSound = (speakerId?: string) => {
    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const targetId = speakerId ?? selectedSpeaker();
    const speaker = speakers().find((s) => s.id === targetId);
    if (!speaker) return;

    setPlayingSpeaker(targetId);
    setSelectedSpeaker(targetId);

    // Calculate all audio factors
    const directionalGain = calculateDirectionalGain(speaker.facing, speaker.position, listenerPos());
    const wallCount = countWallsBetween(speaker.position, listenerPos(), allWalls());
    const wallAttenuation = calculateWallAttenuation(wallCount);
    const distance = calculateDistance(speaker.position, listenerPos());
    const baseVolume = 1 / (1 + distance);
    const dx = speaker.position.x - listenerPos().x;
    const pan = calculatePan(dx);

    // Final volume combines everything
    const finalVolume = baseVolume * directionalGain * wallAttenuation * audioStore.masterVolume() * 0.3;

    // Create and play the sound
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 440;
    oscillator.type = "sine";
    gainNode.gain.value = finalVolume;
    panner.pan.value = pan;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.3);

    setTimeout(() => setPlayingSpeaker(null), 300);
  };

  // Add a new speaker
  const addSpeaker = () => {
    const index = speakers().length;
    const newSpeaker = {
      ...createSpeaker(undefined, index),
      // Random position in the room
      position: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
      },
    };
    setSpeakers((prev) => [...prev, newSpeaker]);
    setSelectedSpeaker(newSpeaker.id);
  };

  // Reset to initial state
  const resetDemo = () => {
    setListenerPos({ x: 1.2, y: 0 });
    setSpeakers([{ ...createSpeaker("speaker-1", 0), position: { x: -1.2, y: 0 } }]);
    setSelectedSpeaker("speaker-1");
  };

  // Get wall count for status display
  const getSelectedWallCount = () => {
    const speaker = speakers().find((s) => s.id === selectedSpeaker());
    if (!speaker) return 0;
    return countWallsBetween(speaker.position, listenerPos(), allWalls());
  };

  return (
    <div class={styles.container}>
      <div class={styles.controls}>
        <Button variant="primary" icon="➕" onClick={addSpeaker}>
          Add Speaker
        </Button>
        <Button variant="success" icon="🔊" onClick={() => playSound()}>
          Play Sound
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

      {!audioStore.audioInitialized() && (
        <div class={styles.banner}>
          <p>
            🔊 <strong>Click a speaker</strong> to play sound, or drag elements to interact
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

          {/* Sound path lines from speakers to listener */}
          <svg class={styles.pathSvg}>
            <For each={speakers()}>
              {(speaker) => {
                const wallCount = countWallsBetween(speaker.position, listenerPos(), allWalls());
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
                gain={calculateEffectiveGain(speaker)}
                isSelected={selectedSpeaker() === speaker.id}
                isPlaying={playingSpeaker() === speaker.id}
                isMoving={isMovingSpeaker() === speaker.id}
                isRotating={isRotatingSpeaker() === speaker.id}
                onClick={() => playSound(speaker.id)}
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
          <div
            class={`${styles.listener} ${isDraggingListener() ? styles.dragging : ""}`}
            style={{
              left: `${toPercent(listenerPos().x)}%`,
              top: `${toPercent(listenerPos().y)}%`,
            }}
            onMouseDown={handleListenerDrag}
            title="Drag to move your listening position"
          >
            🎧
          </div>
        </div>

        <div class={styles.statusBar}>
          <span>
            Listener: ({listenerPos().x.toFixed(1)}, {listenerPos().y.toFixed(1)})
          </span>
          <span>{speakers().length} speaker{speakers().length !== 1 ? "s" : ""}</span>
          <span class={getSelectedWallCount() > 0 ? styles.attenuated : ""}>
            Walls: {getSelectedWallCount()}
          </span>
          <span class={styles.hint}>Click speakers to play • Drag to move/rotate</span>
        </div>
      </div>

      <div class={styles.legend}>
        <h4>Full Spatial Audio Demo</h4>
        <p>
          This demo combines <strong>distance</strong>, <strong>direction</strong>, and{" "}
          <strong>room boundaries</strong> - all the factors that affect how we hear sound in
          real spaces.
        </p>
        <ul>
          <li>
            <strong>Click</strong> a speaker to play a sound
          </li>
          <li>
            <strong>Drag the microphone icon</strong> to move speakers
          </li>
          <li>
            <strong>Drag the colored cone</strong> to change speaker direction
          </li>
          <li>
            <strong>Drag the headphones</strong> to move your listening position
          </li>
          <li>
            <strong>Walls</strong> between speaker and listener reduce sound by 70% each
          </li>
        </ul>
      </div>
    </div>
  );
}
