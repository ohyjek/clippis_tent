import { createSignal, onMount, For } from "solid-js";
import { Howler } from "howler";

// Sound frequencies for different sound sources (musical notes)
const SOUND_FREQUENCIES = [330, 392, 440, 494, 523, 587, 659, 784];

// Sound source type using Web Audio API
interface SoundSource {
  id: string;
  position: { x: number; y: number };
  frequency: number;
}

function App() {
  const [listenerPos, setListenerPos] = createSignal({ x: 0, y: 0 });
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

    const id = `sound-${Date.now()}`;
    const position = {
      x: Math.random() * 4 - 2,
      y: Math.random() * 4 - 2,
    };

    // Pick a random frequency from our musical notes
    const frequency = SOUND_FREQUENCIES[Math.floor(Math.random() * SOUND_FREQUENCIES.length)];

    setSounds((prev) => [...prev, { id, position, frequency }]);

    // Play the sound immediately to give feedback
    setTimeout(() => {
      playSoundAtPosition(position, frequency);
    }, 100);
  };

  // Play a tone at a specific position with spatial audio
  const playSoundAtPosition = (position: { x: number; y: number }, frequency: number) => {
    if (!audioInitialized()) return;

    const audioContext = Howler.ctx as AudioContext;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    oscillator.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Calculate spatial audio parameters
    const dx = position.x - listenerPos().x;
    const dy = position.y - listenerPos().y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const volume = (1.0 / (1.0 + distance)) * masterVolume() * 0.3;
    const pan = Math.max(-1, Math.min(1, dx / 3));

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
          const newPosition = {
            x: Math.random() * 4 - 2,
            y: Math.random() * 4 - 2,
          };
          movedSound = { ...s, position: newPosition };
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

    const directions = [
      { x: -2, y: 0, name: "Left", freq: 330 },
      { x: 2, y: 0, name: "Right", freq: 440 },
      { x: 0, y: -2, name: "Front", freq: 550 },
      { x: 0, y: 2, name: "Back", freq: 660 },
    ];

    directions.forEach((dir, i) => {
      setTimeout(() => {
        console.log(`Playing ${dir.name} tone`);
        playSoundAtPosition({ x: dir.x, y: dir.y }, dir.freq);
      }, i * 800);
    });
  };

  return (
    <div
      style={{
        "font-family": "system-ui, sans-serif",
        background: "#0f172a",
        color: "#e2e8f0",
        "min-height": "100vh",
        padding: "2rem",
      }}
    >
      <div style={{ "max-width": "1200px", margin: "0 auto" }}>
        <h1
          style={{
            "font-size": "2.5rem",
            background: "linear-gradient(90deg, #8b5cf6, #3b82f6)",
            "-webkit-background-clip": "text",
            "-webkit-text-fill-color": "transparent",
            "margin-bottom": "0.5rem",
          }}
        >
          🎮 Dolby Axon Clone
        </h1>
        <p style={{ color: "#94a3b8", "margin-bottom": "2rem" }}>
          Spatial Audio Prototype with SolidJS -{" "}
          {audioInitialized() ? "Audio Active 🔊" : "Click to activate audio"}
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            "margin-bottom": "2rem",
            "flex-wrap": "wrap",
            "align-items": "center",
          }}
        >
          <button
            onClick={addTestSound}
            style={{
              background: "#3b82f6",
              border: "none",
              color: "white",
              padding: "0.75rem 1.5rem",
              "border-radius": "0.5rem",
              cursor: "pointer",
            }}
          >
            ➕ Add Sound Source
          </button>

          <button
            onClick={playSoundDemo}
            style={{
              background: "#10b981",
              border: "none",
              color: "white",
              padding: "0.75rem 1.5rem",
              "border-radius": "0.5rem",
              cursor: "pointer",
            }}
          >
            🔊 Play Demo
          </button>

          <button
            onClick={testCardinalDirections}
            style={{
              background: "#8b5cf6",
              border: "none",
              color: "white",
              padding: "0.75rem 1.5rem",
              "border-radius": "0.5rem",
              cursor: "pointer",
            }}
          >
            🧭 Test Directions
          </button>

          <div
            style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}
          >
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
              style={{ width: "100px" }}
            />
            <span>{Math.round(masterVolume() * 100)}%</span>
          </div>

          <button
            onClick={() => setListenerPos({ x: 0, y: 0 })}
            style={{
              background: "#1e293b",
              border: "1px solid #475569",
              color: "#e2e8f0",
              padding: "0.75rem 1.5rem",
              "border-radius": "0.5rem",
              cursor: "pointer",
            }}
          >
            🎧 Reset Listener
          </button>

          <button
            onClick={() => {
              setSounds([]);
            }}
            style={{
              background: "#ef4444",
              border: "none",
              color: "white",
              padding: "0.75rem 1.5rem",
              "border-radius": "0.5rem",
              cursor: "pointer",
            }}
          >
            🗑️ Clear All
          </button>
        </div>

        {!audioInitialized() && (
          <div
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid #3b82f6",
              "border-radius": "0.5rem",
              padding: "1rem",
              "margin-bottom": "2rem",
              "text-align": "center",
            }}
          >
            <p style={{ margin: 0 }}>
              🔊 <strong>Audio needs activation:</strong> Click anywhere on the
              page to enable audio playback. This is a browser security
              requirement.
            </p>
          </div>
        )}

        <div
          style={{
            background: "#1e293b",
            "border-radius": "1rem",
            padding: "1.5rem",
            "margin-bottom": "2rem",
          }}
        >
          <h2 style={{ "margin-bottom": "1rem", color: "#cbd5e1" }}>
            Audio Room {audioInitialized() && "🔊"}
          </h2>

          <div
            onClick={handleRoomClick}
            style={{
              position: "relative",
              width: "100%",
              height: "500px",
              background: "#0f172a",
              border: "2px solid #475569",
              "border-radius": "0.5rem",
              cursor: "crosshair",
              "margin-bottom": "1rem",
            }}
          >
            {/* Listener */}
            <div
              style={{
                position: "absolute",
                left: `${50 + listenerPos().x * 20}%`,
                top: `${50 + listenerPos().y * 20}%`,
                width: "40px",
                height: "40px",
                background: "#3b82f6",
                "border-radius": "50%",
                transform: "translate(-50%, -50%)",
                display: "flex",
                "align-items": "center",
                "justify-content": "center",
                border: "3px solid #93c5fd",
                "box-shadow": "0 0 20px rgba(59, 130, 246, 0.5)",
              }}
            >
              🎧
            </div>

            {/* Sound Sources */}
            <For each={sounds()}>
              {(sound, index) => (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    moveSound(sound.id);
                  }}
                  style={{
                    position: "absolute",
                    left: `${50 + sound.position.x * 20}%`,
                    top: `${50 + sound.position.y * 20}%`,
                    width: "30px",
                    height: "30px",
                    background: `hsl(${index() * 60}, 70%, 60%)`,
                    "border-radius": "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    border: "2px solid white",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    "font-weight": "bold",
                  }}
                  title={`Click to move sound source ${index() + 1}`}
                >
                  {index() + 1}
                </div>
              )}
            </For>

            {/* Room grid */}
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "0",
                right: "0",
                height: "1px",
                background: "rgba(255,255,255,0.1)",
                transform: "translateY(-50%)",
              }}
            ></div>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "0",
                bottom: "0",
                width: "1px",
                background: "rgba(255,255,255,0.1)",
                transform: "translateX(-50%)",
              }}
            ></div>

            {/* Direction labels */}
            <div
              style={{
                position: "absolute",
                left: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              ← Left
            </div>
            <div
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                color: "rgba(255,255,255,0.5)",
              }}
            >
              Right →
            </div>
          </div>

          <div
            style={{
              "font-family": "'Courier New', monospace",
              background: "#0f172a",
              padding: "0.5rem",
              "border-radius": "0.25rem",
              display: "flex",
              "justify-content": "space-between",
              "align-items": "center",
            }}
          >
            <div>
              Listener Position: ({listenerPos().x.toFixed(2)},{" "}
              {listenerPos().y.toFixed(2)})
            </div>
            <div>
              {sounds().length} sound{sounds().length !== 1 ? "s" : ""} active
            </div>
            <div style={{ "font-size": "0.9em", color: "#94a3b8" }}>
              Click room to move listener • Click numbers to move sounds
            </div>
          </div>
        </div>

        <div
          style={{
            background: "#1e293b",
            "border-radius": "1rem",
            padding: "1.5rem",
          }}
        >
          <h3 style={{ "margin-bottom": "1rem", color: "#cbd5e1" }}>
            How it works:
          </h3>
          <ul style={{ color: "#94a3b8", "line-height": "1.6" }}>
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

          <div
            style={{
              "margin-top": "1.5rem",
              padding: "1rem",
              background: "rgba(139, 92, 246, 0.1)",
              "border-radius": "0.5rem",
              "border-left": "4px solid #8b5cf6",
            }}
          >
            <strong>🎯 Next steps:</strong>
            <ol style={{ "margin-top": "0.5rem", "padding-left": "1.5rem" }}>
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
