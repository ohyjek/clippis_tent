/* eslint-disable @typescript-eslint/no-non-null-assertion */
/**
 * useAudioPlayback.test.ts - Unit tests for audio playback hook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { useAudioPlayback, type AudioPlaybackState } from "@lib/hooks/useAudioPlayback";

// Mock audio context and nodes
const mockGainNode = {
  gain: { value: 1, linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockPannerNode = {
  pan: { value: 0 },
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockOscillator = {
  frequency: { value: 440 },
  type: "sine",
  connect: vi.fn(),
  disconnect: vi.fn(),
  start: vi.fn(),
  stop: vi.fn(),
};

const mockMediaStreamSource = {
  connect: vi.fn(),
  disconnect: vi.fn(),
};

const mockAudioContext = {
  currentTime: 0,
  destination: {},
  createGain: vi.fn(() => ({ ...mockGainNode })),
  createStereoPanner: vi.fn(() => ({ ...mockPannerNode })),
  createOscillator: vi.fn(() => ({ ...mockOscillator })),
  createMediaStreamSource: vi.fn(() => ({ ...mockMediaStreamSource })),
};

// Mock the audio store
vi.mock("@/stores/audio", () => ({
  audioStore: {
    initializeAudio: vi.fn(),
    getAudioContext: vi.fn(() => mockAudioContext),
    masterVolume: () => 0.8,
  },
}));

describe("useAudioPlayback", () => {
  let playback: AudioPlaybackState;
  let dispose: () => void;

  const createPlayback = () => {
    dispose = createRoot((d) => {
      playback = useAudioPlayback();
      return d;
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    createPlayback();
  });

  afterEach(() => {
    dispose?.();
  });

  describe("initial state", () => {
    it("starts with no playing speakers", () => {
      expect(playback.playingSpeakers().size).toBe(0);
    });

    it("isPlaying returns false for any speaker", () => {
      expect(playback.isPlaying("speaker-1")).toBe(false);
    });
  });

  describe("start", () => {
    it("creates audio nodes for oscillator source", async () => {
      const result = await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      expect(result).toBe(true);
      expect(mockAudioContext.createGain).toHaveBeenCalled();
      expect(mockAudioContext.createStereoPanner).toHaveBeenCalled();
      expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    });

    it("adds speaker to playing set", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      expect(playback.isPlaying("speaker-1")).toBe(true);
      expect(playback.playingSpeakers().has("speaker-1")).toBe(true);
    });

    it("applies initial gain and pan", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
        initialGain: 0.5,
        initialPan: -0.3,
      });

      const nodes = playback.getNodes("speaker-1");
      expect(nodes?.gainNode.gain.value).toBe(0.5);
      expect(nodes?.panner.pan.value).toBe(-0.3);
    });

    it("creates media stream source for microphone", async () => {
      const mockStream = {} as MediaStream;

      await playback.start({
        speakerId: "speaker-1",
        sourceType: "microphone",
        frequency: 440,
        microphoneStream: mockStream,
      });

      expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockStream);
    });

    it("returns false if microphone source without stream", async () => {
      const result = await playback.start({
        speakerId: "speaker-1",
        sourceType: "microphone",
        frequency: 440,
        microphoneStream: null,
      });

      expect(result).toBe(false);
    });

    it("stops existing playback before starting new", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      const firstNodes = playback.getNodes("speaker-1");
      const stopSpy = vi.spyOn(firstNodes!.source as OscillatorNode, "stop");

      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 880,
      });

      expect(stopSpy).toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("stops oscillator and disconnects nodes", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      const nodes = playback.getNodes("speaker-1")!;
      const stopSpy = vi.spyOn(nodes.source as OscillatorNode, "stop");

      playback.stop("speaker-1");

      expect(stopSpy).toHaveBeenCalled();
      expect(nodes.source.disconnect).toHaveBeenCalled();
      expect(nodes.gainNode.disconnect).toHaveBeenCalled();
      expect(nodes.panner.disconnect).toHaveBeenCalled();
    });

    it("removes speaker from playing set", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      playback.stop("speaker-1");

      expect(playback.isPlaying("speaker-1")).toBe(false);
    });

    it("does nothing for non-playing speaker", () => {
      // Should not throw
      playback.stop("nonexistent");
      expect(playback.playingSpeakers().size).toBe(0);
    });
  });

  describe("stopAll", () => {
    it("stops all playing speakers", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      await playback.start({
        speakerId: "speaker-2",
        sourceType: "oscillator",
        frequency: 880,
      });

      expect(playback.playingSpeakers().size).toBe(2);

      playback.stopAll();

      expect(playback.playingSpeakers().size).toBe(0);
    });
  });

  describe("getNodes", () => {
    it("returns undefined for non-playing speaker", () => {
      expect(playback.getNodes("speaker-1")).toBeUndefined();
    });

    it("returns audio nodes for playing speaker", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      const nodes = playback.getNodes("speaker-1");
      expect(nodes).toBeDefined();
      expect(nodes?.sourceType).toBe("oscillator");
    });
  });

  describe("updateParams", () => {
    it("updates gain and pan for playing speaker", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      const nodes = playback.getNodes("speaker-1")!;

      playback.updateParams("speaker-1", 0.7, 0.5);

      expect(nodes.gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.7, 0.02);
      expect(nodes.panner.pan.value).toBe(0.5);
    });

    it("does nothing for non-playing speaker", () => {
      // Should not throw
      playback.updateParams("nonexistent", 0.5, 0);
    });
  });

  describe("updateFrequency", () => {
    it("updates oscillator frequency", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      playback.updateFrequency("speaker-1", 880);

      const nodes = playback.getNodes("speaker-1")!;
      expect((nodes.source as OscillatorNode).frequency.value).toBe(880);
    });

    it("does nothing for microphone source", async () => {
      const mockStream = {} as MediaStream;

      await playback.start({
        speakerId: "speaker-1",
        sourceType: "microphone",
        frequency: 440,
        microphoneStream: mockStream,
      });

      // Should not throw
      playback.updateFrequency("speaker-1", 880);
    });
  });

  describe("cleanup on unmount", () => {
    it("stops all playback when component unmounts", async () => {
      await playback.start({
        speakerId: "speaker-1",
        sourceType: "oscillator",
        frequency: 440,
      });

      const nodes = playback.getNodes("speaker-1")!;
      const stopSpy = vi.spyOn(nodes.source as OscillatorNode, "stop");

      // Dispose triggers onCleanup
      dispose();

      expect(stopSpy).toHaveBeenCalled();
    });
  });
});
