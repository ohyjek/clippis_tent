/**
 * useMicrophone.ts - Microphone access hook
 *
 * Provides microphone stream management with proper cleanup.
 */
import { createSignal, onCleanup, type Accessor } from "solid-js";
import { showToast } from "@/stores/toast";
import { audioStore } from "@/stores/audio";
import { logger } from "@/lib/logger";

export interface MicrophoneOptions {
  /** Called when microphone access is granted */
  onEnabled?: () => void;
  /** Called when microphone is disabled */
  onDisabled?: () => void;
}

export interface MicrophoneState {
  /** The active microphone stream, or null if not enabled */
  stream: Accessor<MediaStream | null>;
  /** Whether the microphone is currently enabled */
  enabled: Accessor<boolean>;
  /** Request microphone access */
  request: () => Promise<boolean>;
  /** Stop the microphone and release resources */
  stop: () => void;
}

/**
 * Hook for managing microphone access
 *
 * @param options - Optional callbacks for microphone state changes
 * @returns MicrophoneState with stream, enabled status, and control functions
 */
export function useMicrophone(options?: MicrophoneOptions): MicrophoneState {
  const [stream, setStream] = createSignal<MediaStream | null>(null);
  const enabled = () => stream() !== null;

  const request = async (): Promise<boolean> => {
    // Already have a stream
    if (stream()) return true;

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: audioStore.echoCancellationEnabled(),
          noiseSuppression: audioStore.noiseSuppressionEnabled(),
          autoGainControl: true,
        },
      });
      setStream(mediaStream);
      showToast({ type: "success", message: "Microphone enabled" });
      options?.onEnabled?.();
      return true;
    } catch (err) {
      logger.error("Failed to get microphone:", err);
      showToast({
        type: "error",
        message: "Could not access microphone. Please check permissions.",
      });
      return false;
    }
  };

  const stop = () => {
    const currentStream = stream();
    if (currentStream) {
      // Stop all tracks
      currentStream.getTracks().forEach((track) => track.stop());
      setStream(null);
      showToast({ type: "info", message: "Microphone disabled" });
      options?.onDisabled?.();
    }
  };

  // Cleanup on unmount
  onCleanup(stop);

  return {
    stream,
    enabled,
    request,
    stop,
  };
}
