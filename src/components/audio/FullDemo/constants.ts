/**
 * constants.ts - Constants for the spatial audio demo
 *
 * Contains color palettes, default values, and configuration options.
 * Note: DEFAULT_ATTENUATION is defined in @/lib/spatial-utils.ts
 */
import { SPEAKER_COLORS } from "@lib/spatial-audio";
import type { SelectOption, SpeakerState } from "./context/types";

/** Color palette for rooms */
export const ROOM_COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
  "#6366f1",
  "#14b8a6",
] as const;

/** Default maximum distance for sound propagation (in world units) */
export const DEFAULT_MAX_DISTANCE = 5;

/** Default minimum gain for sounds behind the listener (0-1) */
export const DEFAULT_REAR_GAIN = 0.3;

/**
 * Musical note names with octave
 * Maps common frequencies to their note names
 */
export const FREQUENCY_NOTES: Record<number, string> = {
  220: "A3",
  233: "A#3",
  247: "B3",
  262: "C4",
  277: "C#4",
  294: "D4",
  311: "D#4",
  330: "E4",
  349: "F4",
  370: "F#4",
  392: "G4",
  415: "G#4",
  440: "A4",
  466: "A#4",
  494: "B4",
  523: "C5",
  554: "C#5",
  587: "D5",
  622: "D#5",
  659: "E5",
  698: "F5",
  740: "F#5",
  784: "G5",
  831: "G#5",
  880: "A5",
};

/** Audio source type options */
export const SOURCE_TYPE_OPTIONS: SelectOption[] = [
  { value: "oscillator", label: "Test Tone (Oscillator)" },
  { value: "microphone", label: "Microphone (Voice)" },
];

/** Directivity pattern options for speakers */
export const DIRECTIVITY_OPTIONS: SelectOption[] = [
  { value: "omnidirectional", label: "Omni (all directions)" },
  { value: "cardioid", label: "Cardioid (heart-shaped)" },
  { value: "supercardioid", label: "Supercardioid (tighter)" },
  { value: "hypercardioid", label: "Hypercardioid (very tight)" },
  { value: "figure8", label: "Figure-8 (front + back)" },
  { value: "hemisphere", label: "Hemisphere (front only)" },
];

/** Distance model options for audio attenuation */
export const DISTANCE_MODEL_OPTIONS: SelectOption[] = [
  { value: "inverse", label: "Inverse (natural)" },
  { value: "linear", label: "Linear (predictable)" },
  { value: "exponential", label: "Exponential (dramatic)" },
];

export const OBSERVER_ID = "observer";

export const DEFAULT_SPEAKERS: SpeakerState[] = [
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
