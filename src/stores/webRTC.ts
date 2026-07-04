import { logger } from "@lib/logger";
import { normalizeSdp, validatePastedSdp } from "@lib/sdp";
import { audioStore } from "@stores/audio";
import { showToast } from "@stores/toast";
import type { DataChannelMessage, Position, RemotePeerState } from "@tentchat/types";
import { createRoot, createSignal, onCleanup } from "solid-js";

const DEFAULT_ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

const DEFAULT_SIGNALING_URL = "ws://localhost:8765";

export interface SetRemoteSdpOptions {
  /** Skip the paste-sanity validation (used for trusted signaling payloads) */
  skipValidation?: boolean;
  /** Automatically create an answer when the SDP is an offer (default true) */
  autoAnswer?: boolean;
}

/**
 * @returns The webRTC store state.
 */
export function createWebRTCStore() {
  // ------------------------------------------------------------
  // Remote data
  // ------------------------------------------------------------
  const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(null);
  const [remotePeerState, setRemotePeerState] = createSignal<RemotePeerState | null>(null);
  // ------------------------------------------------------------
  // Connection State Signals
  // ------------------------------------------------------------
  const [connectionState, setConnectionState] = createSignal<RTCPeerConnectionState | null>(null);
  const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null);
  const [localSdp, setLocalSdp] = createSignal<string | null>(null); // Local SDP to copy
  const [localIceCandidates, setLocalIceCandidates] = createSignal<RTCIceCandidateInit[]>([]);
  const [localStream, setLocalStream] = createSignal<MediaStream | null>(null);
  const [dataChannel, setDataChannel] = createSignal<RTCDataChannel | null>(null);
  const [dataChannelOpen, setDataChannelOpen] = createSignal(false);
  const [signalingWs, setSignalingWs] = createSignal<WebSocket | null>(null);
  // Reactive mirror of the tracked socket's open state (readyState itself is
  // a plain mutable property, so reading it is not reactive).
  const [signalingOpen, setSignalingOpen] = createSignal(false);

  // Remote ICE candidates that arrived before the remote description was set.
  // Flushed after setRemoteDescription succeeds (candidates can't be added before it).
  let pendingRemoteCandidates: RTCIceCandidateInit[] = [];
  // Whether we already added the receive-only fallback transceiver (mic unavailable)
  let recvOnlyFallbackAdded = false;
  // Serializes signaling message handling so an ICE message can't be
  // processed while the offer that precedes it is still being applied.
  let signalingChain: Promise<void> = Promise.resolve();

  const sendSignaling = (type: "offer" | "answer" | "ice", payload: string) => {
    const ws = signalingWs();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  };

  const handleSignalingMessage = async (msg: { type: string; payload?: string }) => {
    if (!msg.type || msg.payload === undefined) return;
    if (msg.type === "offer") {
      // Glare (both peers clicked "Create offer"): deterministic tie-break —
      // both sides compare the same two SDPs, so exactly one ignores the
      // incoming offer and the other rolls back (implicit rollback on
      // setRemoteDescription) and answers.
      const connection = peerConnection();
      if (connection?.signalingState === "have-local-offer") {
        const ours = localSdp() ?? "";
        if (ours < msg.payload) {
          logger.warn("Offer glare: ignoring incoming offer (local offer wins tie-break)");
          return;
        }
        logger.warn("Offer glare: rolling back local offer and answering (tie-break lost)");
      }
      // Auto-answer: setRemoteSdp initializes the connection if needed, attaches
      // the mic before answering, and sends the answer back via signaling.
      await setRemoteSdp(msg.payload, "offer", { skipValidation: true });
    } else if (msg.type === "answer") {
      await setRemoteSdp(msg.payload, "answer", { skipValidation: true });
    } else if (msg.type === "ice") {
      await addIceCandidate(msg.payload);
    }
  };

  const connectSignaling = (url: string = DEFAULT_SIGNALING_URL) => {
    const existing = signalingWs();
    if (
      existing &&
      (existing.readyState === WebSocket.CONNECTING || existing.readyState === WebSocket.OPEN)
    ) {
      showToast({ type: "info", message: "Already connected to signaling" });
      return;
    }
    try {
      const ws = new WebSocket(url);
      // Track immediately so a second connect can't race in a duplicate socket
      // while this one is still CONNECTING (the server would relay our own
      // messages back through the untracked duplicate).
      setSignalingWs(ws);
      ws.onopen = () => {
        // Identity-guard everything (not just state): a stale socket's events
        // must neither flip signals nor toast at the user
        if (signalingWs() !== ws) return;
        setSignalingOpen(true);
        showToast({ type: "success", message: "Connected to signaling server" });
        logger.info("Signaling connected", url);
      };
      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; payload?: string };
          // Chain messages so they apply strictly in arrival order
          signalingChain = signalingChain
            .then(() => handleSignalingMessage(msg))
            .catch((err) => logger.error("Signaling message failed", err));
        } catch {
          // ignore non-JSON
        }
      };
      ws.onclose = () => {
        // A stale socket closing later must not null out the live one — or
        // show a spurious "disconnected" toast while the live socket is fine
        if (signalingWs() !== ws) return;
        setSignalingWs(null);
        setSignalingOpen(false);
        showToast({ type: "info", message: "Disconnected from signaling" });
      };
      ws.onerror = () => {
        showToast({ type: "error", message: "Signaling connection error" });
      };
    } catch (error) {
      logger.error("Failed to connect to signaling", error);
      showToast({ type: "error", message: "Failed to connect to signaling server" });
    }
  };

  const disconnectSignaling = () => {
    const ws = signalingWs();
    if (ws) {
      ws.close();
      setSignalingWs(null);
      setSignalingOpen(false);
    }
  };

  const signalingConnected = () => signalingOpen();

  // ------------------------------------------------------------
  // Local audio (microphone)
  // ------------------------------------------------------------
  /**
   * Acquire the microphone and add its track to the peer connection.
   * Must run before createOffer/createAnswer so the SDP includes the track.
   *
   * Falls back to a receive-only transceiver when the mic is unavailable,
   * so audio negotiation still succeeds and we can hear the other peer.
   *
   * @returns {Promise<boolean>} true if the mic track was added
   */
  let ensureLocalAudioInFlight: Promise<boolean> | null = null;
  const ensureLocalAudio = (): Promise<boolean> => {
    // Single-flight: concurrent offer/answer paths must not acquire the mic
    // twice and add duplicate tracks
    if (!ensureLocalAudioInFlight) {
      ensureLocalAudioInFlight = acquireLocalAudio().finally(() => {
        ensureLocalAudioInFlight = null;
      });
    }
    return ensureLocalAudioInFlight;
  };

  const acquireLocalAudio = async (): Promise<boolean> => {
    const connection = peerConnection();
    if (!connection) return false;
    if (localStream()) return true; // already added

    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("mediaDevices API unavailable");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: audioStore.microphoneConstraints(),
      });
      for (const track of stream.getAudioTracks()) {
        connection.addTrack(track, stream);
      }
      setLocalStream(stream);
      logger.info("Microphone track added to peer connection");
      return true;
    } catch (error) {
      logger.warn("Microphone unavailable, negotiating receive-only audio", error);
      if (!recvOnlyFallbackAdded) {
        // Guarantees the SDP has an audio m= line even without a local track
        connection.addTransceiver("audio", { direction: "recvonly" });
        recvOnlyFallbackAdded = true;
      }
      showToast({ type: "warning", message: "Microphone unavailable — receive-only mode" });
      return false;
    }
  };

  /** Stop and release the local microphone stream, if any. */
  const releaseLocalAudio = () => {
    const stream = localStream();
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setLocalStream(null);
    }
  };

  // ------------------------------------------------------------
  // DataChannel (position / speaking sync)
  // ------------------------------------------------------------
  const handleDataChannelMessage = (raw: string) => {
    try {
      const message = JSON.parse(raw) as DataChannelMessage;
      if (message.type === "position") {
        setRemotePeerState((prev) => ({
          peerId: prev?.peerId ?? "remote",
          position: message.position,
          facing: message.facing,
          isSpeaking: prev?.isSpeaking ?? false,
        }));
      } else if (message.type === "speaking") {
        setRemotePeerState((prev) => ({
          peerId: prev?.peerId ?? "remote",
          position: prev?.position ?? { x: 0, y: 0 },
          facing: prev?.facing ?? 0,
          isSpeaking: message.isSpeaking,
        }));
      }
    } catch (error) {
      logger.warn("Ignoring malformed DataChannel message", error);
    }
  };

  const sendDataChannelMessage = (message: DataChannelMessage): boolean => {
    const channel = dataChannel();
    if (channel?.readyState === "open") {
      channel.send(JSON.stringify(message));
      return true;
    }
    logger.debug("DataChannel not open, dropping message", message.type);
    return false;
  };

  const sendPosition = (position: Position, facing: number) =>
    sendDataChannelMessage({ type: "position", position, facing });

  const sendSpeakingState = (isSpeaking: boolean) =>
    sendDataChannelMessage({ type: "speaking", isSpeaking });

  // ------------------------------------------------------------
  // Peer Connection Initialization
  // ------------------------------------------------------------
  const createStateChannel = (connection: RTCPeerConnection) => {
    // Symmetric, pre-negotiated channel: both sides create id 0, no
    // ondatachannel handshake needed (see docs/multiplayer.plan.md).
    const channel = connection.createDataChannel("state", { negotiated: true, id: 0 });
    channel.onopen = () => {
      logger.info("DataChannel open");
      setDataChannelOpen(true);
    };
    channel.onclose = () => {
      logger.info("DataChannel closed");
      setDataChannelOpen(false);
    };
    channel.onerror = (event) => logger.warn("DataChannel error", event);
    channel.onmessage = (event: MessageEvent) => handleDataChannelMessage(event.data as string);
    setDataChannel(channel);
  };

  const attachConnectionHandlers = (connection: RTCPeerConnection) => {
    connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate) {
        const init: RTCIceCandidateInit = {
          candidate: event.candidate.candidate,
          sdpMid: event.candidate.sdpMid ?? undefined,
          sdpMLineIndex: event.candidate.sdpMLineIndex ?? undefined,
        };
        setLocalIceCandidates((prev) => [...prev, init]);
        sendSignaling("ice", JSON.stringify(init));
        logger.info("ICE candidate gathered", init);
      }
    };

    connection.onconnectionstatechange = () => {
      const state = connection.connectionState;
      logger.info("Connection state change:", state);
      setConnectionState(state);
      if (state === "connected") {
        showToast({ type: "success", message: "Peer connected" });
      } else if (state === "failed" || state === "disconnected") {
        showToast({ type: "error", message: `Peer connection ${state}` });
      }
    };

    connection.oniceconnectionstatechange = () => {
      logger.info("ICE connection state change:", connection.iceConnectionState);
    };

    connection.onicegatheringstatechange = () => {
      logger.info("ICE gathering state change:", connection.iceGatheringState);
    };

    connection.ontrack = (event: RTCTrackEvent) => {
      const stream = event.streams[0] ?? new MediaStream([event.track]);
      setRemoteStream(stream);
      logger.info("Remote track added", { trackId: event.track.id });
    };

    connection.onicecandidateerror = (event: RTCPeerConnectionIceErrorEvent) => {
      logger.warn(`ICE candidate error: ${event.errorCode}`);
    };

    connection.onnegotiationneeded = () => {
      logger.info("Negotiation needed");
    };
  };

  /**
   * Initialize the peer connection.
   * @returns {boolean} true if the peer connection was initialized
   * @returns {boolean} false if it was already initialized
   * @returns {boolean} false if it failed to initialize
   */
  const initializePeerConnection = () => {
    if (peerConnection()) {
      logger.debug("Peer connection already initialized");
      return false;
    }
    try {
      const connection = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS });
      setConnectionState(connection.connectionState);
      recvOnlyFallbackAdded = false;
      // NOTE: pendingRemoteCandidates deliberately survives init — candidates
      // can arrive over signaling before we create the connection.

      createStateChannel(connection);
      attachConnectionHandlers(connection);

      setPeerConnection(connection);
      logger.info("Peer connection initialized");
      return true;
    } catch (error) {
      logger.error("Failed to initialize peer connection: ", error);
      showToast({ type: "error", message: "Failed to initialize peer connection" });
      return false;
    }
  };

  // ------------------------------------------------------------
  // RTC Actions
  // ------------------------------------------------------------
  /**
   * Shared offer/answer flow: create the description, set it locally, expose
   * it via localSdp for the manual copy/paste flow, and send it over
   * signaling when connected.
   */
  const publishLocalDescription = async (kind: "offer" | "answer"): Promise<boolean> => {
    const label = kind === "offer" ? "Offer" : "Answer";
    const connection = peerConnection();
    if (!connection) {
      logger.error(`Failed to create ${kind}: no peer connection`);
      showToast({ type: "error", message: `Failed to create ${kind}: no peer connection` });
      return false;
    }
    try {
      const description =
        kind === "offer" ? await connection.createOffer() : await connection.createAnswer();
      await connection.setLocalDescription(description);
      setLocalSdp(description?.sdp ?? null);
      if (description?.sdp && signalingConnected()) {
        sendSignaling(kind, description.sdp);
        showToast({ type: "success", message: `${label} created and sent via signaling` });
      } else {
        showToast({ type: "success", message: `${label} created` });
      }
      logger.info(`${label} created`);
      return true;
    } catch (error) {
      logger.error(`Failed to create ${kind}: `, error);
      showToast({ type: "error", message: `Failed to create ${kind}` });
      return false;
    }
  };

  /**
   * Create an offer (auto-initializes the connection and mic if needed).
   * @returns {boolean} true if the offer was created successfully
   * @returns {boolean} false if it failed to create an offer
   */
  const createOffer = async () => {
    if (!peerConnection()) initializePeerConnection();
    // Track must be attached before createOffer so the SDP includes it
    await ensureLocalAudio();
    return publishLocalDescription("offer");
  };

  /**
   * Create an answer after setting the remote offer. Exposes answer SDP via
   * localSdp for the manual flow and sends it via signaling when connected.
   */
  const createAnswer = () => publishLocalDescription("answer");

  /**
   * Add a remote ICE candidate (from signaling or pasted from the other peer).
   * Accepts RTCIceCandidateInit or JSON string. Candidates that arrive before
   * the remote description is set are queued and flushed afterwards.
   */
  const addIceCandidate = async (candidate: RTCIceCandidateInit | string): Promise<boolean> => {
    let init: RTCIceCandidateInit;
    try {
      init =
        typeof candidate === "string" ? (JSON.parse(candidate) as RTCIceCandidateInit) : candidate;
    } catch (error) {
      logger.error("Failed to parse ICE candidate: ", error);
      showToast({ type: "error", message: "Failed to parse ICE candidate" });
      return false;
    }

    const currentPeerConnection = peerConnection();
    if (!currentPeerConnection?.remoteDescription) {
      // Too early — hold on to it until the remote description lands
      pendingRemoteCandidates.push(init);
      logger.debug("Queued early ICE candidate", { queued: pendingRemoteCandidates.length });
      return true;
    }

    try {
      await currentPeerConnection.addIceCandidate(init);
      logger.info("Remote ICE candidate added");
      return true;
    } catch (error) {
      logger.error("Failed to add ICE candidate: ", error);
      return false;
    }
  };

  /** Apply any ICE candidates that arrived before the remote description. */
  const flushPendingCandidates = async (connection: RTCPeerConnection) => {
    const queued = pendingRemoteCandidates;
    pendingRemoteCandidates = [];
    for (const candidate of queued) {
      try {
        await connection.addIceCandidate(candidate);
        logger.info("Queued ICE candidate added");
      } catch (error) {
        logger.error("Failed to add queued ICE candidate: ", error);
      }
    }
  };

  /**
   * Set the remote SDP (offer or answer). When the SDP is an offer, an answer
   * is created automatically (paste-offer flow / signaling auto-answer).
   * @param sdp - The remote SDP to set.
   * @param type - Whether the remote SDP is an "offer" or an "answer".
   * @returns {Promise<boolean>} true if set successfully
   */
  const setRemoteSdp = async (
    sdp: string,
    type: "offer" | "answer",
    options: SetRemoteSdpOptions = {}
  ) => {
    if (!options.skipValidation) {
      const validationError = validatePastedSdp(sdp);
      if (validationError) {
        showToast({ type: "error", message: validationError });
        return false;
      }
    }

    if (!peerConnection()) {
      if (type === "answer") {
        // An answer with no connection is stale (e.g. arrived after disconnect) —
        // creating a fresh connection for it would just make a ghost.
        logger.warn("Ignoring stale answer: no peer connection");
        return false;
      }
      initializePeerConnection();
    }
    const currentPeerConnection = peerConnection();
    if (!currentPeerConnection) {
      logger.error("Failed to set remote SDP: no peer connection");
      showToast({ type: "error", message: "Failed to set remote SDP: no peer connection" });
      return false;
    }

    try {
      await currentPeerConnection.setRemoteDescription(
        new RTCSessionDescription({ type, sdp: normalizeSdp(sdp) })
      );
      logger.info("Remote SDP set", { type });
      showToast({ type: "success", message: `Remote SDP (${type}) set` });

      await flushPendingCandidates(currentPeerConnection);

      if (type === "offer" && options.autoAnswer !== false) {
        // Answer needs our mic attached first so the SDP includes the track
        await ensureLocalAudio();
        await createAnswer();
      }
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error("Failed to set remote SDP: ", error);
      showToast({ type: "error", message: `Set remote SDP failed: ${message}` });
      return false;
    }
  };

  /**
   * Disconnect the peer connection.
   * @returns {boolean} true if the peer connection was disconnected
   * @returns {boolean} false if it failed to disconnect
   */
  const disconnect = () => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      // 1. Close channel and connection (fires synchronous state change events)
      const channel = dataChannel();
      if (channel) {
        channel.onopen = null;
        channel.onclose = null;
        channel.onmessage = null;
        channel.onerror = null;
        channel.close();
      }
      currentPeerConnection.close();

      // 2. Remove all event handlers (close() has already fired its events)
      currentPeerConnection.onconnectionstatechange = null;
      currentPeerConnection.oniceconnectionstatechange = null;
      currentPeerConnection.onicegatheringstatechange = null;
      currentPeerConnection.ontrack = null;
      currentPeerConnection.onicecandidate = null;
      currentPeerConnection.onicecandidateerror = null;
      currentPeerConnection.onnegotiationneeded = null;

      // 3. Release the mic and clear signals
      releaseLocalAudio();
      pendingRemoteCandidates = [];
      recvOnlyFallbackAdded = false;
      setDataChannel(null);
      setDataChannelOpen(false);
      setPeerConnection(null);
      setLocalSdp(null);
      setLocalIceCandidates([]);
      setRemoteStream(null);
      setRemotePeerState(null);
      setConnectionState("disconnected");

      logger.info("Peer connection disconnected and cleaned up");
      showToast({ type: "success", message: "Peer connection successfully disconnected" });
      return true;
    } else {
      logger.error("Failed to disconnect: no peer connection");
      showToast({ type: "error", message: "Failed to disconnect" });
      return false;
    }
  };

  // Cleanup when the owning root is disposed (no-op for the app-level singleton)
  onCleanup(() => {
    if (peerConnection()) disconnect();
    disconnectSignaling();
  });

  return {
    initializePeerConnection,
    peerConnection,
    connectionState,
    localSdp,
    localIceCandidates,
    localStream,
    createOffer,
    createAnswer,
    setRemoteSdp,
    addIceCandidate,
    disconnect,
    connectSignaling,
    disconnectSignaling,
    signalingConnected,
    remoteStream,
    remotePeerState,
    dataChannelOpen,
    sendPosition,
    sendSpeakingState,
  };
}

// Create a singleton store for the webRTC hook
export const webRTCStore = createRoot(createWebRTCStore);
// Export the type of the webRTC store for convenience
export type WebRTCStore = ReturnType<typeof createWebRTCStore>;

// Expose for the in-app debugger and e2e verification (dev builds only)
if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as unknown as Record<string, unknown>).__webRTCStore = webRTCStore;
}
