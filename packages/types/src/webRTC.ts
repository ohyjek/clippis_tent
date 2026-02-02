import { Position } from "./geometry";

// Peer connection state
export type PeerConnectionState = "new" | "connecting" | "connected" | "disconnected" | "failed";

// Remote peer data synced via DataChannel
export interface RemotePeerState {
  peerId: string;
  position: Position;
  facing: number;
  isSpeaking: boolean;
}

// Message types for DataChannel
export type DataChannelMessage =
  | { type: "position"; position: Position; facing: number }
  | { type: "speaking"; isSpeaking: boolean };
