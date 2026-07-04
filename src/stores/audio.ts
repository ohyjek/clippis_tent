/**
 * audio.ts - Global audio state store (SolidJS signals)
 *
 * Singleton store managing app-wide audio state:
 * - AudioContext initialization
 * - Master volume
 * - Device preference (microphone input; feeds getUserMedia constraints)
 * - Processing settings (noise suppression, echo cancellation, spatial toggle)
 *
 * Spatial sound sources live in the FullDemo context (useSpeakerManager),
 * not here.
 *
 * Usage: import { audioStore } from "@stores/audio"
 */

import { logger } from "@lib/logger";
import { showToast } from "@stores/toast";
import { createRoot, createSignal } from "solid-js";

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
   * @returns true if the audio context was newly initialized; false if it was
   * already initialized or failed to initialize
   */
  const initializeAudio = (): boolean => {
    if (!audioInitialized()) {
      try {
        audioContext = new AudioContext(); // This is a browser API!
        setAudioInitialized(true);
        logger.audio.info("Audio context initialized");
        return true;
      } catch (err) {
        showToast({
          type: "error",
          message: "Could not initialize audio. Please check your audio settings.",
        });
        logger.audio.error("Failed to initialize audio context:", err);
        return false;
      }
    }
    logger.audio.silly("Audio context already initialized");
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
   * getUserMedia audio constraints for voice capture — the single place the
   * processing settings and device selection feed the microphone. Every
   * capture path (useMicrophone, the WebRTC store) must build from this.
   *
   * The device id uses `ideal` rather than `exact` so a stale saved id (e.g.
   * an unplugged mic) degrades to the default device instead of failing.
   */
  const microphoneConstraints = (): MediaTrackConstraints => {
    const deviceId = audioInputDevice();
    return {
      echoCancellation: echoCancellationEnabled(),
      noiseSuppression: noiseSuppressionEnabled(),
      autoGainControl: true,
      ...(deviceId ? { deviceId: { ideal: deviceId } } : {}),
    };
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

    // Settings
    audioInputDevice,
    audioOutputDevice,
    spatialAudioEnabled,
    echoCancellationEnabled,
    noiseSuppressionEnabled,

    // Actions
    initializeAudio,
    updateMasterVolume,
    microphoneConstraints,
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
