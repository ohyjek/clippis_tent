import { For } from "solid-js";
import { audioStore } from "../../stores/audio";
import { calculateSpatialParams, CARDINAL_DIRECTIONS, Position } from "../../lib/spatial-audio";
import { Button, Slider } from "../ui";
import { Listener } from "./Listener";
import { SoundSource } from "./SoundSource";
import styles from "./DemoRoom.module.css";

/**
 * DemoRoom - Interactive spatial audio demonstration
 * 
 * This component provides a visual demonstration of spatial audio positioning.
 * Users can add sound sources, move the listener, and hear how audio changes
 * based on position (volume attenuation and stereo panning).
 */
export function DemoRoom() {
  let roomRef: HTMLDivElement | undefined;

  /**
   * Convert a mouse event to room coordinates (-2.5 to +2.5 range)
   */
  const getPositionFromEvent = (e: MouseEvent): Position => {
    if (!roomRef) return { x: 0, y: 0 };
    const rect = roomRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    // Clamp to room bounds
    return {
      x: Math.max(-2.5, Math.min(2.5, x)),
      y: Math.max(-2.5, Math.min(2.5, y)),
    };
  };

  // Play a tone at a specific position with spatial audio
  const playSoundAtPosition = (position: { x: number; y: number }, frequency: number) => {
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    const { volume, pan } = calculateSpatialParams(
      audioStore.listenerPos(),
      position,
      audioStore.masterVolume()
    );

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.value = volume;
    panner.pan.value = pan;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  };

  const handleAddSound = () => {
    const newSound = audioStore.addSound();
    setTimeout(() => {
      playSoundAtPosition(newSound.position, newSound.frequency);
    }, 100);
  };

  /**
   * Update a sound's position during drag
   */
  const handleSoundPositionChange = (soundId: string, position: Position) => {
    audioStore.updateSoundPosition(soundId, position);
  };

  /**
   * Play sound when drag ends
   */
  const handleSoundDragEnd = (soundId: string) => {
    const sound = audioStore.getSound(soundId);
    if (sound) {
      playSoundAtPosition(sound.position, sound.frequency);
    }
  };

  const handleRoomClick = (e: MouseEvent) => {
    audioStore.initializeAudio();
    const position = getPositionFromEvent(e);
    audioStore.setListenerPos(position);
  };

  const playSoundDemo = () => {
    audioStore.sounds().forEach((s, i) => {
      setTimeout(() => {
        playSoundAtPosition(s.position, s.frequency);
      }, i * 500);
    });
  };

  const testCardinalDirections = () => {
    audioStore.initializeAudio();
    CARDINAL_DIRECTIONS.forEach((dir, i) => {
      setTimeout(() => {
        console.log(`Playing ${dir.name} tone`);
        playSoundAtPosition({ x: dir.x, y: dir.y }, dir.frequency);
      }, i * 800);
    });
  };

  return (
    <div class={styles.container}>
      {/* Controls */}
      <div class={styles.controls}>
        <Button variant="primary" icon="➕" onClick={handleAddSound}>
          Add Sound
        </Button>
        <Button variant="success" icon="🔊" onClick={playSoundDemo}>
          Play Demo
        </Button>
        <Button variant="purple" icon="🧭" onClick={testCardinalDirections}>
          Test Directions
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
        <Button variant="outline" icon="🎧" onClick={audioStore.resetListenerPosition}>
          Reset Position
        </Button>
        <Button variant="danger" icon="🗑️" onClick={audioStore.clearSounds}>
          Clear All
        </Button>
      </div>

      {/* Audio activation banner */}
      {!audioStore.audioInitialized() && (
        <div class={styles.banner}>
          <p>
            🔊 <strong>Audio needs activation:</strong> Click anywhere on the
            room to enable audio playback.
          </p>
        </div>
      )}

      {/* Room visualization */}
      <div class={styles.roomCard}>
        <h2 class={styles.roomTitle}>
          Demo Room {audioStore.audioInitialized() && "🔊"}
        </h2>

        <div class={styles.room} ref={roomRef} onClick={handleRoomClick}>
          <Listener position={audioStore.listenerPos()} />

          <For each={audioStore.sounds()}>
            {(sound, index) => (
              <SoundSource
                sound={sound}
                index={index()}
                getPositionFromEvent={getPositionFromEvent}
                onPositionChange={(pos) => handleSoundPositionChange(sound.id, pos)}
                onDragEnd={() => handleSoundDragEnd(sound.id)}
              />
            )}
          </For>

          {/* Grid lines */}
          <div class={styles.gridLineH} />
          <div class={styles.gridLineV} />

          {/* Direction labels */}
          <div class={`${styles.directionLabel} ${styles.left}`}>← Left</div>
          <div class={`${styles.directionLabel} ${styles.right}`}>Right →</div>
        </div>

        <div class={styles.statusBar}>
          <span>
            Position: ({audioStore.listenerPos().x.toFixed(2)},{" "}
            {audioStore.listenerPos().y.toFixed(2)})
          </span>
          <span>
            {audioStore.sounds().length} sound
            {audioStore.sounds().length !== 1 ? "s" : ""} active
          </span>
          <span class={styles.hint}>
            Click room to move listener • Drag sounds to reposition
          </span>
        </div>
      </div>
    </div>
  );
}
