/* eslint-disable @typescript-eslint/no-unused-vars */
import { Accessor, createRoot, createSignal } from "solid-js";
import type { RemotePeerState, Position } from "@clippis/types";
import { logger } from "@lib/logger";
import { showToast } from "@stores/toast";

export interface WebRTCStoreState {
  // Actions
  initializePeerConnection: () => boolean;
  // setConnectionState: (state: PeerConnectionState) => void;
  // Connection state
  connectionState: Accessor<RTCPeerConnectionState>;
  localSdp: Accessor<string>; // SDP to copy

  // Actions
  createOffer: () => Promise<void>; // Initiator calls this
  setRemoteSdp: (sdp: string) => Promise<void>; // Paste remote SDP
  disconnect: () => boolean;

  // Remote data
  remoteStream: Accessor<MediaStream | null>;
  setRemoteStream: (stream: MediaStream | null) => void;
  remotePeerState: Accessor<RemotePeerState | null>;
  setRemotePeerState: (state: RemotePeerState | null) => void;

  // Local data to send
  sendPosition: (position: Position, facing: number) => void;
  sendSpeakingState: (isSpeaking: boolean) => void;
}

const DEFAULT_ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

/**
 *
 * @returns {WebRTCStoreState} The webRTC store state.
 */
export function createWebRTCStore(): WebRTCStoreState {
  // ------------------------------------------------------------
  // Remote data
  // ------------------------------------------------------------
  const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(null);
  const [remotePeerState, setRemotePeerState] = createSignal<RemotePeerState | null>(null);
  // ------------------------------------------------------------
  // Connection State Signals
  // ------------------------------------------------------------
  const [connectionState, setConnectionState] = createSignal<RTCPeerConnectionState>("new");
  const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null);
  const [localSdp, setLocalSdp] = createSignal<string>(""); // Local SDP to copy

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
        // Returns a new RTCPeerConnection,
        // representing a connection between
        // the local device and a remote peer.
        const connection = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS });

        logger.info("new connection state: ", connection.connectionState);

        connection.onicecandidate = (event) => {
          logger.info("ICE candidate: ", event);
        };

        connection.onconnectionstatechange = (event) => {
          // TODO: Implement connection state change
          logger.info("Connection state change: ", event);
          setConnectionState(connection.connectionState);
        };

        connection.oniceconnectionstatechange = (event) => {
          // TODO: Implement ICE connection state change
          logger.info("ICE connection state change: ", event);
        };

        connection.onicegatheringstatechange = (event) => {
          // TODO: Implement ICE gathering state change
          logger.info("ICE gathering state change: ", event);
        };

        connection.ontrack = (event) => {
          // TODO: Implement track added
          logger.info("Track added: ", event);
        };

        connection.onicecandidateerror = (event) => {
          // TODO: Implement ICE candidate error
          logger.info("ICE candidate error: ", event);
        };

        connection.onnegotiationneeded = (event) => {
          // TODO: Implement negotiation needed
          logger.info("Negotiation needed: ", event);
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
   * @returns {Promise<void>} void
   * @returns {Promise<void>} void if it failed to create an offer
   */
  const createOffer = async () => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      const offer = await currentPeerConnection.createOffer();
      await currentPeerConnection.setLocalDescription(offer);
      setLocalSdp(offer?.sdp ?? "");
      logger.info("creating offer: ", offer);
      showToast({ type: "success", message: "Offer successfully created" });
    } else {
      logger.error("Failed to create offer: no peer connection");
      showToast({ type: "error", message: "Failed to create offer" });
    }
    return;
  };

  /**
   * Set the remote SDP.
   * @param sdp - The remote SDP to set.
   * @returns {Promise<void>} void
   * @returns {Promise<void>} void if it failed to set the remote SDP
   */
  const setRemoteSdp = async (sdp: string) => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      await currentPeerConnection.setRemoteDescription(
        new RTCSessionDescription({ type: "answer", sdp: sdp })
      );
      logger.info("Remote SDP set");
      showToast({ type: "success", message: "Remote SDP successfully set" });
    } else {
      logger.error("Failed to set remote SDP: no peer connection");
      showToast({ type: "error", message: "Failed to set remote SDP" });
    }
    return;
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

      // 3. Clear signals
      setPeerConnection(null);
      setLocalSdp("");
      setRemoteStream(null);
      setRemotePeerState(null);

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
  const sendPosition = (_position: Position, _facing: number) => {
    logger.info("todo: implement sendPosition");
    return;
  };
  const sendSpeakingState = (_isSpeaking: boolean) => {
    logger.info("todo: implement sendSpeakingState");
    return;
  };

  return {
    initializePeerConnection,
    connectionState,
    localSdp,
    createOffer,
    setRemoteSdp,
    disconnect,
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
