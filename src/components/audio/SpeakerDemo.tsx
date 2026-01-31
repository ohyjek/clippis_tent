/**
 * SpeakerDemo.tsx - Speaking Direction Demo (Tab 2 of The Tent)
 *
 * Demonstrates directional audio using a cardioid pattern:
 * - Each speaker has a facing direction (shown as a cone/arrow)
 * - Sound is loudest when facing the listener, quietest when facing away
 * - Click anywhere to make the selected speaker face that point
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
  calculateAngleToPoint,
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

  const handleRoomClick = (e: MouseEvent) => {
    audioStore.initializeAudio();
    const clickPos = getPositionFromEvent(e);
    
    // Find the selected speaker and make them face the clicked point
    setSpeakers(prev => prev.map(s => {
      if (s.id === selectedSpeaker()) {
        const angle = calculateAngleToPoint(s.position, clickPos);
        return { ...s, facing: angle };
      }
      return s;
    }));
    
    // Play a sound to demonstrate the effect
    playDirectionalSound();
  };

  const handleSpeakerClick = (e: MouseEvent, speakerId: string) => {
    e.stopPropagation();
    setSelectedSpeaker(speakerId);
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
          <p>🔊 <strong>Click the room</strong> to enable audio and set speaker direction</p>
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

          {/* Speakers with direction arrows */}
          <For each={speakers()}>
            {(speaker) => {
              const gain = () => getGainForSpeaker(speaker);
              const isSelected = () => selectedSpeaker() === speaker.id;
              
              return (
                <div
                  class={`${styles.speaker} ${isSelected() ? styles.selected : ""}`}
                  style={{
                    left: `${50 + speaker.position.x * 20}%`,
                    top: `${50 + speaker.position.y * 20}%`,
                    "--speaker-color": speaker.color,
                  }}
                  onClick={(e) => handleSpeakerClick(e, speaker.id)}
                  title={`${isSelected() ? "Selected" : "Click to select"} - Gain: ${(gain() * 100).toFixed(0)}%`}
                >
                  {/* Direction arrow */}
                  <div
                    class={styles.arrow}
                    style={{
                      transform: `rotate(${speaker.facing}rad)`,
                      opacity: 0.5 + gain() * 0.5,
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
            Click to set direction • Drag listener to move
          </span>
        </div>
      </div>

      <div class={styles.legend}>
        <h4>How it works</h4>
        <p>
          Each speaker has a <strong>facing direction</strong> (shown by the arrow).
          Sound is <strong>loudest</strong> when the speaker faces you, and 
          <strong>quietest</strong> when facing away.
        </p>
        <ul>
          <li>Click a speaker to select it</li>
          <li>Click anywhere in the room to face that direction</li>
          <li>The gain bar shows how loud you'll hear that speaker</li>
        </ul>
      </div>
    </div>
  );
}
