/* eslint-disable @typescript-eslint/no-unused-vars */
import { Accessor, createRoot, createSignal } from "solid-js";
import type { PeerConnectionState, RemotePeerState, Position } from "@clippis/types";
import { logger } from "@lib/logger";
import { showToast } from "@stores/toast";

export interface WebRTCStoreState {
  // Actions
  initializePeerConnection: () => boolean;
  setConnectionState: (state: PeerConnectionState) => void;
  // Connection state
  connectionState: Accessor<PeerConnectionState>;
  localSdp: Accessor<string>; // SDP to copy

  // Actions
  createOffer: () => Promise<void>; // Initiator calls this
  setRemoteSdp: (sdp: string) => Promise<void>; // Paste remote SDP
  disconnect: () => void;

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

export function createWebRTCStore(): WebRTCStoreState {
  // ------------------------------------------------------------
  // Connection State Signals
  // ------------------------------------------------------------
  const [connectionState, setConnectionState] = createSignal<PeerConnectionState>("new"); // For UI Not yet implemented
  const [peerConnection, setPeerConnection] = createSignal<RTCPeerConnection | null>(null); // Only support one connection for test
  const [localSdp, setLocalSdp] = createSignal<string>("");

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
        const rtcpc = new RTCPeerConnection({ iceServers: DEFAULT_ICE_SERVERS });

        rtcpc.onicecandidate = (event) => {
          logger.info("ICE candidate: ", event);
        };

        rtcpc.onconnectionstatechange = (event) => {
          logger.info("Connection state change: ", event);
        };

        rtcpc.oniceconnectionstatechange = (event) => {
          logger.info("ICE connection state change: ", event);
        };

        rtcpc.onicegatheringstatechange = (event) => {
          logger.info("ICE gathering state change: ", event);
        };

        rtcpc.ontrack = (event) => {
          logger.info("Track added: ", event);
        };

        rtcpc.onicecandidateerror = (event) => {
          logger.info("ICE candidate error: ", event);
        };

        setPeerConnection(rtcpc);
        logger.info("Peer connection initialized");
        return true;
      } catch (error) {
        logger.error("Failed to initialize peer connection: ", error);
        showToast({ type: "error", message: "Failed to initialize peer connection" });
        return false;
      }
    }
    logger.debug("Peer connection already initialized");
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
    } else {
      logger.error("Failed to set remote SDP: no peer connection");
      showToast({ type: "error", message: "Failed to set remote SDP" });
    }
    return;
  };

  /**
   * Disconnect the peer connection.
   * @returns {void} void
   * @returns {void} void if it failed to disconnect
   */
  const disconnect = () => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      currentPeerConnection.close();
      setPeerConnection(null);
      logger.info("Peer connection disconnected");
    } else {
      logger.error("Failed to disconnect: no peer connection");
      showToast({ type: "error", message: "Failed to disconnect" });
    }
    return;
  };

  // ------------------------------------------------------------
  // Remote data
  // ------------------------------------------------------------
  const [remoteStream, setRemoteStream] = createSignal<MediaStream | null>(null);
  const [remotePeerState, setRemotePeerState] = createSignal<RemotePeerState | null>(null);

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
    setConnectionState,
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
