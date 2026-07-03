/**
 * FullDemo/index.ts - Barrel export for the FullDemo component
 */

// Re-export context for external use if needed
export { DemoProvider, useDemoContext } from "./context";
// Re-export types for external use
export type {
  AudioNodes,
  DrawingMode,
  DrawnRoom,
  Position,
  SpeakerState,
  Wall,
} from "./context/types";
export { FullDemo } from "./FullDemo";
