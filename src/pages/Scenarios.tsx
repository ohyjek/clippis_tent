/**
 * Scenarios.tsx - Preset spatial audio scenarios (/scenarios)
 *
 * Demonstrates different spatial audio configurations:
 * - Surround test: sounds positioned around the listener
 * - Stereo test: left/right panning demonstration
 * - Distance test: near/far volume attenuation
 * - Campfire: social gathering simulation
 *
 * Each scenario places sound sources at predetermined positions
 * and plays them to demonstrate specific audio concepts.
 */
import { createSignal, createEffect, For, onCleanup } from "solid-js";
import { Section, SelectField, Button } from "@/components/ui";
import {
  type Position,
  calculateSpatialParams,
} from "@/lib/spatial-audio";
import { audioStore } from "@/stores/audio";
import styles from "./Scenarios.module.css";

/** A preset sound source in a scenario */
interface ScenarioSource {
  id: string;
  label: string;
  position: Position;
  frequency: number;
  color: string;
}

/** A complete scenario configuration */
interface Scenario {
  id: string;
  name: string;
  description: string;
  sources: ScenarioSource[];
  listenerPosition: Position;
}

/** Available preset scenarios */
const SCENARIOS: Scenario[] = [
  {
    id: "surround",
    name: "Surround Test",
    description: "Four sound sources positioned around you to test 360° spatial audio",
    listenerPosition: { x: 0, y: 0 },
    sources: [
      { id: "front", label: "Front", position: { x: 0, y: -2 }, frequency: 440, color: "#3b82f6" },
      { id: "back", label: "Back", position: { x: 0, y: 2 }, frequency: 330, color: "#8b5cf6" },
      { id: "left", label: "Left", position: { x: -2, y: 0 }, frequency: 262, color: "#10b981" },
      { id: "right", label: "Right", position: { x: 2, y: 0 }, frequency: 392, color: "#f59e0b" },
    ],
  },
  {
    id: "stereo",
    name: "Stereo Test",
    description: "Left and right channels to verify stereo panning works correctly",
    listenerPosition: { x: 0, y: 0 },
    sources: [
      { id: "left", label: "Left Channel", position: { x: -2.5, y: 0 }, frequency: 440, color: "#ef4444" },
      { id: "right", label: "Right Channel", position: { x: 2.5, y: 0 }, frequency: 440, color: "#3b82f6" },
    ],
  },
  {
    id: "distance",
    name: "Distance Test",
    description: "Same frequency at different distances to demonstrate volume attenuation",
    listenerPosition: { x: 0, y: 0 },
    sources: [
      { id: "near", label: "Near (loud)", position: { x: 0, y: -0.5 }, frequency: 440, color: "#10b981" },
      { id: "mid", label: "Medium", position: { x: 0, y: -1.5 }, frequency: 440, color: "#f59e0b" },
      { id: "far", label: "Far (quiet)", position: { x: 0, y: -2.5 }, frequency: 440, color: "#ef4444" },
    ],
  },
  {
    id: "campfire",
    name: "Campfire",
    description: "Simulates a social gathering with people sitting around a campfire",
    listenerPosition: { x: 0, y: 1.5 },
    sources: [
      { id: "fire", label: "Fire (crackle)", position: { x: 0, y: 0 }, frequency: 180, color: "#f97316" },
      { id: "person1", label: "Person 1", position: { x: -1.5, y: -0.5 }, frequency: 220, color: "#3b82f6" },
      { id: "person2", label: "Person 2", position: { x: 1.5, y: -0.5 }, frequency: 280, color: "#8b5cf6" },
      { id: "person3", label: "Person 3", position: { x: -1, y: 1.2 }, frequency: 320, color: "#10b981" },
      { id: "person4", label: "Person 4", position: { x: 1, y: 1.2 }, frequency: 260, color: "#ec4899" },
    ],
  },
  {
    id: "orchestra",
    name: "Orchestra Sections",
    description: "Simplified orchestra layout with different instrument sections",
    listenerPosition: { x: 0, y: 2 },
    sources: [
      { id: "strings-l", label: "Strings L", position: { x: -2, y: -1 }, frequency: 440, color: "#8b5cf6" },
      { id: "strings-r", label: "Strings R", position: { x: 2, y: -1 }, frequency: 494, color: "#a855f7" },
      { id: "woodwinds", label: "Woodwinds", position: { x: 0, y: -0.5 }, frequency: 587, color: "#10b981" },
      { id: "brass", label: "Brass", position: { x: 0, y: -2 }, frequency: 349, color: "#f59e0b" },
      { id: "percussion", label: "Percussion", position: { x: 0, y: -2.5 }, frequency: 200, color: "#ef4444" },
    ],
  },
];

/** Room dimensions in units */
const ROOM_SIZE = 6;
const ROOM_PX = 400;

/** Convert room coordinates to pixel position */
function toPixels(pos: Position): { left: number; top: number } {
  return {
    left: ((pos.x + ROOM_SIZE / 2) / ROOM_SIZE) * ROOM_PX,
    top: ((pos.y + ROOM_SIZE / 2) / ROOM_SIZE) * ROOM_PX,
  };
}

export function Scenarios() {
  const [selectedId, setSelectedId] = createSignal("surround");
  const [playing, setPlaying] = createSignal<string | null>(null);
  const [oscillators, setOscillators] = createSignal<OscillatorNode[]>([]);

  const scenario = () => SCENARIOS.find((s) => s.id === selectedId()) ?? SCENARIOS[0];

  const scenarioOptions = () =>
    SCENARIOS.map((s) => ({ value: s.id, label: s.name }));

  /** Stop all currently playing sounds */
  const stopAll = () => {
    oscillators().forEach((osc) => {
      try {
        osc.stop();
        osc.disconnect();
      } catch {
        // Already stopped
      }
    });
    setOscillators([]);
    setPlaying(null);
  };

  /** Play a single source */
  const playSource = (source: ScenarioSource) => {
    audioStore.initializeAudio();
    const ctx = audioStore.getAudioContext();
    if (!ctx) return;

    stopAll();

    const params = calculateSpatialParams(scenario().listenerPosition, source.position);
    
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const panner = ctx.createStereoPanner();

    osc.frequency.value = source.frequency;
    osc.type = "sine";
    gain.gain.value = params.volume * audioStore.masterVolume();
    panner.pan.value = params.pan;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(ctx.destination);

    osc.start();
    setOscillators([osc]);
    setPlaying(source.id);

    // Auto-stop after 2 seconds
    setTimeout(() => {
      if (playing() === source.id) {
        stopAll();
      }
    }, 2000);
  };

  /** Play all sources in sequence */
  const playSequence = () => {
    audioStore.initializeAudio();
    const ctx = audioStore.getAudioContext();
    if (!ctx) return;

    stopAll();
    setPlaying("sequence");

    const sources = scenario().sources;
    let index = 0;

    const playNext = () => {
      if (index >= sources.length) {
        stopAll();
        return;
      }

      const source = sources[index];
      const params = calculateSpatialParams(scenario().listenerPosition, source.position);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      osc.frequency.value = source.frequency;
      osc.type = "sine";
      gain.gain.value = params.volume * audioStore.masterVolume();
      panner.pan.value = params.pan;

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      osc.start();
      setOscillators([osc]);

      index++;
      setTimeout(() => {
        osc.stop();
        osc.disconnect();
        playNext();
      }, 1000);
    };

    playNext();
  };

  /** Play all sources simultaneously */
  const playAll = () => {
    audioStore.initializeAudio();
    const ctx = audioStore.getAudioContext();
    if (!ctx) return;

    stopAll();
    setPlaying("all");

    const newOscillators: OscillatorNode[] = [];

    scenario().sources.forEach((source) => {
      const params = calculateSpatialParams(scenario().listenerPosition, source.position);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const panner = ctx.createStereoPanner();

      osc.frequency.value = source.frequency;
      osc.type = "sine";
      // Reduce volume when playing multiple sources
      gain.gain.value = (params.volume * audioStore.masterVolume()) / Math.sqrt(scenario().sources.length);
      panner.pan.value = params.pan;

      osc.connect(gain);
      gain.connect(panner);
      panner.connect(ctx.destination);

      osc.start();
      newOscillators.push(osc);
    });

    setOscillators(newOscillators);

    // Auto-stop after 3 seconds
    setTimeout(() => {
      if (playing() === "all") {
        stopAll();
      }
    }, 3000);
  };

  // Cleanup on unmount
  onCleanup(() => stopAll());

  // Stop when scenario changes
  createEffect(() => {
    selectedId();
    stopAll();
  });

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>Scenarios</h1>
        <p class={styles.subtitle}>
          Preset configurations to demonstrate spatial audio concepts
        </p>
      </header>

      <Section title="Select Scenario">
        <SelectField
          label="Scenario"
          options={scenarioOptions()}
          value={selectedId()}
          onChange={(e) => setSelectedId(e.currentTarget.value)}
        />
        <p class={styles.description}>{scenario().description}</p>
      </Section>

      <div class={styles.content}>
        <Section title="Room View">
          <div class={styles.room}>
            {/* Sound sources */}
            <For each={scenario().sources}>
              {(source) => {
                const pos = () => toPixels(source.position);
                const params = () => calculateSpatialParams(scenario().listenerPosition, source.position);
                const isPlaying = () => playing() === source.id || playing() === "all" || playing() === "sequence";

                return (
                  <button
                    class={styles.source}
                    classList={{ [styles.active]: isPlaying() }}
                    style={{
                      left: `${pos().left}px`,
                      top: `${pos().top}px`,
                      "background-color": source.color,
                      "box-shadow": isPlaying() ? `0 0 20px ${source.color}` : "none",
                    }}
                    onClick={() => playSource(source)}
                    title={`${source.label} (${source.frequency}Hz)\nVolume: ${Math.round(params().volume * 100)}%\nPan: ${params().pan > 0 ? "R" : "L"} ${Math.round(Math.abs(params().pan) * 100)}%`}
                  >
                    <span class={styles.sourceLabel}>{source.label}</span>
                  </button>
                );
              }}
            </For>

            {/* Listener - using wrapper div for pixel positioning */}
            <div
              class={styles.listener}
              style={{
                left: `${toPixels(scenario().listenerPosition).left}px`,
                top: `${toPixels(scenario().listenerPosition).top}px`,
              }}
            >
              <div class={styles.listenerIcon}>🎧</div>
            </div>
          </div>
        </Section>

        <Section title="Controls">
          <div class={styles.controls}>
            <Button
              variant="primary"
              onClick={playSequence}
              disabled={playing() !== null}
            >
              Play Sequence
            </Button>
            <Button
              variant="success"
              onClick={playAll}
              disabled={playing() !== null}
            >
              Play All
            </Button>
            <Button
              variant="danger"
              onClick={stopAll}
              disabled={playing() === null}
            >
              Stop
            </Button>
          </div>

          <div class={styles.legend}>
            <p class={styles.legendTitle}>Sound Sources:</p>
            <For each={scenario().sources}>
              {(source) => {
                const params = () => calculateSpatialParams(scenario().listenerPosition, source.position);
                return (
                  <div class={styles.legendItem}>
                    <span
                      class={styles.legendDot}
                      style={{ "background-color": source.color }}
                    />
                    <span class={styles.legendLabel}>{source.label}</span>
                    <span class={styles.legendInfo}>
                      {source.frequency}Hz • Vol {Math.round(params().volume * 100)}% • Pan {params().pan > 0 ? "R" : "L"}{Math.round(Math.abs(params().pan) * 100)}%
                    </span>
                  </div>
                );
              }}
            </For>
          </div>
        </Section>
      </div>
    </div>
  );
}
