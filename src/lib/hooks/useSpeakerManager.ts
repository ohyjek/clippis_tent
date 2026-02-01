/**
 * useSpeakerManager.ts - Speaker state management hook
 *
 * Provides speaker CRUD operations, selection, and perspective management.
 */
import { createSignal, type Accessor, type Setter } from "solid-js";
import type { SpeakerState, DirectivityPattern, AudioSourceType, Position } from "@clippis/types";
import { SPEAKER_COLORS } from "@lib/spatial-audio";
import { generateId, updateItemById } from "@lib/spatial-utils";

/** Options for speaker manager initialization */
export interface SpeakerManagerOptions {
  /** Initial speakers to create */
  initialSpeakers?: SpeakerState[];
  /** Callback when playback should stop for a speaker */
  onStopPlayback?: (speakerId: string) => void;
}

export interface SpeakerManagerState {
  /** List of all speakers */
  speakers: Accessor<SpeakerState[]>;
  setSpeakers: Setter<SpeakerState[]>;
  /** Currently selected speaker ID */
  selectedSpeaker: Accessor<string>;
  setSelectedSpeaker: Setter<string>;
  /** Current perspective (who "you" are) */
  currentPerspective: Accessor<string>;
  setCurrentPerspective: Setter<string>;

  /** Get the currently selected speaker */
  getSelectedSpeaker: () => SpeakerState | undefined;
  /** Get a speaker by ID */
  getSpeakerById: (id: string) => SpeakerState | undefined;
  /** Check if a speaker is the current perspective */
  isCurrentPerspective: (id: string) => boolean;
  /** Get perspective position */
  getPerspectivePosition: () => Position;
  /** Get perspective facing angle */
  getPerspectiveFacing: () => number;

  /** Add a new speaker */
  addSpeaker: () => SpeakerState;
  /** Delete the selected speaker */
  deleteSelectedSpeaker: () => void;
  /** Update speaker position */
  updatePosition: (id: string, position: Position) => void;
  /** Update speaker facing angle */
  updateFacing: (id: string, facing: number) => void;
  /** Update speaker directivity */
  updateDirectivity: (pattern: DirectivityPattern) => void;
  /** Update speaker frequency */
  updateFrequency: (frequency: number) => void;
  /** Update speaker color */
  updateColor: (color: string) => void;
  /** Update speaker source type */
  updateSourceType: (sourceType: AudioSourceType) => void;

  /** Reset to initial state */
  reset: (initialSpeakers: SpeakerState[]) => void;
}

const OBSERVER_ID = "observer";

/**
 * Hook for managing speaker state
 */
export function useSpeakerManager(options?: SpeakerManagerOptions): SpeakerManagerState {
  const defaultSpeakers: SpeakerState[] = options?.initialSpeakers ?? [
    {
      id: OBSERVER_ID,
      position: { x: 0, y: 0 },
      facing: 0,
      color: "#3b82f6",
      directivity: "omnidirectional",
      frequency: 440,
      sourceType: "oscillator",
    },
    {
      id: "speaker-1",
      position: { x: -1, y: 0 },
      facing: 0,
      color: SPEAKER_COLORS[0],
      directivity: "cardioid",
      frequency: 440,
      sourceType: "oscillator",
    },
  ];

  const [speakers, setSpeakers] = createSignal<SpeakerState[]>(defaultSpeakers);
  const [selectedSpeaker, setSelectedSpeaker] = createSignal<string>(OBSERVER_ID);
  const [currentPerspective, setCurrentPerspective] = createSignal<string>(OBSERVER_ID);

  const getSelectedSpeaker = () => speakers().find((s) => s.id === selectedSpeaker());
  const getSpeakerById = (id: string) => speakers().find((s) => s.id === id);
  const isCurrentPerspective = (id: string) => currentPerspective() === id;

  const getPerspectivePosition = (): Position => {
    const speaker = getSpeakerById(currentPerspective());
    return speaker?.position ?? { x: 0, y: 0 };
  };

  const getPerspectiveFacing = (): number => {
    const speaker = getSpeakerById(currentPerspective());
    return speaker?.facing ?? 0;
  };

  const addSpeaker = (): SpeakerState => {
    const currentSpeakers = speakers();
    const index = currentSpeakers.length;
    const newSpeaker: SpeakerState = {
      id: generateId(),
      position: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 3,
      },
      facing: 0,
      color: SPEAKER_COLORS[index % SPEAKER_COLORS.length],
      directivity: "cardioid",
      frequency: 440 + index * 110,
      sourceType: "oscillator",
    };

    setSpeakers((prev) => [...prev, newSpeaker]);
    setSelectedSpeaker(newSpeaker.id);

    if (currentSpeakers.length === 0) {
      setCurrentPerspective(newSpeaker.id);
    }

    return newSpeaker;
  };

  const deleteSelectedSpeaker = () => {
    const id = selectedSpeaker();
    if (!id) return;

    options?.onStopPlayback?.(id);

    const remaining = speakers().filter((s) => s.id !== id);

    if (currentPerspective() === id) {
      setCurrentPerspective(remaining[0]?.id ?? "");
    }

    setSpeakers(remaining);
    setSelectedSpeaker(remaining[0]?.id ?? "");
  };

  const updatePosition = (id: string, position: Position) => {
    setSpeakers((prev) => updateItemById(prev, id, { position }));
  };

  const updateFacing = (id: string, facing: number) => {
    setSpeakers((prev) => updateItemById(prev, id, { facing }));
  };

  const updateDirectivity = (pattern: DirectivityPattern) => {
    const id = selectedSpeaker();
    setSpeakers((prev) => updateItemById(prev, id, { directivity: pattern }));
  };

  const updateFrequency = (frequency: number) => {
    const id = selectedSpeaker();
    setSpeakers((prev) => updateItemById(prev, id, { frequency }));
  };

  const updateColor = (color: string) => {
    const id = selectedSpeaker();
    setSpeakers((prev) => updateItemById(prev, id, { color }));
  };

  const updateSourceType = (sourceType: AudioSourceType) => {
    const id = selectedSpeaker();
    setSpeakers((prev) => updateItemById(prev, id, { sourceType }));
  };

  const reset = (initialSpeakers: SpeakerState[]) => {
    setSpeakers(initialSpeakers);
    setSelectedSpeaker(initialSpeakers[0]?.id ?? "");
    setCurrentPerspective(initialSpeakers[0]?.id ?? "");
  };

  return {
    speakers,
    setSpeakers,
    selectedSpeaker,
    setSelectedSpeaker,
    currentPerspective,
    setCurrentPerspective,
    getSelectedSpeaker,
    getSpeakerById,
    isCurrentPerspective,
    getPerspectivePosition,
    getPerspectiveFacing,
    addSpeaker,
    deleteSelectedSpeaker,
    updatePosition,
    updateFacing,
    updateDirectivity,
    updateFrequency,
    updateColor,
    updateSourceType,
    reset,
  };
}
