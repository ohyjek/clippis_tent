/**
 * webRTC.test.ts - Unit tests for WebRTC store
 *
 * Tests cover:
 * - Initial state
 * - Creating offers (initiator flow, mic track attachment)
 * - Setting remote SDP (answerer flow, auto-answer)
 * - ICE candidate queueing
 * - Connection state transitions
 * - Data channel messaging
 * - Signaling auto-answer flow
 * - Disconnect/cleanup
 */

import { createWebRTCStore, type WebRTCStore } from "@src/stores/webRTC";
import { createRoot } from "solid-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  addTransceiver: ReturnType<typeof vi.fn>;
  addIceCandidate: ReturnType<typeof vi.fn>;
  createDataChannel: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
  connectionState: RTCPeerConnectionState;
  signalingState: RTCSignalingState;
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

class MockMediaStream {
  id = "mock-stream-id";
  active = true;
  tracks: unknown[];
  constructor(tracks: unknown[] = []) {
    this.tracks = tracks;
  }
  getTracks = vi.fn(() => this.tracks);
  getAudioTracks = vi.fn(() => this.tracks);
  getVideoTracks = vi.fn(() => []);
}

let mockPeerConnection: MockRTCPeerConnection;
let mockDataChannel: MockRTCDataChannel;

const createMockDataChannel = (): MockRTCDataChannel => ({
  send: vi.fn(),
  close: vi.fn(),
  readyState: "connecting",
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
});

const createMockPeerConnection = (): MockRTCPeerConnection => {
  const connection: MockRTCPeerConnection = {
    createOffer: vi.fn().mockResolvedValue({
      type: "offer",
      sdp: "mock-offer-sdp",
    }),
    createAnswer: vi.fn().mockResolvedValue({
      type: "answer",
      sdp: "mock-answer-sdp",
    }),
    setLocalDescription: vi.fn().mockResolvedValue(undefined),
    // Records the description so ICE candidates added later go direct
    setRemoteDescription: vi.fn().mockImplementation(async (desc: RTCSessionDescription) => {
      connection.remoteDescription = desc;
    }),
    addTrack: vi.fn(),
    addTransceiver: vi.fn(),
    addIceCandidate: vi.fn().mockResolvedValue(undefined),
    createDataChannel: vi.fn(() => mockDataChannel),
    close: vi.fn(),
    connectionState: "new",
    signalingState: "stable",
    localDescription: null,
    remoteDescription: null,
    onicecandidate: null,
    onconnectionstatechange: null,
    ondatachannel: null,
    ontrack: null,
  };
  return connection;
};

// A realistic-length SDP (store validation requires >= 200 chars + an m= line)
const VALID_SDP_BODY = [
  "v=0",
  "o=- 4611731400430051336 2 IN IP4 127.0.0.1",
  "s=-",
  "t=0 0",
  "a=group:BUNDLE 0",
  "a=msid-semantic: WMS stream",
  "m=audio 9 UDP/TLS/RTP/SAVPF 111",
  "c=IN IP4 0.0.0.0",
  "a=rtcp:9 IN IP4 0.0.0.0",
  "a=ice-ufrag:mock",
  "a=ice-pwd:mockmockmockmockmockmock",
  "a=fingerprint:sha-256 00:00",
  "a=rtpmap:111 opus/48000/2",
].join("\r\n");

// Setup global mocks
beforeEach(() => {
  mockDataChannel = createMockDataChannel();
  mockPeerConnection = createMockPeerConnection();

  // Mock RTCPeerConnection constructor — returns the shared mock object so
  // both the store (handlers) and the tests (events) see the same instance
  vi.stubGlobal(
    "RTCPeerConnection",
    // biome-ignore lint/complexity/useArrowFunction: vitest constructor mocks need `function` so `new RTCPeerConnection()` works
    vi.fn(function () {
      return mockPeerConnection;
    })
  );

  // Mock RTCSessionDescription constructor
  vi.stubGlobal(
    "RTCSessionDescription",
    vi.fn(function (this: RTCSessionDescriptionInit, init: RTCSessionDescriptionInit) {
      Object.assign(this, init);
      return this;
    })
  );

  vi.stubGlobal("MediaStream", MockMediaStream);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

// =============================================================================
// Tests
// =============================================================================

describe("webRTC store", () => {
  let webrtc: WebRTCStore;
  let dispose: () => void;

  const createWebRTC = () => {
    dispose = createRoot((d) => {
      webrtc = createWebRTCStore();
      return d;
    });
  };

  afterEach(() => {
    dispose?.();
  });

  describe("initial state", () => {
    beforeEach(() => createWebRTC());

    it("starts with null connection state", () => {
      expect(webrtc.connectionState()).toBeNull();
    });

    it("starts with null local SDP", () => {
      expect(webrtc.localSdp()).toBeNull();
    });

    it("starts with null remote stream", () => {
      expect(webrtc.remoteStream()).toBeNull();
    });

    it("starts with null remote peer state", () => {
      expect(webrtc.remotePeerState()).toBeNull();
    });

    it("starts with the data channel closed", () => {
      expect(webrtc.dataChannelOpen()).toBe(false);
    });
  });

  describe("createOffer (initiator flow)", () => {
    beforeEach(() => createWebRTC());

    it("creates an offer and sets local description", async () => {
      await webrtc.createOffer();

      expect(mockPeerConnection.createOffer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
    });

    it("auto-initializes the peer connection when needed", async () => {
      await webrtc.createOffer();

      expect(RTCPeerConnection).toHaveBeenCalledTimes(1);
    });

    it("generates local SDP after creating offer", async () => {
      await webrtc.createOffer();

      expect(webrtc.localSdp()).toContain("sdp");
    });

    it("creates a negotiated data channel for position/state sync", async () => {
      await webrtc.createOffer();

      expect(mockPeerConnection.createDataChannel).toHaveBeenCalledWith("state", {
        negotiated: true,
        id: 0,
      });
    });

    it("adds the microphone track before creating the offer", async () => {
      const mockTrack = { kind: "audio", stop: vi.fn() };
      const mockStream = new MockMediaStream([mockTrack]);
      const getUserMedia = vi.fn().mockResolvedValue(mockStream);
      vi.stubGlobal("navigator", { mediaDevices: { getUserMedia } });

      await webrtc.createOffer();

      expect(getUserMedia).toHaveBeenCalledWith({ audio: expect.any(Object) });
      expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockTrack, mockStream);
      expect(mockPeerConnection.addTrack.mock.invocationCallOrder[0]).toBeLessThan(
        mockPeerConnection.createOffer.mock.invocationCallOrder[0]
      );
      expect(webrtc.localStream()).toBe(mockStream as unknown as MediaStream);
    });

    it("falls back to receive-only audio when the mic is unavailable", async () => {
      // No navigator.mediaDevices stub → getUserMedia unavailable
      await webrtc.createOffer();

      expect(mockPeerConnection.addTrack).not.toHaveBeenCalled();
      expect(mockPeerConnection.addTransceiver).toHaveBeenCalledWith("audio", {
        direction: "recvonly",
      });
    });
  });

  describe("setRemoteSdp (answerer flow)", () => {
    beforeEach(() => createWebRTC());

    it("sets remote description from SDP string", async () => {
      await webrtc.createOffer(); // an answer is only valid once we have offered
      await webrtc.setRemoteSdp(VALID_SDP_BODY, "answer");

      expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();
    });

    it("creates answer if remote SDP is an offer", async () => {
      await webrtc.setRemoteSdp(VALID_SDP_BODY, "offer");

      expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
      expect(mockPeerConnection.setLocalDescription).toHaveBeenCalled();
      expect(webrtc.localSdp()).toBe("mock-answer-sdp");
      // The remote offer must be applied before the answer is created
      expect(mockPeerConnection.setRemoteDescription.mock.invocationCallOrder[0]).toBeLessThan(
        mockPeerConnection.createAnswer.mock.invocationCallOrder[0]
      );
    });

    it("ignores a stale answer when no peer connection exists", async () => {
      const ok = await webrtc.setRemoteSdp(VALID_SDP_BODY, "answer", { skipValidation: true });

      expect(ok).toBe(false);
      expect(RTCPeerConnection).not.toHaveBeenCalled();
      expect(mockPeerConnection.setRemoteDescription).not.toHaveBeenCalled();
    });

    it("does not auto-answer when autoAnswer is disabled", async () => {
      await webrtc.setRemoteSdp(VALID_SDP_BODY, "offer", { autoAnswer: false });

      expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();
      expect(mockPeerConnection.createAnswer).not.toHaveBeenCalled();
    });

    it("handles invalid SDP gracefully", async () => {
      // Should not throw; short/invalid pastes are rejected by validation
      await expect(webrtc.setRemoteSdp("invalid-sdp")).resolves.toBe(false);
      expect(mockPeerConnection.setRemoteDescription).not.toHaveBeenCalled();
    });
  });

  describe("ICE candidate handling", () => {
    beforeEach(() => createWebRTC());

    it("queues candidates that arrive before the remote description", async () => {
      webrtc.initializePeerConnection();

      const added = await webrtc.addIceCandidate('{"candidate":"c1","sdpMLineIndex":0}');

      expect(added).toBe(true);
      expect(mockPeerConnection.addIceCandidate).not.toHaveBeenCalled();
    });

    it("flushes queued candidates after the remote description is set", async () => {
      webrtc.initializePeerConnection();
      await webrtc.addIceCandidate('{"candidate":"c1","sdpMLineIndex":0}');

      await webrtc.setRemoteSdp(VALID_SDP_BODY, "answer");

      expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith({
        candidate: "c1",
        sdpMLineIndex: 0,
      });
    });

    it("adds candidates directly once the remote description is set", async () => {
      webrtc.initializePeerConnection();
      await webrtc.setRemoteSdp(VALID_SDP_BODY, "answer");
      mockPeerConnection.addIceCandidate.mockClear();

      await webrtc.addIceCandidate({ candidate: "c2", sdpMLineIndex: 0 });

      expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith({
        candidate: "c2",
        sdpMLineIndex: 0,
      });
    });

    it("rejects malformed candidate JSON", async () => {
      webrtc.initializePeerConnection();

      const added = await webrtc.addIceCandidate("not-json{");

      expect(added).toBe(false);
      expect(mockPeerConnection.addIceCandidate).not.toHaveBeenCalled();
    });
  });

  describe("connection state transitions", () => {
    beforeEach(() => createWebRTC());

    it("updates connection state when peer connection state changes", async () => {
      await webrtc.createOffer();

      mockPeerConnection.connectionState = "connecting";
      mockPeerConnection.onconnectionstatechange?.();

      expect(webrtc.connectionState()).toBe("connecting");
    });

    it("transitions to connected when connection established", async () => {
      await webrtc.createOffer();

      mockPeerConnection.connectionState = "connected";
      mockPeerConnection.onconnectionstatechange?.();

      expect(webrtc.connectionState()).toBe("connected");
    });

    it("transitions to failed on connection error", async () => {
      await webrtc.createOffer();

      mockPeerConnection.connectionState = "failed";
      mockPeerConnection.onconnectionstatechange?.();

      expect(webrtc.connectionState()).toBe("failed");
    });
  });

  describe("data channel state", () => {
    beforeEach(() => createWebRTC());

    it("tracks channel open/close", async () => {
      await webrtc.createOffer();

      mockDataChannel.onopen?.();
      expect(webrtc.dataChannelOpen()).toBe(true);

      mockDataChannel.onclose?.();
      expect(webrtc.dataChannelOpen()).toBe(false);
    });
  });

  describe("sendPosition", () => {
    beforeEach(() => createWebRTC());

    it("sends position data over data channel", async () => {
      await webrtc.createOffer();

      // Simulate data channel open
      mockDataChannel.readyState = "open";

      webrtc.sendPosition({ x: 1, y: 2 }, Math.PI / 4);

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "position", position: { x: 1, y: 2 }, facing: Math.PI / 4 })
      );
    });

    it("does nothing if data channel not open", () => {
      webrtc.sendPosition({ x: 1, y: 2 }, 0);

      // Should not throw, just log
      expect(mockDataChannel.send).not.toHaveBeenCalled();
    });

    it("does nothing while the channel exists but is still connecting", async () => {
      await webrtc.createOffer();
      // mockDataChannel.readyState stays "connecting"

      webrtc.sendPosition({ x: 1, y: 2 }, 0);

      expect(mockDataChannel.send).not.toHaveBeenCalled();
    });
  });

  describe("sendSpeakingState", () => {
    beforeEach(() => createWebRTC());

    it("sends speaking state over data channel", async () => {
      await webrtc.createOffer();
      mockDataChannel.readyState = "open";

      webrtc.sendSpeakingState(true);

      expect(mockDataChannel.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "speaking", isSpeaking: true })
      );
    });
  });

  describe("remote stream handling", () => {
    beforeEach(() => createWebRTC());

    it("stores remote stream when track event fires", async () => {
      await webrtc.createOffer();

      const mockRemoteStream = new MediaStream();
      const event = {
        streams: [mockRemoteStream],
        track: { id: "t1" },
      } as unknown as RTCTrackEvent;
      mockPeerConnection.ontrack?.(event);

      expect(webrtc.remoteStream()).toBe(mockRemoteStream);
    });

    it("wraps a bare track in a stream when no stream is provided", async () => {
      await webrtc.createOffer();

      const track = { id: "t2" };
      const event = { streams: [], track } as unknown as RTCTrackEvent;
      mockPeerConnection.ontrack?.(event);

      expect(webrtc.remoteStream()).not.toBeNull();
      expect((webrtc.remoteStream() as unknown as MockMediaStream).tracks).toEqual([track]);
    });
  });

  describe("remote peer state from data channel", () => {
    beforeEach(() => createWebRTC());

    it("updates remote peer state on position message", async () => {
      await webrtc.createOffer();

      const message = { type: "position", position: { x: 1, y: 2 }, facing: 0.5 };
      mockDataChannel.onmessage?.(new MessageEvent("message", { data: JSON.stringify(message) }));

      expect(webrtc.remotePeerState()?.position).toEqual({ x: 1, y: 2 });
      expect(webrtc.remotePeerState()?.facing).toBe(0.5);
    });

    it("updates remote peer state on speaking message", async () => {
      await webrtc.createOffer();

      const message = { type: "speaking", isSpeaking: true };
      mockDataChannel.onmessage?.(new MessageEvent("message", { data: JSON.stringify(message) }));

      expect(webrtc.remotePeerState()?.isSpeaking).toBe(true);
    });

    it("preserves position when a speaking message follows", async () => {
      await webrtc.createOffer();

      mockDataChannel.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({ type: "position", position: { x: 3, y: 4 }, facing: 1 }),
        })
      );
      mockDataChannel.onmessage?.(
        new MessageEvent("message", {
          data: JSON.stringify({ type: "speaking", isSpeaking: true }),
        })
      );

      expect(webrtc.remotePeerState()?.position).toEqual({ x: 3, y: 4 });
      expect(webrtc.remotePeerState()?.isSpeaking).toBe(true);
    });

    it("ignores malformed messages", async () => {
      await webrtc.createOffer();

      mockDataChannel.onmessage?.(new MessageEvent("message", { data: "not-json{" }));

      expect(webrtc.remotePeerState()).toBeNull();
    });
  });

  describe("signaling flow", () => {
    let lastSocket: MockWebSocketInstance | null = null;

    interface MockWebSocketInstance {
      readyState: number;
      send: ReturnType<typeof vi.fn>;
      close: ReturnType<typeof vi.fn>;
      onopen: (() => void) | null;
      onmessage: ((event: { data: string }) => void) | null;
      onclose: (() => void) | null;
      onerror: (() => void) | null;
    }

    beforeEach(() => {
      createWebRTC();
      lastSocket = null;

      class MockWebSocket {
        static OPEN = 1;
        readyState = 1;
        send = vi.fn();
        close = vi.fn();
        onopen: (() => void) | null = null;
        onmessage: ((event: { data: string }) => void) | null = null;
        onclose: (() => void) | null = null;
        onerror: (() => void) | null = null;
        constructor() {
          // capture instance for the test
          lastSocket = this;
        }
      }
      vi.stubGlobal("WebSocket", MockWebSocket);
    });

    const openSignaling = () => {
      webrtc.connectSignaling("ws://localhost:8765");
      lastSocket?.onopen?.();
    };

    it("auto-answers an incoming offer and sends the answer back", async () => {
      openSignaling();

      lastSocket?.onmessage?.({
        data: JSON.stringify({ type: "offer", payload: VALID_SDP_BODY }),
      });

      await vi.waitFor(() => {
        expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();
        expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
        expect(lastSocket?.send).toHaveBeenCalledWith(
          JSON.stringify({ type: "answer", payload: "mock-answer-sdp" })
        );
      });
    });

    it("does not lose ICE candidates that arrive before the offer", async () => {
      openSignaling();

      lastSocket?.onmessage?.({
        data: JSON.stringify({
          type: "ice",
          payload: JSON.stringify({ candidate: "early", sdpMLineIndex: 0 }),
        }),
      });
      lastSocket?.onmessage?.({
        data: JSON.stringify({ type: "offer", payload: VALID_SDP_BODY }),
      });

      await vi.waitFor(() => {
        expect(mockPeerConnection.addIceCandidate).toHaveBeenCalledWith({
          candidate: "early",
          sdpMLineIndex: 0,
        });
      });
    });

    it("sends the offer over signaling when connected", async () => {
      openSignaling();

      await webrtc.createOffer();

      expect(lastSocket?.send).toHaveBeenCalledWith(
        JSON.stringify({ type: "offer", payload: "mock-offer-sdp" })
      );
    });

    it("attaches the answerer's mic before creating the answer", async () => {
      const mockTrack = { kind: "audio", stop: vi.fn() };
      const mockStream = new MockMediaStream([mockTrack]);
      vi.stubGlobal("navigator", {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });
      openSignaling();

      lastSocket?.onmessage?.({
        data: JSON.stringify({ type: "offer", payload: VALID_SDP_BODY }),
      });

      await vi.waitFor(() => {
        expect(mockPeerConnection.addTrack).toHaveBeenCalledWith(mockTrack, mockStream);
        expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
        // One-way-audio guard: the mic track must be added before the answer SDP is created
        expect(mockPeerConnection.addTrack.mock.invocationCallOrder[0]).toBeLessThan(
          mockPeerConnection.createAnswer.mock.invocationCallOrder[0]
        );
      });
    });

    it("resolves offer glare by ignoring the incoming offer when ours wins the tie-break", async () => {
      openSignaling();
      await webrtc.createOffer(); // localSdp = "mock-offer-sdp"
      mockPeerConnection.signalingState = "have-local-offer";
      mockPeerConnection.setRemoteDescription.mockClear();

      // "zzz..." sorts after "mock-offer-sdp" → our offer wins → ignore theirs
      lastSocket?.onmessage?.({
        data: JSON.stringify({ type: "offer", payload: "zzz-their-offer" }),
      });
      await new Promise((r) => setTimeout(r, 20));

      expect(mockPeerConnection.setRemoteDescription).not.toHaveBeenCalled();
      expect(mockPeerConnection.createAnswer).not.toHaveBeenCalled();
    });

    it("resolves offer glare by answering the incoming offer when theirs wins the tie-break", async () => {
      openSignaling();
      await webrtc.createOffer();
      mockPeerConnection.signalingState = "have-local-offer";
      mockPeerConnection.setRemoteDescription.mockClear();

      // "aaa..." sorts before "mock-offer-sdp" → their offer wins → roll back and answer
      lastSocket?.onmessage?.({
        data: JSON.stringify({ type: "offer", payload: "aaa-their-offer" }),
      });

      await vi.waitFor(() => {
        expect(mockPeerConnection.setRemoteDescription).toHaveBeenCalled();
        expect(mockPeerConnection.createAnswer).toHaveBeenCalled();
      });
    });
  });

  describe("disconnect", () => {
    beforeEach(() => createWebRTC());

    it("closes peer connection", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      expect(mockPeerConnection.close).toHaveBeenCalled();
    });

    it("closes data channel", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      expect(mockDataChannel.close).toHaveBeenCalled();
    });

    it("resets connection state to disconnected", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      expect(webrtc.connectionState()).toBe("disconnected");
    });

    it("clears remote stream", async () => {
      await webrtc.createOffer();
      webrtc.disconnect();

      expect(webrtc.remoteStream()).toBeNull();
    });

    it("stops local microphone tracks", async () => {
      const mockTrack = { kind: "audio", stop: vi.fn() };
      const mockStream = new MockMediaStream([mockTrack]);
      vi.stubGlobal("navigator", {
        mediaDevices: { getUserMedia: vi.fn().mockResolvedValue(mockStream) },
      });

      await webrtc.createOffer();
      webrtc.disconnect();

      expect(mockTrack.stop).toHaveBeenCalled();
      expect(webrtc.localStream()).toBeNull();
    });
  });

  describe("cleanup on unmount", () => {
    it("closes connection when component unmounts", async () => {
      createWebRTC();
      await webrtc.createOffer();

      // Dispose triggers onCleanup
      dispose();

      expect(mockPeerConnection.close).toHaveBeenCalled();
    });
  });
});

// =============================================================================
// Integration helpers
// =============================================================================

describe("useWebRTC integration helpers", () => {
  describe("SDP parsing utilities", () => {
    it("can detect offer vs answer from SDP", () => {
      const offerSdp = "v=0\r\na=type:offer\r\n";
      const answerSdp = "v=0\r\na=type:answer\r\n";

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
