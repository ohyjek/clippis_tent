/**
 * audio.ts - Global audio state store (SolidJS signals)
 *
 * Singleton store managing all audio-related state:
 * - AudioContext initialization
 * - Master volume
 * - Listener position
 * - Sound sources list
 * - Device preferences (input/output)
 * - Processing settings (spatial, noise suppression, echo cancellation)
 *
 * Usage: import { audioStore } from "@/stores/audio"
 */
import { createSignal, createRoot } from "solid-js";
import type { SoundSource, Position } from "@clippis/types";
import { createSoundSource, randomPosition } from "../lib/spatial-audio";
import { logger } from "../lib/logger";
import { showToast } from "./toast";

// Store AudioContext outside of reactive system
let audioContext: AudioContext | null = null;

/**
 * Create the audio store.
 * @returns The audio store.
 */
function createAudioStore() {
  // Audio state
  const [audioInitialized, setAudioInitialized] = createSignal(false);
  const [masterVolume, setMasterVolume] = createSignal(0.5);

  // Spatial audio state
  const [listenerPos, setListenerPos] = createSignal<Position>({ x: 0, y: 0 });
  const [sounds, setSounds] = createSignal<SoundSource[]>([]);

  // Settings
  const [audioInputDevice, setAudioInputDevice] = createSignal<string>("");
  const [audioOutputDevice, setAudioOutputDevice] = createSignal<string>("");
  const [spatialAudioEnabled, setSpatialAudioEnabled] = createSignal(true);
  const [noiseSuppressionEnabled, setNoiseSuppressionEnabled] = createSignal(true);
  const [echoCancellationEnabled, setEchoCancellationEnabled] = createSignal(true);

  /**
   * Initialize the AudioContext Browser API.
   *
   * @note This is a browser API! (This is NOT a solid/reactive context)
   * @returns True if the audio context was initialized, false otherwise.
   */
  const initializeAudio = (): boolean => {
    if (!audioInitialized()) {
      try {
        audioContext = new AudioContext(); // This is a browser API!
        logger.audio.info("Audio context initialized");
        setAudioInitialized(true);
        return true;
      } catch (err) {
        logger.audio.error("Failed to initialize audio context:", err);
        showToast({
          type: "error",
          message: "Could not initialize audio. Please check your audio settings.",
        });
        return false;
      }
    }
    return false;
  };

  /**
   * Update the master volume.
   * @param value - The new master volume value.
   */
  const updateMasterVolume = (value: number) => {
    setMasterVolume(value);
  };

  /**
   * Add a new sound source.
   * @returns The new sound source.
   */
  const addSound = () => {
    initializeAudio();
    const newSound = createSoundSource();
    setSounds((prev) => [...prev, newSound]);
    return newSound;
  };

  /**
   * Move a sound source to a new random position.
   * @param soundId - The ID of the sound source to move.
   * @returns The moved sound source.
   */
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

    return movedSound;
  };

  /**
   * Update a sound source's position (for dragging).
   * @param soundId - The ID of the sound source to update.
   * @param position - The new position of the sound source.
   */
  const updateSoundPosition = (soundId: string, position: Position) => {
    setSounds((prev) => prev.map((s) => (s.id === soundId ? { ...s, position } : s)));
  };

  /**
   * Get a sound by ID.
   * @param soundId - The ID of the sound source to get.
   * @returns The sound source.
   */
  const getSound = (soundId: string): SoundSource | undefined => {
    return sounds().find((s) => s.id === soundId);
  };

  /**
   * Remove all sounds.
   */
  const clearSounds = () => {
    setSounds([]);
  };

  /**
   * Reset listener position.
   */
  const resetListenerPosition = () => {
    setListenerPos({ x: 0, y: 0 });
  };

  /**
   * Get the audio context.
   * @returns The audio context.
   */
  const getAudioContext = (): AudioContext | null => {
    return audioContext;
  };

  return {
    // State (read-only signals)
    audioInitialized,
    masterVolume,
    listenerPos,
    sounds,

    // Settings
    audioInputDevice,
    audioOutputDevice,
    spatialAudioEnabled,
    echoCancellationEnabled,
    noiseSuppressionEnabled,

    // Actions
    initializeAudio,
    updateMasterVolume,
    setListenerPos,
    addSound,
    moveSound,
    updateSoundPosition,
    getSound,
    clearSounds,
    resetListenerPosition,
    getAudioContext,

    // Settings actions
    setAudioInputDevice,
    setAudioOutputDevice,
    setSpatialAudioEnabled,
    setEchoCancellationEnabled,
    setNoiseSuppressionEnabled,
  };
}

// Create singleton store
export const audioStore = createRoot(createAudioStore);
// Export the type of the audio store for convenience
export type AudioStore = ReturnType<typeof createAudioStore>;
