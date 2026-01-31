/**
 * RoomDemo.tsx - Room Boundaries Demo (Tab 3 of The Tent)
 *
 * Demonstrates how walls/boundaries attenuate sound:
 * - Two adjacent rooms with visible walls
 * - Sound passing through walls is reduced by 70% per wall
 * - Visual line shows the sound path (green = clear, red = blocked)
 *
 * This simulates Dolby Axon's room system where users in different
 * areas couldn't hear each other clearly.
 *
 * Audio model: attenuation = 0.3 ^ wallCount
 */
import { createSignal, For } from "solid-js";
import {
  Position,
  Room,
  Wall,
  createRectangularRoom,
  countWallsBetween,
  calculateWallAttenuation,
  calculateDistance,
  calculatePan,
} from "@/lib/spatial-audio";
import { audioStore } from "@/stores/audio";
import { Button, Slider } from "@/components/ui";
import styles from "./RoomDemo.module.css";

export function RoomDemo() {
  let roomRef: HTMLDivElement | undefined;

  // Create two adjacent rooms
  const [rooms] = createSignal<Room[]>([
    createRectangularRoom({ x: -1.2, y: 0 }, 2.2, 3.5, "room-a", "Room A"),
    createRectangularRoom({ x: 1.2, y: 0 }, 2.2, 3.5, "room-b", "Room B"),
  ]);

  // Get all walls from all rooms
  const allWalls = (): Wall[] => rooms().flatMap(r => r.walls);

  const [speakerPos, setSpeakerPos] = createSignal<Position>({ x: -1.2, y: 0 });
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 1.2, y: 0 });
  const [isDraggingSpeaker, setIsDraggingSpeaker] = createSignal(false);
  const [isDraggingListener, setIsDraggingListener] = createSignal(false);

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

  const handleSpeakerDrag = (e: MouseEvent) => {
    e.stopPropagation();
    setIsDraggingSpeaker(true);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      setSpeakerPos(getPositionFromEvent(moveEvent));
    };

    const handleMouseUp = () => {
      setIsDraggingSpeaker(false);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

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

  const handleRoomClick = (e: MouseEvent) => {
    audioStore.initializeAudio();
    playSound();
  };

  const getWallCount = () => countWallsBetween(speakerPos(), listenerPos(), allWalls());
  const getAttenuation = () => calculateWallAttenuation(getWallCount());

  const playSound = () => {
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const wallCount = getWallCount();
    const wallAttenuation = calculateWallAttenuation(wallCount);
    
    // Calculate distance-based volume
    const distance = calculateDistance(speakerPos(), listenerPos());
    const baseVolume = 1 / (1 + distance);
    
    // Calculate pan
    const dx = speakerPos().x - listenerPos().x;
    const pan = calculatePan(dx);

    // Apply wall attenuation to volume
    const finalVolume = baseVolume * wallAttenuation * audioStore.masterVolume() * 0.3;

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
  };

  const resetPositions = () => {
    setSpeakerPos({ x: -1.2, y: 0 });
    setListenerPos({ x: 1.2, y: 0 });
  };

  // Convert room coordinates to percentage for rendering
  const toPercent = (val: number) => 50 + val * 20;

  return (
    <div class={styles.container}>
      <div class={styles.controls}>
        <Button variant="success" icon="🔊" onClick={playSound}>
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
        <Button variant="outline" icon="🔄" onClick={resetPositions}>
          Reset Positions
        </Button>
      </div>

      {!audioStore.audioInitialized() && (
        <div class={styles.banner}>
          <p>🔊 <strong>Click the room</strong> to enable audio</p>
        </div>
      )}

      <div class={styles.roomCard}>
        <h2 class={styles.roomTitle}>Room Boundaries Demo</h2>

        <div class={styles.room} ref={roomRef} onClick={handleRoomClick}>
          {/* Render room boundaries */}
          <For each={rooms()}>
            {(room) => (
              <>
                {/* Room background */}
                <div
                  class={styles.roomArea}
                  style={{
                    left: `${toPercent(room.center.x - 1.1)}%`,
                    top: `${toPercent(room.center.y - 1.75)}%`,
                    width: `${2.2 * 20}%`,
                    height: `${3.5 * 20}%`,
                  }}
                >
                  <span class={styles.roomLabel}>{room.label}</span>
                </div>
                {/* Room walls */}
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

          {/* Sound path line */}
          <svg class={styles.pathSvg}>
            <line
              x1={`${toPercent(speakerPos().x)}%`}
              y1={`${toPercent(speakerPos().y)}%`}
              x2={`${toPercent(listenerPos().x)}%`}
              y2={`${toPercent(listenerPos().y)}%`}
              class={`${styles.pathLine} ${getWallCount() > 0 ? styles.blocked : ""}`}
              stroke-dasharray={getWallCount() > 0 ? "5,5" : "none"}
            />
          </svg>

          {/* Speaker */}
          <div
            class={`${styles.speaker} ${isDraggingSpeaker() ? styles.dragging : ""}`}
            style={{
              left: `${toPercent(speakerPos().x)}%`,
              top: `${toPercent(speakerPos().y)}%`,
            }}
            onMouseDown={handleSpeakerDrag}
            title="Drag to move speaker"
          >
            🎙️
          </div>

          {/* Listener */}
          <div
            class={`${styles.listener} ${isDraggingListener() ? styles.dragging : ""}`}
            style={{
              left: `${toPercent(listenerPos().x)}%`,
              top: `${toPercent(listenerPos().y)}%`,
            }}
            onMouseDown={handleListenerDrag}
            title="Drag to move listener"
          >
            🎧
          </div>
        </div>

        <div class={styles.statusBar}>
          <span class={getWallCount() > 0 ? styles.attenuated : ""}>
            Walls crossed: {getWallCount()}
          </span>
          <span>
            Attenuation: {(getAttenuation() * 100).toFixed(0)}%
          </span>
          <span class={styles.hint}>
            Drag speaker and listener to different rooms
          </span>
        </div>
      </div>

      <div class={styles.legend}>
        <h4>How it works</h4>
        <p>
          Each <strong>wall</strong> between the speaker and listener reduces sound by 
          <strong> 70%</strong>. When they're in different rooms, sound must pass through 
          walls and becomes much quieter.
        </p>
        <ul>
          <li>Same room = clear audio (100% volume)</li>
          <li>1 wall = muffled (30% volume)</li>
          <li>2 walls = very quiet (9% volume)</li>
        </ul>
      </div>
    </div>
  );
}
