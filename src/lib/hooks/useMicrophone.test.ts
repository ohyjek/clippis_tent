/**
 * useMicrophone.test.ts - Unit tests for microphone access hook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { useMicrophone, type MicrophoneState } from "./useMicrophone";

// Note: logger is mocked globally in src/test/setup.ts

// Mock the audio store
vi.mock("@/stores/audio", () => ({
  audioStore: {
    echoCancellationEnabled: () => true,
    noiseSuppressionEnabled: () => true,
  },
}));

// Mock the toast store
vi.mock("@/stores/toast", () => ({
  showToast: vi.fn(),
}));

describe("useMicrophone", () => {
  let microphone: MicrophoneState;
  let dispose: () => void;
  let mockStream: MediaStream;
  let mockTrack: MediaStreamTrack;

  const createMicrophone = (options?: Parameters<typeof useMicrophone>[0]) => {
    dispose = createRoot((d) => {
      microphone = useMicrophone(options);
      return d;
    });
  };

  beforeEach(() => {
    // Create mock stream and track
    mockTrack = {
      stop: vi.fn(),
    } as unknown as MediaStreamTrack;

    mockStream = {
      getTracks: vi.fn(() => [mockTrack]),
    } as unknown as MediaStream;

    // Mock getUserMedia
    Object.defineProperty(navigator, "mediaDevices", {
      value: {
        getUserMedia: vi.fn().mockResolvedValue(mockStream),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    dispose?.();
    vi.clearAllMocks();
  });

  describe("initial state", () => {
    beforeEach(() => createMicrophone());

    it("starts with no stream", () => {
      expect(microphone.stream()).toBeNull();
    });

    it("starts disabled", () => {
      expect(microphone.enabled()).toBe(false);
    });
  });

  describe("request", () => {
    beforeEach(() => createMicrophone());

    it("requests microphone access", async () => {
      await microphone.request();

      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledWith({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
    });

    it("stores the stream on success", async () => {
      const result = await microphone.request();

      expect(result).toBe(true);
      expect(microphone.stream()).toBe(mockStream);
      expect(microphone.enabled()).toBe(true);
    });

    it("returns true if already enabled", async () => {
      await microphone.request();
      const result = await microphone.request();

      expect(result).toBe(true);
      // Should only call getUserMedia once
      expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(1);
    });

    it("returns false on error", async () => {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
        new Error("Permission denied")
      );

      const result = await microphone.request();

      expect(result).toBe(false);
      expect(microphone.stream()).toBeNull();
      expect(microphone.enabled()).toBe(false);
    });

    it("calls onEnabled callback on success", async () => {
      const onEnabled = vi.fn();
      createMicrophone({ onEnabled });

      await microphone.request();

      expect(onEnabled).toHaveBeenCalled();
    });

    it("does not call onEnabled on error", async () => {
      vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValueOnce(
        new Error("Permission denied")
      );

      const onEnabled = vi.fn();
      createMicrophone({ onEnabled });

      await microphone.request();

      expect(onEnabled).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    beforeEach(() => createMicrophone());

    it("does nothing if not enabled", () => {
      microphone.stop();
      expect(mockTrack.stop).not.toHaveBeenCalled();
    });

    it("stops all tracks", async () => {
      await microphone.request();
      microphone.stop();

      expect(mockTrack.stop).toHaveBeenCalled();
    });

    it("clears the stream", async () => {
      await microphone.request();
      expect(microphone.stream()).not.toBeNull();

      microphone.stop();

      expect(microphone.stream()).toBeNull();
      expect(microphone.enabled()).toBe(false);
    });

    it("calls onDisabled callback", async () => {
      const onDisabled = vi.fn();
      createMicrophone({ onDisabled });

      await microphone.request();
      microphone.stop();

      expect(onDisabled).toHaveBeenCalled();
    });
  });

  describe("cleanup on unmount", () => {
    it("stops microphone when component unmounts", async () => {
      createMicrophone();
      await microphone.request();

      // Dispose triggers onCleanup
      dispose();

      expect(mockTrack.stop).toHaveBeenCalled();
    });
  });
});
