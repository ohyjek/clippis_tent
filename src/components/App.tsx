import { createSignal, onMount, For } from "solid-js";
import { Howler } from "howler";
import {
  type SoundSource,
  type Position,
  calculateSpatialParams,
  createSoundSource,
  randomPosition,
  CARDINAL_DIRECTIONS,
} from "../lib/spatial-audio";
import styles from "./App.module.css";

function App() {
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 0, y: 0 });
  const [sounds, setSounds] = createSignal<SoundSource[]>([]);
  const [masterVolume, setMasterVolume] = createSignal(0.5);
  const [audioInitialized, setAudioInitialized] = createSignal(false);

  // Initialize audio context on mount
  onMount(() => {
    // Set master volume
    Howler.volume(masterVolume());

    // Add a click handler to initialize audio on first user interaction
    const initAudio = () => {
      if (!audioInitialized()) {
        Howler.ctx = new AudioContext();
        console.log("Audio context ready");
        setAudioInitialized(true);

        // Add initial test sounds
        for (let i = 0; i < 3; i++) {
          setTimeout(() => addTestSound(), i * 300);
        }
      }
    };

    // Initialize on any click
    document.addEventListener("click", initAudio, { once: true });

    // Also initialize if user clicks our buttons
    return () => {
      document.removeEventListener("click", initAudio);
    };
  });

  // Update master volume when slider changes
  const updateMasterVolume = (value: number) => {
    setMasterVolume(value);
    Howler.volume(value);
  };

  const addTestSound = () => {
    // Make sure audio is initialized
    if (!audioInitialized()) {
      Howler.ctx = new AudioContext();
      setAudioInitialized(true);
    }

    const newSound = createSoundSource();
    setSounds((prev) => [...prev, newSound]);

    // Play the sound immediately to give feedback
    setTimeout(() => {
      playSoundAtPosition(newSound.position, newSound.frequency);
    }, 100);
  };

  // Play a tone at a specific position with spatial audio
  const playSoundAtPosition = (position: Position, frequency: number) => {
    if (!audioInitialized()) return;

    const audioContext = Howler.ctx as AudioContext;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Calculate spatial audio parameters using utility function
    const { volume, pan } = calculateSpatialParams(
      listenerPos(),
      position,
      masterVolume()
    );

    oscillator.frequency.value = frequency;
    oscillator.type = "sine";
    gainNode.gain.value = volume;
    panner.pan.value = pan;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.25);
  };

  const handleRoomClick = (e: MouseEvent) => {
    // Initialize audio if not already
    if (!audioInitialized()) {
      Howler.ctx = new AudioContext();
      setAudioInitialized(true);
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;

    setListenerPos({ x, y });
  };

  const moveSound = (soundId: string) => {
    let movedSound: SoundSource | undefined;

    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          movedSound = { ...s, position: randomPosition() };
          return movedSound;
        }
        return s;
      })
    );

    // Play sound at new position
    if (movedSound) {
      playSoundAtPosition(movedSound.position, movedSound.frequency);
    }
  };

  // Play all sounds in sequence to demonstrate spatial audio
  const playSoundDemo = () => {
    sounds().forEach((s, i) => {
      setTimeout(() => {
        playSoundAtPosition(s.position, s.frequency);
      }, i * 500);
    });
  };

  // Test spatial audio with cardinal directions
  const testCardinalDirections = () => {
    if (!audioInitialized()) {
      Howler.ctx = new AudioContext();
      setAudioInitialized(true);
    }

    CARDINAL_DIRECTIONS.forEach((dir, i) => {
      setTimeout(() => {
        console.log(`Playing ${dir.name} tone`);
        playSoundAtPosition({ x: dir.x, y: dir.y }, dir.frequency);
      }, i * 800);
    });
  };

  return (
    <div class={styles.app}>
      <div class={styles.container}>
        <h1 class={styles.title}>🎮 Clippi's Tent</h1>
        <p class={styles.subtitle}>
          Spatial Audio Prototype with SolidJS -{" "}
          {audioInitialized() ? "Audio Active 🔊" : "Click to activate audio"}
        </p>

        <div class={styles.controls}>
          <button
            class={`${styles.btn} ${styles.btnPrimary}`}
            onClick={addTestSound}
          >
            ➕ Add Sound Source
          </button>

          <button
            class={`${styles.btn} ${styles.btnSuccess}`}
            onClick={playSoundDemo}
          >
            🔊 Play Demo
          </button>

          <button
            class={`${styles.btn} ${styles.btnPurple}`}
            onClick={testCardinalDirections}
          >
            🧭 Test Directions
          </button>

          <div class={styles.volumeControl}>
            <span>Volume:</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume()}
              onInput={(e) =>
                updateMasterVolume(parseFloat(e.currentTarget.value))
              }
              class={styles.volumeSlider}
            />
            <span>{Math.round(masterVolume() * 100)}%</span>
          </div>

          <button
            class={`${styles.btn} ${styles.btnOutline}`}
            onClick={() => setListenerPos({ x: 0, y: 0 })}
          >
            🎧 Reset Listener
          </button>

          <button
            class={`${styles.btn} ${styles.btnDanger}`}
            onClick={() => setSounds([])}
          >
            🗑️ Clear All
          </button>
        </div>

        {!audioInitialized() && (
          <div class={styles.audioBanner}>
            <p>
              🔊 <strong>Audio needs activation:</strong> Click anywhere on the
              page to enable audio playback. This is a browser security
              requirement.
            </p>
          </div>
        )}

        <div class={styles.card}>
          <h2 class={styles.cardTitle}>
            Audio Room {audioInitialized() && "🔊"}
          </h2>

          <div class={styles.room} onClick={handleRoomClick}>
            {/* Listener */}
            <div
              class={styles.listener}
              style={{
                left: `${50 + listenerPos().x * 20}%`,
                top: `${50 + listenerPos().y * 20}%`,
              }}
            >
              🎧
            </div>

            {/* Sound Sources */}
            <For each={sounds()}>
              {(sound, index) => (
                <div
                  class={styles.soundSource}
                  style={{
                    left: `${50 + sound.position.x * 20}%`,
                    top: `${50 + sound.position.y * 20}%`,
                    background: `hsl(${index() * 60}, 70%, 60%)`,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSound(sound.id);
                  }}
                  title={`Click to move sound source ${index() + 1}`}
                >
                  {index() + 1}
                </div>
              )}
            </For>

            {/* Room grid */}
            <div class={styles.gridLineH} />
            <div class={styles.gridLineV} />

            {/* Direction labels */}
            <div
              class={`${styles.directionLabel} ${styles.directionLabelLeft}`}
            >
              ← Left
            </div>
            <div
              class={`${styles.directionLabel} ${styles.directionLabelRight}`}
            >
              Right →
            </div>
          </div>

          <div class={styles.statusBar}>
            <div>
              Listener Position: ({listenerPos().x.toFixed(2)},{" "}
              {listenerPos().y.toFixed(2)})
            </div>
            <div>
              {sounds().length} sound{sounds().length !== 1 ? "s" : ""} active
            </div>
            <div class={styles.statusHint}>
              Click room to move listener • Click numbers to move sounds
            </div>
          </div>
        </div>

        <div class={styles.card}>
          <h3 class={styles.cardTitle}>How it works:</h3>
          <ul class={styles.instructions}>
            <li>
              • <strong>First, click anywhere</strong> to activate audio
              (browser requirement)
            </li>
            <li>
              • <strong>Click anywhere in the room</strong> to move the listener
            </li>
            <li>
              • <strong>Click on numbered sound sources</strong> to randomize
              their positions
            </li>
            <li>
              • <strong>Volume decreases with distance</strong> (inverse square
              law)
            </li>
            <li>
              • <strong>Stereo panning based on horizontal position</strong>{" "}
              (left/right)
            </li>
            <li>
              • <strong>"Test Directions"</strong> uses direct Web Audio API
              (should always work)
            </li>
            <li>
              • <strong>"Play Demo"</strong> plays all sounds in sequence
            </li>
            <li>• Adjust master volume with the slider</li>
          </ul>

          <div class={styles.callout}>
            <strong>🎯 Next steps:</strong>
            <ol>
              <li>Add real microphone input</li>
              <li>Add WebRTC for peer-to-peer connections</li>
              <li>Implement proper HRTF for 3D audio</li>
              <li>Add room echo simulation</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
