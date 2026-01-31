/**
 * SpeakerDemo.tsx - Speaking Direction Demo (Tab 2 of The Tent)
 *
 * Demonstrates directional audio using a cardioid pattern:
 * - Each speaker has a facing direction (shown as a visible cone)
 * - Sound is loudest when facing the listener, quietest when facing away
 * - Drag on a speaker to rotate its facing direction
 *
 * This simulates how Dolby Axon let users "face" different directions
 * to control who heard them best.
 *
 * Audio model: gain = 0.5 + 0.5 * cos(angle_difference)
 */
import { createSignal, For } from "solid-js";
import {
  Speaker,
  Position,
  calculateDirectionalGain,
  calculateDistance,
  calculatePan,
  createSpeaker,
} from "@/lib/spatial-audio";
import { audioStore } from "@/stores/audio";
import { Button, Slider } from "@/components/ui";
import styles from "./SpeakerDemo.module.css";

export function SpeakerDemo() {
  let roomRef: HTMLDivElement | undefined;
  
  const [speakers, setSpeakers] = createSignal<Speaker[]>([
    { ...createSpeaker("speaker-1", 0), position: { x: -1, y: 0 } },
    { ...createSpeaker("speaker-2", 1), position: { x: 1, y: 0 } },
  ]);
  const [selectedSpeaker, setSelectedSpeaker] = createSignal<string>("speaker-1");
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 0, y: 1.5 });
  const [isDraggingSpeaker, setIsDraggingSpeaker] = createSignal<string | null>(null);

  const getPositionFromEvent = (e: MouseEvent): Position => {
    if (!roomRef) return { x: 0, y: 0 };
    const rect = roomRef.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;
    return {
      x: Math.max(-2.5, Math.min(2.5, x)),
      y: Math.max(-2.5, Math.min(2.5, y)),
    };
  };

  /**
   * Get the screen position of a speaker's center for angle calculations
   */
  const getSpeakerScreenPosition = (speaker: Speaker): { x: number; y: number } => {
    if (!roomRef) return { x: 0, y: 0 };
    const rect = roomRef.getBoundingClientRect();
    return {
      x: rect.left + (0.5 + speaker.position.x * 0.2) * rect.width,
      y: rect.top + (0.5 + speaker.position.y * 0.2) * rect.height,
    };
  };

  /**
   * Handle room click - only initializes audio, no longer sets direction
   */
  const handleRoomClick = () => {
    audioStore.initializeAudio();
  };

  /**
   * Handle drag-to-rotate on a speaker
   * Calculates angle from speaker center to cursor position
   */
  const handleSpeakerDragStart = (e: MouseEvent, speaker: Speaker) => {
    e.stopPropagation();
    e.preventDefault();
    
    audioStore.initializeAudio();
    setSelectedSpeaker(speaker.id);
    setIsDraggingSpeaker(speaker.id);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const speakerScreen = getSpeakerScreenPosition(speaker);
      // Calculate angle from speaker to cursor
      const angle = Math.atan2(
        moveEvent.clientY - speakerScreen.y,
        moveEvent.clientX - speakerScreen.x
      );
      
      setSpeakers(prev => prev.map(s => 
        s.id === speaker.id ? { ...s, facing: angle } : s
      ));
    };

    const handleMouseUp = () => {
      setIsDraggingSpeaker(null);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      // Play sound on release to demonstrate the new direction
      playDirectionalSound();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleListenerDrag = (e: MouseEvent) => {
    e.stopPropagation();
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const pos = getPositionFromEvent(moveEvent);
      setListenerPos(pos);
    };

    const handleMouseUp = () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const playDirectionalSound = () => {
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;

    const speaker = speakers().find(s => s.id === selectedSpeaker());
    if (!speaker) return;

    // Calculate directional gain based on speaker facing
    const directionalGain = calculateDirectionalGain(
      speaker.facing,
      speaker.position,
      listenerPos()
    );

    // Calculate distance-based volume
    const distance = calculateDistance(speaker.position, listenerPos());
    const baseVolume = 1 / (1 + distance);
    
    // Calculate pan
    const dx = speaker.position.x - listenerPos().x;
    const pan = calculatePan(dx);

    // Apply directional gain to volume
    const finalVolume = baseVolume * directionalGain * audioStore.masterVolume() * 0.3;

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

  const addSpeaker = () => {
    const index = speakers().length;
    const newSpeaker = createSpeaker(undefined, index);
    setSpeakers(prev => [...prev, newSpeaker]);
    setSelectedSpeaker(newSpeaker.id);
  };

  const clearSpeakers = () => {
    setSpeakers([]);
    setSelectedSpeaker("");
  };

  const getGainForSpeaker = (speaker: Speaker) => {
    return calculateDirectionalGain(speaker.facing, speaker.position, listenerPos());
  };

  return (
    <div class={styles.container}>
      <div class={styles.controls}>
        <Button variant="primary" icon="➕" onClick={addSpeaker}>
          Add Speaker
        </Button>
        <Button variant="success" icon="🔊" onClick={playDirectionalSound}>
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
        <Button variant="danger" icon="🗑️" onClick={clearSpeakers}>
          Clear All
        </Button>
      </div>

      {!audioStore.audioInitialized() && (
        <div class={styles.banner}>
          <p>🔊 <strong>Drag a speaker</strong> to rotate its direction and enable audio</p>
        </div>
      )}

      <div class={styles.roomCard}>
        <h2 class={styles.roomTitle}>Speaking Direction Demo</h2>
        
        <div class={styles.room} ref={roomRef} onClick={handleRoomClick}>
          {/* Listener */}
          <div
            class={styles.listener}
            style={{
              left: `${50 + listenerPos().x * 20}%`,
              top: `${50 + listenerPos().y * 20}%`,
            }}
            onMouseDown={handleListenerDrag}
            title="Drag to move listener"
          >
            🎧
          </div>

          {/* Speakers with sound cones */}
          <For each={speakers()}>
            {(speaker) => {
              const gain = () => getGainForSpeaker(speaker);
              const isSelected = () => selectedSpeaker() === speaker.id;
              const isDragging = () => isDraggingSpeaker() === speaker.id;
              // Convert radians to degrees for CSS rotation
              const facingDegrees = () => (speaker.facing * 180 / Math.PI);
              
              return (
                <div
                  class={`${styles.speaker} ${isSelected() ? styles.selected : ""} ${isDragging() ? styles.dragging : ""}`}
                  style={{
                    left: `${50 + speaker.position.x * 20}%`,
                    top: `${50 + speaker.position.y * 20}%`,
                    "--speaker-color": speaker.color,
                  }}
                  onMouseDown={(e) => handleSpeakerDragStart(e, speaker)}
                  title={`Drag to rotate • Gain: ${(gain() * 100).toFixed(0)}% • Angle: ${facingDegrees().toFixed(0)}°`}
                >
                  {/* Sound cone visualization */}
                  <div
                    class={styles.soundCone}
                    style={{
                      transform: `rotate(${facingDegrees()}deg)`,
                      opacity: isSelected() ? 0.5 : 0.25,
                    }}
                  />
                  {/* Speaker icon */}
                  <span class={styles.speakerIcon}>🎙️</span>
                  {/* Gain indicator */}
                  <div class={styles.gainBar}>
                    <div
                      class={styles.gainFill}
                      style={{ width: `${gain() * 100}%` }}
                    />
                  </div>
                </div>
              );
            }}
          </For>

          {/* Grid lines */}
          <div class={styles.gridLineH} />
          <div class={styles.gridLineV} />
        </div>

        <div class={styles.statusBar}>
          <span>
            Listener: ({listenerPos().x.toFixed(1)}, {listenerPos().y.toFixed(1)})
          </span>
          <span>{speakers().length} speaker{speakers().length !== 1 ? "s" : ""}</span>
          <span class={styles.hint}>
            Drag speaker to rotate • Drag listener to move
          </span>
        </div>
      </div>

      <div class={styles.legend}>
        <h4>How it works</h4>
        <p>
          Each speaker has a <strong>facing direction</strong> (shown by the cone).
          Sound is <strong>loudest</strong> when the speaker faces you, and 
          <strong>quietest</strong> when facing away.
        </p>
        <ul>
          <li>Drag on a speaker to rotate its direction</li>
          <li>Drag the listener to move around the room</li>
          <li>The gain bar shows how loud you'll hear that speaker</li>
        </ul>
      </div>
    </div>
  );
}
