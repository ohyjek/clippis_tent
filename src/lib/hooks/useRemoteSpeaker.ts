/* eslint-disable @typescript-eslint/no-unused-vars */
import { Position, AudioParameters } from "@clippis/types";
import { Accessor } from "solid-js";
import { logger } from "@lib/logger";

interface UseRemoteSpeakerReturn {
  // Bind remote stream to audio output
  setRemoteStream: (stream: MediaStream | null) => void;

  // Update remote peer position (from DataChannel)
  updateRemotePosition: (position: Position, facing: number) => void;

  // Calculated audio parameters
  audioParams: Accessor<AudioParameters | null>;
}

export function useRemoteSpeaker(): UseRemoteSpeakerReturn {
  return {
    setRemoteStream: (_stream: MediaStream | null) => {
      logger.info("todo: implement setRemoteStream");
      return;
    },
    updateRemotePosition: (_position: Position, _facing: number) => {
      logger.info("todo: implement updateRemotePosition");
      return;
    },
    audioParams: () => {
      logger.info("todo: implement audioParams");
      return null;
    },
  };
}
