/**
 * FullDemo/index.ts - Barrel export for the FullDemo component
 */
export { FullDemo } from "./FullDemo";

// Re-export context for external use if needed
export { DemoProvider, useDemoContext } from "./context";

// Re-export types for external use
export type {
  SpeakerState,
  AudioNodes,
  DrawnRoom,
  DrawingMode,
  Position,
  Wall,
} from "./context/types";
