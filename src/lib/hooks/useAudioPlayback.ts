/**
 * useAudioPlayback.ts - Audio playback management hook
 *
 * Manages audio nodes for multiple speakers with real-time parameter updates.
 */
import { createSignal, onCleanup, type Accessor } from "solid-js";
import { audioStore } from "@stores/audio";
import type { AudioSourceType, AudioNodes } from "@clippis/types";

export type { AudioNodes };

/** Parameters for starting playback */
export interface PlaybackParams {
  speakerId: string;
  sourceType: AudioSourceType;
  frequency: number;
  initialGain?: number;
  initialPan?: number;
  microphoneStream?: MediaStream | null;
}

export interface AudioPlaybackState {
  /** Set of currently playing speaker IDs */
  playingSpeakers: Accessor<Set<string>>;
  /** Check if a specific speaker is playing */
  isPlaying: (speakerId: string) => boolean;
  /** Start playback for a speaker */
  start: (params: PlaybackParams) => Promise<boolean>;
  /** Stop playback for a speaker */
  stop: (speakerId: string) => void;
  /** Stop all playback */
  stopAll: () => void;
  /** Get audio nodes for a speaker (for real-time updates) */
  getNodes: (speakerId: string) => AudioNodes | undefined;
  /** Update gain and pan for a speaker */
  updateParams: (speakerId: string, gain: number, pan: number) => void;
  /** Update frequency for an oscillator source */
  updateFrequency: (speakerId: string, frequency: number) => void;
}

/**
 * Hook for managing audio playback across multiple speakers.
 *
 * - Uses a signal of string set to keep track of the currently playing speakers.
 * - Uses a map to keep track of the audio nodes for each speaker.
 *
 * @returns The audio playback state.
 */
export function useAudioPlayback(): AudioPlaybackState {
  const [playingSpeakers, setPlayingSpeakers] = createSignal<Set<string>>(new Set());
  const audioNodes = new Map<string, AudioNodes>();

  const isPlaying = (speakerId: string) => playingSpeakers().has(speakerId);

  const getNodes = (speakerId: string) => audioNodes.get(speakerId);

  const start = async (params: PlaybackParams): Promise<boolean> => {
    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return false;

    // Stop existing playback if any
    if (audioNodes.has(params.speakerId)) {
      stop(params.speakerId);
    }

    const gainNode = audioContext.createGain();
    const panner = audioContext.createStereoPanner();

    let source: OscillatorNode | MediaStreamAudioSourceNode;

    if (params.sourceType === "microphone") {
      if (!params.microphoneStream) return false;
      source = audioContext.createMediaStreamSource(params.microphoneStream);
    } else {
      const oscillator = audioContext.createOscillator();
      oscillator.frequency.value = params.frequency;
      oscillator.type = "sine";
      oscillator.start();
      source = oscillator;
    }

    // Connect: source → panner → gain → destination
    source.connect(panner);
    panner.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Set initial parameters
    gainNode.gain.value = params.initialGain ?? 1;
    panner.pan.value = params.initialPan ?? 0;

    audioNodes.set(params.speakerId, {
      source,
      sourceType: params.sourceType,
      gainNode,
      panner,
    });

    setPlayingSpeakers((prev) => new Set([...prev, params.speakerId]));
    return true;
  };

  const stop = (speakerId: string) => {
    const nodes = audioNodes.get(speakerId);
    if (nodes) {
      if (nodes.sourceType === "oscillator") {
        (nodes.source as OscillatorNode).stop();
      }
      nodes.source.disconnect();
      nodes.gainNode.disconnect();
      nodes.panner.disconnect();
      audioNodes.delete(speakerId);
    }
    setPlayingSpeakers((prev) => {
      const next = new Set(prev);
      next.delete(speakerId);
      return next;
    });
  };

  const stopAll = () => {
    for (const id of audioNodes.keys()) {
      stop(id);
    }
  };

  const updateParams = (speakerId: string, gain: number, pan: number) => {
    const nodes = audioNodes.get(speakerId);
    const audioContext = audioStore.getAudioContext();
    if (!nodes || !audioContext) return;

    nodes.gainNode.gain.linearRampToValueAtTime(gain, audioContext.currentTime + 0.02);
    nodes.panner.pan.value = pan;
  };

  const updateFrequency = (speakerId: string, frequency: number) => {
    const nodes = audioNodes.get(speakerId);
    if (nodes && nodes.sourceType === "oscillator") {
      (nodes.source as OscillatorNode).frequency.value = frequency;
    }
  };

  // Cleanup on unmount
  onCleanup(stopAll);

  return {
    playingSpeakers,
    isPlaying,
    start,
    stop,
    stopAll,
    getNodes,
    updateParams,
    updateFrequency,
  };
}
