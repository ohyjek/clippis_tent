/* eslint-disable @typescript-eslint/no-unused-vars */
import { Accessor } from "solid-js";
import type { PeerConnectionState, RemotePeerState, Position } from "@clippis/types";
import { logger } from "@lib/logger";

export interface UseWebRTCReturn {
  // Connection state
  connectionState: Accessor<PeerConnectionState>;
  localSdp: Accessor<string>; // SDP to copy

  // Actions
  createOffer: () => Promise<void>; // Initiator calls this
  setRemoteSdp: (sdp: string) => Promise<void>; // Paste remote SDP
  disconnect: () => void;

  // Remote data
  remoteStream: Accessor<MediaStream | null>;
  remotePeerState: Accessor<RemotePeerState | null>;

  // Local data to send
  sendPosition: (position: Position, facing: number) => void;
  sendSpeakingState: (isSpeaking: boolean) => void;
}

export function useWebRTC(): UseWebRTCReturn {
  return {
    connectionState: () => "new",
    localSdp: () => {
      logger.info("todo: implement localSdp");
      return "";
    },
    createOffer: () => {
      logger.info("todo: implement createOffer");
      return Promise.resolve();
    },
    setRemoteSdp: (_sdp: string) => {
      logger.info("todo: implement setRemoteSdp");
      return Promise.resolve();
    },
    disconnect: () => {
      logger.info("todo: implement disconnect");
      return;
    },
    remoteStream: () => {
      logger.info("todo: implement remoteStream");
      return null;
    },
    remotePeerState: () => {
      logger.info("todo: implement remotePeerState");
      return null;
    },
    sendPosition: (_position: Position, _facing: number) => {
      logger.info("todo: implement sendPosition");
      return;
    },
    sendSpeakingState: (_isSpeaking: boolean) => {
      logger.info("todo: implement sendSpeakingState");
      return;
    },
  };
}
