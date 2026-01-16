import { createSignal, onMount, For } from "solid-js";
import { Howl, Howler } from "howler";

function App() {
  const [listenerPos, setListenerPos] = createSignal({ x: 0, y: 0 });
  const [sounds, setSounds] = createSignal<
    Array<{
      id: string;
      position: { x: number; y: number };
      sound: Howl;
    }>
  >([]);

  // Initialize audio context on mount
  onMount(() => {
    Howler.ctx = new AudioContext();
    console.log("Audio context ready");

    // Add a test sound
    addTestSound();
  });

  const addTestSound = () => {
    const id = `sound-${Date.now()}`;
    const position = {
      x: Math.random() * 4 - 2,
      y: Math.random() * 4 - 2,
    };

    const sound = new Howl({
      src: [
        "https://assets.mixkit.co/sfx/preview/mixkit-retro-game-emergency-alarm-1000.mp3",
      ],
      loop: true,
      volume: 0.2,
      onload: () => {
        sound.play();
        updateSoundPosition(id);
      },
    });

    setSounds((prev) => [...prev, { id, position, sound }]);
  };

  const updateSoundPosition = (soundId: string) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          const dx = s.position.x - listenerPos().x;
          const distance = Math.sqrt(dx * dx);
          const volume = 1.0 / (1.0 + distance);
          const pan = Math.max(-1, Math.min(1, dx / 5));

          s.sound.volume(volume * 0.2);
          s.sound.stereo(pan);
        }
        return s;
      })
    );
  };

  const handleRoomClick = (e: MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 5;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 5;

    setListenerPos({ x, y });

    // Update all sounds
    sounds().forEach((s) => updateSoundPosition(s.id));
  };

  const moveSound = (soundId: string) => {
    setSounds((prev) =>
      prev.map((s) => {
        if (s.id === soundId) {
          const newPosition = {
            x: Math.random() * 4 - 2,
            y: Math.random() * 4 - 2,
          };

          return { ...s, position: newPosition };
        }
        return s;
      })
    );

    updateSoundPosition(soundId);
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
          Spatial Audio Prototype with SolidJS
        </p>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            "margin-bottom": "2rem",
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
            onClick={() => setSounds([])}
            style={{
              background: "#1e293b",
              border: "1px solid #475569",
              color: "#e2e8f0",
              padding: "0.75rem 1.5rem",
              "border-radius": "0.5rem",
              cursor: "pointer",
            }}
          >
            🎧 Reset Sources
          </button>
        </div>

        <div
          style={{
            background: "#1e293b",
            "border-radius": "1rem",
            padding: "1.5rem",
            "margin-bottom": "2rem",
          }}
        >
          <h2 style={{ "margin-bottom": "1rem", color: "#cbd5e1" }}>
            Audio Room
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
              {(sound) => (
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
                    background: "#8b5cf6",
                    "border-radius": "50%",
                    transform: "translate(-50%, -50%)",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    border: "2px solid #c4b5fd",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                  }}
                >
                  🔊
                </div>
              )}
            </For>
          </div>

          <div
            style={{
              "font-family": "'Courier New', monospace",
              background: "#0f172a",
              padding: "0.5rem",
              "border-radius": "0.25rem",
            }}
          >
            Listener Position: ({listenerPos().x.toFixed(2)},{" "}
            {listenerPos().y.toFixed(2)})
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
              • Click anywhere in the room to move the listener (blue circle)
            </li>
            <li>
              • Click on sound sources (purple circles) to randomize their
              positions
            </li>
            <li>• Volume decreases with distance</li>
            <li>• Stereo panning based on horizontal position</li>
            <li>• {sounds().length} active sound sources</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;
