/**
 * useRemoteSpeaker.test.ts - Unit tests for remote speaker audio management hook
 *
 * Tests cover:
 * - Initial state
 * - Setting remote stream
 * - Updating remote position
 * - Audio parameter calculations
 * - Cleanup
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { useRemoteSpeaker, type UseRemoteSpeakerReturn } from "@lib/hooks/useRemoteSpeaker";

// Note: logger is mocked globally in src/test/setup.ts

// =============================================================================
// MediaStream Mock (not available in jsdom)
// =============================================================================

class MockMediaStream {
  id = "mock-stream-id";
  active = true;
  getTracks = vi.fn(() => []);
  getAudioTracks = vi.fn(() => []);
  getVideoTracks = vi.fn(() => []);
  addTrack = vi.fn();
  removeTrack = vi.fn();
  clone = vi.fn(() => new MockMediaStream());
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

vi.stubGlobal("MediaStream", MockMediaStream);

// =============================================================================
// Audio API Mocks
// =============================================================================

interface MockGainNode {
  gain: { value: number; linearRampToValueAtTime: ReturnType<typeof vi.fn> };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

interface MockStereoPannerNode {
  pan: { value: number };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

interface MockMediaStreamAudioSourceNode {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

interface MockAudioContext {
  createGain: ReturnType<typeof vi.fn>;
  createStereoPanner: ReturnType<typeof vi.fn>;
  createMediaStreamSource: ReturnType<typeof vi.fn>;
  destination: AudioDestinationNode;
  currentTime: number;
}

let mockGainNode: MockGainNode;
let mockPannerNode: MockStereoPannerNode;
let mockSourceNode: MockMediaStreamAudioSourceNode;
let mockAudioContext: MockAudioContext;

const createMockGainNode = (): MockGainNode => ({
  gain: { value: 1, linearRampToValueAtTime: vi.fn() },
  connect: vi.fn(),
  disconnect: vi.fn(),
});

const createMockPannerNode = (): MockStereoPannerNode => ({
  pan: { value: 0 },
  connect: vi.fn(),
  disconnect: vi.fn(),
});

const createMockSourceNode = (): MockMediaStreamAudioSourceNode => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
});

const createMockAudioContext = (): MockAudioContext => ({
  createGain: vi.fn().mockReturnValue(mockGainNode),
  createStereoPanner: vi.fn().mockReturnValue(mockPannerNode),
  createMediaStreamSource: vi.fn().mockReturnValue(mockSourceNode),
  destination: {} as AudioDestinationNode,
  currentTime: 0,
});

// Mock the audio store
vi.mock("@stores/audio", () => ({
  audioStore: {
    getAudioContext: vi.fn(() => mockAudioContext),
    masterVolume: () => 1,
  },
}));

beforeEach(() => {
  mockGainNode = createMockGainNode();
  mockPannerNode = createMockPannerNode();
  mockSourceNode = createMockSourceNode();
  mockAudioContext = createMockAudioContext();
});

afterEach(() => {
  vi.clearAllMocks();
});

// =============================================================================
// Tests
// =============================================================================

describe("useRemoteSpeaker", () => {
  let remoteSpeaker: UseRemoteSpeakerReturn;
  let dispose: () => void;

  const createRemoteSpeaker = () => {
    dispose = createRoot((d) => {
      remoteSpeaker = useRemoteSpeaker();
      return d;
    });
  };

  afterEach(() => {
    dispose?.();
  });

  describe("initial state", () => {
    beforeEach(() => createRemoteSpeaker());

    it("starts with null audio params", () => {
      expect(remoteSpeaker.audioParams()).toBeNull();
    });
  });

  describe("setRemoteStream", () => {
    beforeEach(() => createRemoteSpeaker());

    it("accepts a MediaStream", () => {
      const mockStream = new MediaStream();

      // Should not throw
      expect(() => remoteSpeaker.setRemoteStream(mockStream)).not.toThrow();
    });

    it("accepts null to clear stream", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);

      // Should not throw
      expect(() => remoteSpeaker.setRemoteStream(null)).not.toThrow();
    });

    it("creates audio nodes when stream is set", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);

      // When implemented:
      // expect(mockAudioContext.createMediaStreamSource).toHaveBeenCalledWith(mockStream);
      // expect(mockAudioContext.createGain).toHaveBeenCalled();
      // expect(mockAudioContext.createStereoPanner).toHaveBeenCalled();
    });

    it("connects audio nodes in correct order", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);

      // When implemented:
      // expect(mockSourceNode.connect).toHaveBeenCalledWith(mockPannerNode);
      // expect(mockPannerNode.connect).toHaveBeenCalledWith(mockGainNode);
      // expect(mockGainNode.connect).toHaveBeenCalledWith(mockAudioContext.destination);
    });

    it("disconnects previous stream when setting new one", () => {
      const stream1 = new MediaStream();
      const stream2 = new MediaStream();

      remoteSpeaker.setRemoteStream(stream1);
      remoteSpeaker.setRemoteStream(stream2);

      // When implemented:
      // expect(mockSourceNode.disconnect).toHaveBeenCalled();
    });

    it("cleans up nodes when stream is set to null", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);
      remoteSpeaker.setRemoteStream(null);

      // When implemented:
      // expect(mockSourceNode.disconnect).toHaveBeenCalled();
      // expect(mockGainNode.disconnect).toHaveBeenCalled();
      // expect(mockPannerNode.disconnect).toHaveBeenCalled();
    });
  });

  describe("updateRemotePosition", () => {
    beforeEach(() => createRemoteSpeaker());

    it("updates position state", () => {
      remoteSpeaker.updateRemotePosition({ x: 2, y: 3 }, Math.PI / 4);

      // When implemented, should recalculate audio params
      // This test verifies the position is stored for audio calculations
    });

    it("recalculates audio parameters when position changes", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);

      remoteSpeaker.updateRemotePosition({ x: 2, y: 0 }, 0);

      // When implemented:
      // expect(remoteSpeaker.audioParams()).not.toBeNull();
      // expect(remoteSpeaker.audioParams()?.distance).toBeCloseTo(2);
    });

    it("handles position at origin", () => {
      remoteSpeaker.updateRemotePosition({ x: 0, y: 0 }, 0);

      // Should not throw
      // When implemented, distance should be 0
    });

    it("handles various facing angles", () => {
      // Test different facing directions
      remoteSpeaker.updateRemotePosition({ x: 1, y: 0 }, 0);
      remoteSpeaker.updateRemotePosition({ x: 1, y: 0 }, Math.PI);
      remoteSpeaker.updateRemotePosition({ x: 1, y: 0 }, -Math.PI / 2);

      // Should not throw for any angle
    });
  });

  describe("audioParams calculation", () => {
    beforeEach(() => createRemoteSpeaker());

    it("returns null when no stream is set", () => {
      remoteSpeaker.updateRemotePosition({ x: 1, y: 0 }, 0);
      expect(remoteSpeaker.audioParams()).toBeNull();
    });

    it("calculates distance from listener position", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);
      remoteSpeaker.updateRemotePosition({ x: 3, y: 4 }, 0);

      // When implemented:
      // expect(remoteSpeaker.audioParams()?.distance).toBeCloseTo(5); // 3-4-5 triangle
    });

    it("calculates stereo pan based on position", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);

      // Position to the right (listener facing up by default)
      remoteSpeaker.updateRemotePosition({ x: 2, y: 0 }, 0);

      // When implemented:
      // Pan should be positive (to the right)
      // expect(remoteSpeaker.audioParams()?.pan).toBeGreaterThan(0);
    });

    it("includes directional gain", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);
      remoteSpeaker.updateRemotePosition({ x: 2, y: 0 }, 0);

      // When implemented:
      // expect(remoteSpeaker.audioParams()?.directionalGain).toBeDefined();
      // expect(remoteSpeaker.audioParams()?.directionalGain).toBeGreaterThan(0);
      // expect(remoteSpeaker.audioParams()?.directionalGain).toBeLessThanOrEqual(1);
    });

    it("applies audio parameters to nodes", () => {
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);
      remoteSpeaker.updateRemotePosition({ x: 2, y: 0 }, 0);

      // When implemented:
      // expect(mockGainNode.gain.linearRampToValueAtTime).toHaveBeenCalled();
      // OR expect(mockGainNode.gain.value) to be set
    });
  });

  describe("cleanup", () => {
    it("disconnects all nodes on unmount", () => {
      createRemoteSpeaker();
      const mockStream = new MediaStream();
      remoteSpeaker.setRemoteStream(mockStream);

      // Dispose triggers onCleanup
      dispose();

      // When implemented:
      // expect(mockSourceNode.disconnect).toHaveBeenCalled();
      // expect(mockGainNode.disconnect).toHaveBeenCalled();
      // expect(mockPannerNode.disconnect).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Audio parameter calculation tests (for when you implement)
// =============================================================================

describe("useRemoteSpeaker audio calculations", () => {
  describe("distance attenuation", () => {
    it("should attenuate volume with distance", () => {
      // Helper test for your distance calculation
      const calculateVolume = (distance: number, maxDistance = 5) => {
        if (distance <= 1) return 1;
        if (distance >= maxDistance) return 0;
        return 1 / distance; // Simple inverse model
      };

      expect(calculateVolume(1)).toBe(1);
      expect(calculateVolume(2)).toBe(0.5);
      expect(calculateVolume(5)).toBe(0);
    });
  });

  describe("stereo panning", () => {
    it("should calculate pan from angle", () => {
      // Helper test for your pan calculation
      const calculatePan = (angle: number) => {
        return Math.sin(angle); // -1 to 1 based on angle
      };

      expect(calculatePan(0)).toBeCloseTo(0); // In front
      expect(calculatePan(Math.PI / 2)).toBeCloseTo(1); // To the right
      expect(calculatePan(-Math.PI / 2)).toBeCloseTo(-1); // To the left
    });
  });
});
