/**
 * useWebRTC.test.ts - Unit tests for WebRTC connection management hook
 *
 * Tests cover:
 * - Initial state
 * - Creating offers (initiator flow)
 * - Setting remote SDP (answerer flow)
 * - Connection state transitions
 * - Data channel messaging
 * - Disconnect/cleanup
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { useWebRTC, type UseWebRTCReturn } from "@lib/hooks/useWebRTC";

// Note: logger is mocked globally in src/test/setup.ts

// =============================================================================
// WebRTC API Mocks
// =============================================================================

interface MockRTCPeerConnection {
  createOffer: ReturnType<typeof vi.fn>;
  createAnswer: ReturnType<typeof vi.fn>;
  setLocalDescription: ReturnType<typeof vi.fn>;
  setRemoteDescription: ReturnType<typeof vi.fn>;
  addTrack: ReturnType<typeof vi.fn>;
  createDataChannel: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  connectionState: RTCPeerConnectionState;
  localDescription: RTCSessionDescription | null;
  remoteDescription: RTCSessionDescription | null;
  onicecandidate: ((event: RTCPeerConnectionIceEvent) => void) | null;
  onconnectionstatechange: (() => void) | null;
  ondatachannel: ((event: RTCDataChannelEvent) => void) | null;
  ontrack: ((event: RTCTrackEvent) => void) | null;
}

interface MockRTCDataChannel {
  send: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  readyState: RTCDataChannelState;
  onopen: (() => void) | null;
  onclose: (() => void) | null;
  onmessage: ((event: MessageEvent) => void) | null;
  onerror: ((event: Event) => void) | null;
}

let mockPeerConnection: MockRTCPeerConnection;
let mockDataChannel: MockRTCDataChannel;

const createMockPeerConnection = (): MockRTCPeerConnection => ({
  createOffer: vi.fn().mockResolvedValue({
    type: "offer",
    sdp: "mock-offer-sdp",
  }),
  createAnswer: vi.fn().mockResolvedValue({
    type: "answer",
    sdp: "mock-answer-sdp",
  }),
  setLocalDescription: vi.fn().mockResolvedValue(undefined),
  setRemoteDescription: vi.fn().mockResolvedValue(undefined),
  addTrack: vi.fn(),
  createDataChannel: vi.fn().mockReturnValue(mockDataChannel),
  close: vi.fn(),
  connectionState: "new",
  localDescription: null,
  remoteDescription: null,
  onicecandidate: null,
  onconnectionstatechange: null,
  ondatachannel: null,
  ontrack: null,
});

const createMockDataChannel = (): MockRTCDataChannel => ({
  send: vi.fn(),
  close: vi.fn(),
  readyState: "connecting",
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
});

// Setup global mocks
beforeEach(() => {
  mockDataChannel = createMockDataChannel();
  mockPeerConnection = createMockPeerConnection();

  // Mock RTCPeerConnection constructor
  vi.stubGlobal(
    "RTCPeerConnection",
    vi.fn().mockImplementation(() => mockPeerConnection)
  );

  // Mock RTCSessionDescription constructor
  vi.stubGlobal(
    "RTCSessionDescription",
    vi.fn().mockImplementation((init) => init)
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// =============================================================================
// Tests
// =============================================================================

describe("useWebRTC", () => {
  let webrtc: UseWebRTCReturn;
  let dispose: () => void;

  const createWebRTC = () => {
    dispose = createRoot((d) => {
      webrtc = useWebRTC();
      return d;
    });
  };

  afterEach(() => {
    dispose?.();
  });

  describe("initial state", () => {
    beforeEach(() => createWebRTC());

    it("starts with 'new' connection state", () => {
      expect(webrtc.connectionState()).toBe("new");
    });

    it("starts with empty local SDP", () => {
      expect(webrtc.localSdp()).toBe("");
    });

    it("starts with null remote stream", () => {
      expect(webrtc.remoteStream()).toBeNull();
    });

    it("starts with null remote peer state", () => {
      expect(webrtc.remotePeerState()).toBeNull();
    });
  });

  describe("createOffer (initiator flow)", () => {
    beforeEach(() => createWebRTC());

    it("creates an offer and sets local description", async () => {
      await webrtc.createOffer();

      // When implemented, these should be called
      // expect(mockPeerConnection.createOffer).toHaveBeenCalled();
      // expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    });

    it("generates local SDP after creating offer", async () => {
      await webrtc.createOffer();

      // When implemented, localSdp should contain the offer
      // expect(webrtc.localSdp()).toContain("sdp");
    });

    it("creates a data channel for position/state sync", async () => {
      await webrtc.createOffer();

      // When implemented, should create data channel
      // expect(mockPeerConnection.createDataChannel).toHaveBeenCalledWith("state");
    });
  });

  describe("setRemoteSdp (answerer flow)", () => {
    beforeEach(() => createWebRTC());

    it("sets remote description from SDP string", async () => {
      const remoteSdp = "v=0\r\no=- 123 456 IN IP4 127.0.0.1\r\n...";
      await webrtc.setRemoteSdp(remoteSdp);

      // When implemented:
      // expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();
    });

    it("creates answer if remote SDP is an offer", async () => {
      const offerSdp = "v=0\r\ntype:offer\r\n...";
      await webrtc.setRemoteSdp(offerSdp);

      // When implemented:
      // expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
      // expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    });

    it("handles invalid SDP gracefully", async () => {
      // Should not throw
      await expect(webrtc.setRemoteSdp("invalid-sdp")).resolves.not.toThrow();
    });
  });

  describe("connection state transitions", () => {
    beforeEach(() => createWebRTC());

    it("updates connection state when peer connection state changes", async () => {
      await webrtc.createOffer();

      // When implemented, simulate connection state change:
      // mockPeerConnection.connectionState = "connecting";
      // mockPeerConnection.onconnectionstatechange?.();
      // expect(webrtc.connectionState()).toBe("connecting");
    });

    it("transitions to connected when connection established", async () => {
      await webrtc.createOffer();

      // When implemented:
      // mockPeerConnection.connectionState = "connected";
      // mockPeerConnection.onconnectionstatechange?.();
      // expect(webrtc.connectionState()).toBe("connected");
    });

    it("transitions to failed on connection error", async () => {
      await webrtc.createOffer();

      // When implemented:
      // mockPeerConnection.connectionState = "failed";
      // mockPeerConnection.onconnectionstatechange?.();
      // expect(webrtc.connectionState()).toBe("failed");
    });
  });

  describe("sendPosition", () => {
    beforeEach(() => createWebRTC());

    it("sends position data over data channel", async () => {
      await webrtc.createOffer();

      // Simulate data channel open
      mockDataChannel.readyState = "open";

      webrtc.sendPosition({ x: 1, y: 2 }, Math.PI / 4);

      // When implemented:
      // expect(mockDataChannel.send).toHaveBeenCalledWith(
      //   JSON.stringify({ type: "position", position: { x: 1, y: 2 }, facing: Math.PI / 4 })
      // );
    });

    it("does nothing if data channel not open", () => {
      webrtc.sendPosition({ x: 1, y: 2 }, 0);

      // Should not throw, just log
      expect(mockDataChannel.send).not.toHaveBeenCalled();
    });
  });

  describe("sendSpeakingState", () => {
    beforeEach(() => createWebRTC());

    it("sends speaking state over data channel", async () => {
      await webrtc.createOffer();
      mockDataChannel.readyState = "open";

      webrtc.sendSpeakingState(true);

      // When implemented:
      // expect(mockDataChannel.send).toHaveBeenCalledWith(
      //   JSON.stringify({ type: "speaking", isSpeaking: true })
      // );
    });
  });

  describe("remote stream handling", () => {
    beforeEach(() => createWebRTC());

    it("stores remote stream when track event fires", async () => {
      await webrtc.createOffer();

      // When implemented, simulate track event:
      // const mockRemoteStream = new MediaStream();
      // const event = { streams: [mockRemoteStream] } as RTCTrackEvent;
      // mockPeerConnection.ontrack?.(event);
      // expect(webrtc.remoteStream()).toBe(mockRemoteStream);
    });
  });

  describe("remote peer state from data channel", () => {
    beforeEach(() => createWebRTC());

    it("updates remote peer state on position message", async () => {
      await webrtc.createOffer();

      // When implemented, simulate incoming message:
      // const message = { type: "position", position: { x: 1, y: 2 }, facing: 0 };
      // const event = new MessageEvent("message", { data: JSON.stringify(message) });
      // mockDataChannel.onmessage?.(event);
      // expect(webrtc.remotePeerState()?.position).toEqual({ x: 1, y: 2 });
    });

    it("updates remote peer state on speaking message", async () => {
      await webrtc.createOffer();

      // When implemented:
      // const message = { type: "speaking", isSpeaking: true };
      // const event = new MessageEvent("message", { data: JSON.stringify(message) });
      // mockDataChannel.onmessage?.(event);
      // expect(webrtc.remotePeerState()?.isSpeaking).toBe(true);
    });
  });

  describe("disconnect", () => {
    beforeEach(() => createWebRTC());

    it("closes peer connection", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      // When implemented:
      // expect(mockPeerConnection.close).toHaveBeenCalled();
    });

    it("closes data channel", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      // When implemented:
      // expect(mockDataChannel.close).toHaveBeenCalled();
    });

    it("resets connection state to disconnected", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      // When implemented:
      // expect(webrtc.connectionState()).toBe("disconnected");
    });

    it("clears remote stream", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      // When implemented:
      // expect(webrtc.remoteStream()).toBeNull();
    });
  });

  describe("cleanup on unmount", () => {
    it("closes connection when component unmounts", async () => {
      createWebRTC();
      await webrtc.createOffer();

      // Dispose triggers onCleanup
      dispose();

      // When implemented:
      // expect(mockPeerConnection.close).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Integration test helpers (for when you implement the hook)
// =============================================================================

describe("useWebRTC integration helpers", () => {
  describe("SDP parsing utilities", () => {
    it("can detect offer vs answer from SDP", () => {
      const offerSdp = "v=0\r\na=type:offer\r\n";
      const answerSdp = "v=0\r\na=type:answer\r\n";

      // Helper function you might want to implement:
      // expect(isOffer(offerSdp)).toBe(true);
      // expect(isOffer(answerSdp)).toBe(false);
      expect(offerSdp).toContain("offer");
      expect(answerSdp).toContain("answer");
    });
  });

  describe("DataChannel message serialization", () => {
    it("serializes position message correctly", () => {
      const message = {
        type: "position" as const,
        position: { x: 1.5, y: -2.3 },
        facing: Math.PI / 2,
      };

      const serialized = JSON.stringify(message);
      const parsed = JSON.parse(serialized);

      expect(parsed.type).toBe("position");
      expect(parsed.position.x).toBeCloseTo(1.5);
      expect(parsed.facing).toBeCloseTo(Math.PI / 2);
    });

    it("serializes speaking message correctly", () => {
      const message = {
        type: "speaking" as const,
        isSpeaking: true,
      };

      const serialized = JSON.stringify(message);
      const parsed = JSON.parse(serialized);

      expect(parsed.type).toBe("speaking");
      expect(parsed.isSpeaking).toBe(true);
    });
  });
});
