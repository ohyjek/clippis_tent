import { createRoot, createSignal } from "solid-js";
import type { RemotePeerState, Position } from "@clippis/types";
import { logger } from "@lib/logger";
import { showToast } from "@stores/toast";

const DEFAULT_ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

const DEFAULT_SIGNALING_URL = "ws://localhost:8765";

/** Heuristic: treat as offer if SDP contains "offer", else answer. Prefer passing type explicitly from UI. */
function getSdpType(sdp: string): "offer" | "answer" {
  return sdp.trim().toLowerCase().includes("offer") ? "offer" : "answer";
}

/** Normalize SDP so setRemoteDescription parses correctly: CRLF line endings, trim each line (fixes "Invalid SDP line" from clipboard cruft), fix merged lines. */
function normalizeSdp(sdp: string): string {
  // Strip control chars and null bytes that can come from clipboard
  // eslint-disable-next-line no-control-regex -- intentional: strip control characters from pasted SDP
  let out = sdp.replace(/\0/g, "").replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  out = out.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  // If paste merged lines (e.g. "a=msid-semantic: WMS m=audio ..."), split before " m=" so parser sees m= line
  out = out.replace(/\s+(m=)/g, "\n$1");
  // Trim each line; drop telephone-event rtpmap lines (Chromium parser rejects them; optional for DTMF)
  out = out
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => !/^a=rtpmap:\d+ telephone-event\//.test(line))
    .join("\r\n");
  return out;
}

/**
 *
 * @returns {WebRTCStoreState} The webRTC store state.
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
  const [signalingWs, setSignalingWs] = createSignal<WebSocket | null>(null);

  const sendSignaling = (type: "offer" | "answer" | "ice", payload: string) => {
    const ws = signalingWs();
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }));
    }
  };

  const handleSignalingMessage = async (msg: { type: string; payload?: string }) => {
    if (!msg.type || msg.payload === undefined) return;
    if (msg.type === "offer") {
      const ok = await setRemoteSdp(msg.payload, "offer", true);
      if (ok) {
        await createAnswer();
        const answerSdp = localSdp();
        if (answerSdp) sendSignaling("answer", answerSdp);
      }
    } else if (msg.type === "answer") {
      await setRemoteSdp(msg.payload, "answer", true);
    } else if (msg.type === "ice") {
      await addIceCandidate(msg.payload);
    }
  };

  const connectSignaling = (url: string = DEFAULT_SIGNALING_URL) => {
    if (signalingWs()?.readyState === WebSocket.OPEN) {
      showToast({ type: "info", message: "Already connected to signaling" });
      return;
    }
    try {
      const ws = new WebSocket(url);
      ws.onopen = () => {
        setSignalingWs(ws);
        showToast({ type: "success", message: "Connected to signaling server" });
        logger.info("Signaling connected", url);
      };
      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg = JSON.parse(event.data as string) as { type: string; payload?: string };
          handleSignalingMessage(msg);
        } catch {
          // ignore
        }
      };
      ws.onclose = () => {
        setSignalingWs(null);
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
    }
  };

  const signalingConnected = () => signalingWs()?.readyState === WebSocket.OPEN;

  // ------------------------------------------------------------
  // Peer Connection Initialization
  // ------------------------------------------------------------
  /**
   * Initialize the peer connection.
   * @returns {boolean} true if the peer connection was initialized`
   * @returns {boolean} false if it was already initialized
   * @returns {boolean} false if it failed to initialize
   */
  const initializePeerConnection = () => {
    if (!peerConnection()) {
      try {
        const connection = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS });
        setConnectionState(connection.connectionState);

        // Ensure offer/answer SDP includes an m= line (required for setRemoteDescription to succeed)
        connection.addTransceiver("audio", { direction: "recvonly" });

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
          showToast({
            type: "info",
            message: "Connection state change:" + connection.connectionState,
          });
          logger.info("Connection state change:", connection.connectionState);
          setConnectionState(connection.connectionState);
        };

        connection.oniceconnectionstatechange = () => {
          // TODO: Implement ICE connection state change
          showToast({
            type: "info",
            message: "ICE connection state change:" + connection.iceConnectionState,
          });
          logger.info("ICE connection state change:", connection.iceConnectionState);
        };

        connection.onicegatheringstatechange = () => {
          // TODO: Implement ICE gathering state change
          showToast({
            type: "info",
            message: "ICE gathering state change:" + connection.iceGatheringState,
          });
          logger.info("ICE gathering state change:", connection.iceGatheringState);
        };

        connection.ontrack = (event: RTCTrackEvent) => {
          const stream = event.streams[0] ?? null;
          if (stream) setRemoteStream(stream);
          showToast({ type: "info", message: `Track added: ${event.track.id}` });
          logger.info("Track added", { trackId: event.track.id });
        };

        connection.onicecandidateerror = (event: RTCPeerConnectionIceErrorEvent) => {
          // TODO: Implement ICE candidate error
          showToast({
            type: "info",
            message: `ICE candidate error: ${event.errorCode}`,
          });
          logger.info(`ICE candidate error: ${event.errorCode}`);
        };

        connection.onnegotiationneeded = () => {
          // TODO: Implement negotiation needed
          showToast({
            type: "info",
            message: "Negotiation needed",
          });
          logger.info("Negotiation needed");
        };

        setPeerConnection(connection);
        logger.info("Peer connection initialized");
        showToast({ type: "success", message: "Peer connection successfully initialized" });
        return true;
      } catch (error) {
        logger.error("Failed to initialize peer connection: ", error);
        showToast({ type: "error", message: "Failed to initialize peer connection" });
        return false;
      }
    }
    logger.debug("Peer connection already initialized");
    showToast({ type: "error", message: "Peer connection already initialized" });
    return false;
  };

  // ------------------------------------------------------------
  // RTC Actions
  // ------------------------------------------------------------
  /**
   * Create an offer.
   * @returns {boolean} true if the offer was created successfully
   * @returns {boolean} false if it failed to create an offer
   */
  const createOffer = async () => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      try {
        const offer = await currentPeerConnection.createOffer();
        await currentPeerConnection.setLocalDescription(offer);
        setLocalSdp(offer?.sdp ?? null);
        if (offer?.sdp && signalingWs()?.readyState === WebSocket.OPEN) {
          sendSignaling("offer", offer.sdp);
          showToast({ type: "success", message: "Offer created and sent via signaling" });
        } else {
          showToast({ type: "success", message: "Offer created" });
        }
        logger.info("Offer created", offer);
        return true;
      } catch (error) {
        logger.error("Failed to create offer: ", error);
        showToast({ type: "error", message: "Failed to create offer" });
        return false;
      }
    } else {
      logger.error("Failed to create offer: no peer connection");
      showToast({ type: "error", message: "Failed to create offer: no peer connection" });
      return false;
    }
  };

  /**
   * Create an answer after setting the remote offer. Exposes answer SDP via localSdp for the other peer to paste.
   */
  const createAnswer = async () => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      try {
        const answer = await currentPeerConnection.createAnswer();
        await currentPeerConnection.setLocalDescription(answer);
        setLocalSdp(answer?.sdp ?? null);
        logger.info("Answer created", answer);
        showToast({ type: "success", message: "Answer created" });
        return true;
      } catch (error) {
        logger.error("Failed to create answer: ", error);
        showToast({ type: "error", message: "Failed to create answer" });
        return false;
      }
    } else {
      logger.error("Failed to create answer: no peer connection");
      showToast({ type: "error", message: "Failed to create answer: no peer connection" });
      return false;
    }
  };

  /**
   * Add a remote ICE candidate (paste from the other peer). Accepts RTCIceCandidateInit or JSON string.
   */
  const addIceCandidate = async (candidate: RTCIceCandidateInit | string): Promise<boolean> => {
    const currentPeerConnection = peerConnection();
    if (!currentPeerConnection) {
      showToast({ type: "error", message: "No peer connection" });
      return false;
    }
    try {
      const init: RTCIceCandidateInit =
        typeof candidate === "string" ? (JSON.parse(candidate) as RTCIceCandidateInit) : candidate;
      await currentPeerConnection.addIceCandidate(init);
      logger.info("Remote ICE candidate added");
      showToast({ type: "success", message: "ICE candidate added" });
      return true;
    } catch (error) {
      logger.error("Failed to add ICE candidate: ", error);
      showToast({ type: "error", message: "Failed to add ICE candidate" });
      return false;
    }
  };

  /**
   * Set the remote SDP (offer or answer).
   * @param sdp - The remote SDP to set.
   * @param type - Optional "offer" | "answer". If omitted, guessed from SDP (best-effort; prefer passing from UI).
   * @returns {Promise<boolean>} true if set successfully
   */
  const setRemoteSdp = async (sdp: string, type?: "offer" | "answer", skipValidation?: boolean) => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      const trimmed = sdp.trim();
      if (!skipValidation && (trimmed.length < 200 || !/m=audio|m=video/.test(trimmed))) {
        showToast({
          type: "error",
          message: `Pasted SDP too short (${trimmed.length} chars) or invalid. In the OTHER window click "Copy SDP" then paste here — don't type or select from the box.`,
        });
        return false;
      }
      const descType = type ?? getSdpType(sdp);
      const normalizedSdp = normalizeSdp(sdp);
      try {
        await currentPeerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: descType, sdp: normalizedSdp })
        );
        logger.info("Remote SDP set", { type: descType });
        showToast({ type: "success", message: `Remote SDP (${descType}) set` });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error("Failed to set remote SDP: ", error);
        showToast({ type: "error", message: `Set remote SDP failed: ${message}` });
        return false;
      }
    } else {
      logger.error("Failed to set remote SDP: no peer connection");
      showToast({ type: "error", message: "Failed to set remote SDP: no peer connection" });
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
      // 1. Close the connection (fires synchronous state change events)
      currentPeerConnection.close();

      // 2. Remove all event handlers (close() has already fired its events)
      currentPeerConnection.onconnectionstatechange = null;
      currentPeerConnection.oniceconnectionstatechange = null;
      currentPeerConnection.onicegatheringstatechange = null;
      currentPeerConnection.ontrack = null;
      currentPeerConnection.onicecandidate = null;
      currentPeerConnection.onicecandidateerror = null;
      currentPeerConnection.onnegotiationneeded = null;

      // 3. Clear signals
      setPeerConnection(null);
      setLocalSdp(null);
      setLocalIceCandidates([]);
      setRemoteStream(null);
      setRemotePeerState(null);
      setConnectionState(null);

      logger.info("Peer connection disconnected and cleaned up");
      showToast({ type: "success", message: "Peer connection successfully disconnected" });
      return true;
    } else {
      logger.error("Failed to disconnect: no peer connection");
      showToast({ type: "error", message: "Failed to disconnect" });
      return false;
    }
  };

  // ------------------------------------------------------------
  // Local data to send
  // ------------------------------------------------------------
  const sendPosition = (position: Position, facing: number) => {
    logger.info("Sending position: ", position, " facing: ", facing);
    return;
  };
  const sendSpeakingState = (isSpeaking: boolean) => {
    logger.info("Sending speaking state: ", isSpeaking);
    return;
  };

  return {
    initializePeerConnection,
    connectionState,
    localSdp,
    localIceCandidates,
    createOffer,
    createAnswer,
    setRemoteSdp,
    addIceCandidate,
    disconnect,
    connectSignaling,
    disconnectSignaling,
    signalingConnected,
    remoteStream,
    setRemoteStream,
    remotePeerState,
    setRemotePeerState,
    sendPosition,
    sendSpeakingState,
  };
}

// Create a singleton store for the webRTC hook
export const webRTCStore = createRoot(createWebRTCStore);
// Export the type of the webRTC store for convenience
export type WebRTCStore = ReturnType<typeof createWebRTCStore>;
