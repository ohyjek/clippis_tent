import { createRoot, createSignal } from "solid-js";
import type { RemotePeerState, Position } from "@clippis/types";
import { logger } from "@lib/logger";
import { showToast } from "@stores/toast";

const DEFAULT_ICE_SERVERS = [
  {
    urls: "stun:stun.l.google.com:19302",
  },
];

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

        connection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
          showToast({
            type: "info",
            message: `ICE candidate: ${event.candidate?.candidate}`,
          });
          logger.info(`ICE candidate: ${event.candidate?.candidate}`);
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
          // TODO: Implement track added
          showToast({
            type: "info",
            message: `Track added: ${event.track.id}`,
          });
          logger.info(`Track added: ${event.track.id}`);
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
        const offer = await currentPeerConnection.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: false,
        });
        await currentPeerConnection.setLocalDescription(offer);
        setLocalSdp(offer?.sdp ?? null);
        logger.info("creating offer: ", offer);
        showToast({ type: "success", message: "Offer successfully created" });
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
   * Set the remote SDP.
   * @param sdp - The remote SDP to set.
   * @returns {boolean} true if the remote SDP was set successfully
   * @returns {boolean} false if it failed to set the remote SDP
   */
  const setRemoteSdp = async (sdp: string) => {
    const currentPeerConnection = peerConnection();
    if (currentPeerConnection) {
      try {
        await currentPeerConnection.setRemoteDescription(
          new RTCSessionDescription({ type: "answer", sdp: sdp })
        );
        logger.info("Remote SDP set");
        showToast({ type: "success", message: "Remote SDP successfully set" });
        return true;
      } catch (error) {
        logger.error("Failed to set remote SDP: ", error);
        showToast({ type: "error", message: "Failed to set remote SDP" });
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
// Export the type of the webRTC store for convenience
export type WebRTCStore = ReturnType<typeof createWebRTCStore>;
