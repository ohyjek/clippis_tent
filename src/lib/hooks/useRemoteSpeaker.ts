/**
 * useRemoteSpeaker.ts - Spatialized playback for a remote peer's audio stream
 *
 * Routes a remote WebRTC MediaStream through the spatial audio graph
 * (source → panner → gain → destination) and recomputes pan/gain whenever the
 * remote position, the listener, walls, or audio settings change.
 */

import type {
  AudioParameterOptions,
  AudioParameters,
  Listener,
  Position,
  Wall,
} from "@clippis/types";
import { logger } from "@lib/logger";
import { calculateAudioParameters } from "@lib/spatial-audio-engine";
import { audioStore } from "@stores/audio";
import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from "solid-js";

export interface RemoteSpeakerOptions {
  /** Listener (perspective) to spatialize against. Defaults to origin, facing up. */
  getListener?: () => Listener;
  /** Walls for occlusion. Defaults to none. */
  getWalls?: () => Wall[];
  /** Audio parameter options (distance model, master volume, ...). */
  getAudioOptions?: () => AudioParameterOptions;
}

export interface UseRemoteSpeakerReturn {
  // Bind remote stream to audio output
  setRemoteStream: (stream: MediaStream | null) => void;

  // Update remote peer position (from DataChannel)
  updateRemotePosition: (position: Position, facing: number) => void;

  // Calculated audio parameters
  audioParams: Accessor<AudioParameters | null>;
}

interface RemoteAudioNodes {
  source: MediaStreamAudioSourceNode;
  panner: StereoPannerNode;
  gain: GainNode;
}

export function useRemoteSpeaker(options?: RemoteSpeakerOptions): UseRemoteSpeakerReturn {
  const [remotePosition, setRemotePosition] = createSignal<Position>({ x: 0, y: 0 });
  const [remoteFacing, setRemoteFacing] = createSignal(0);
  const [hasStream, setHasStream] = createSignal(false);

  let nodes: RemoteAudioNodes | null = null;
  // Belt-and-braces for the old Chromium quirk (crbug.com/121673) where a
  // remote WebRTC stream routed only through Web Audio stays silent unless it
  // is also attached to a media element. Muted, so it never double-plays.
  let monitorEl: HTMLAudioElement | null = null;

  const audioParams = createMemo<AudioParameters | null>(() => {
    if (!hasStream()) return null;
    const listener = options?.getListener?.() ?? {
      position: { x: 0, y: 0 },
      facing: -Math.PI / 2, // up
    };
    return calculateAudioParameters(
      {
        id: "remote-peer",
        position: remotePosition(),
        facing: remoteFacing(),
        directivity: "omnidirectional", // never fully mute a voice based on its facing
        volume: 1,
        frequency: 0,
        waveform: "sine",
        playing: true,
      },
      listener,
      options?.getWalls?.() ?? [],
      {
        masterVolume: audioStore.masterVolume(),
        ...options?.getAudioOptions?.(),
      }
    );
  });

  // Apply calculated parameters to the live audio nodes
  createEffect(() => {
    const params = audioParams();
    if (!params || !nodes) return;
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) return;
    nodes.gain.gain.linearRampToValueAtTime(params.volume, audioContext.currentTime + 0.05);
    nodes.panner.pan.value = params.pan;
  });

  const teardown = () => {
    if (nodes) {
      nodes.source.disconnect();
      nodes.panner.disconnect();
      nodes.gain.disconnect();
      nodes = null;
    }
    if (monitorEl) {
      try {
        monitorEl.srcObject = null;
        monitorEl.remove();
      } catch {
        // jsdom / detached element — nothing to clean up
      }
      monitorEl = null;
    }
    setHasStream(false);
  };

  const setRemoteStream = (stream: MediaStream | null) => {
    teardown();
    if (!stream) return;

    audioStore.initializeAudio();
    const audioContext = audioStore.getAudioContext();
    if (!audioContext) {
      logger.warn("No audio context available for remote stream");
      return;
    }

    const source = audioContext.createMediaStreamSource(stream);
    const panner = audioContext.createStereoPanner();
    const gain = audioContext.createGain();
    source.connect(panner);
    panner.connect(gain);
    gain.connect(audioContext.destination);
    nodes = { source, panner, gain };

    try {
      const el = document.createElement("audio");
      el.muted = true;
      el.autoplay = true;
      el.srcObject = stream;
      void el.play?.()?.catch?.(() => {
        /* autoplay restrictions — muted playback will start on gesture */
      });
      monitorEl = el;
    } catch (error) {
      logger.warn("Could not attach muted monitor element for remote stream", error);
    }

    setHasStream(true);
    logger.info("Remote stream attached to spatial audio graph");
  };

  const updateRemotePosition = (position: Position, facing: number) => {
    setRemotePosition(position);
    setRemoteFacing(facing);
  };

  // Cleanup on unmount
  onCleanup(teardown);

  return {
    setRemoteStream,
    updateRemotePosition,
    audioParams,
  };
}
