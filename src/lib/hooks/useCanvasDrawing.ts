/**
 * useCanvasDrawing.ts - Canvas drawing interaction hook
 *
 * Handles draw mode mouse events for creating rectangular regions.
 */
import { createSignal, type Accessor, type Setter } from "solid-js";
import type { Position, DrawingMode } from "@clippis/types";

/** Options for canvas drawing */
export interface CanvasDrawingOptions {
  /** Callback when a draw completes */
  onDrawComplete?: (start: Position, end: Position) => void;
  /** Function to convert mouse event to canvas coordinates */
  getPositionFromEvent: (e: MouseEvent) => Position;
}

export interface CanvasDrawingState {
  /** Current drawing mode */
  drawingMode: Accessor<DrawingMode>;
  setDrawingMode: Setter<DrawingMode>;
  /** Whether currently drawing */
  isDrawing: Accessor<boolean>;
  /** Draw start position */
  drawStart: Accessor<Position | null>;
  /** Current draw end position */
  drawEnd: Accessor<Position | null>;

  /** Handle mouse down on canvas */
  handleMouseDown: (e: MouseEvent) => void;
  /** Handle mouse move on canvas */
  handleMouseMove: (e: MouseEvent) => void;
  /** Handle mouse up on canvas */
  handleMouseUp: () => void;
  /** Reset drawing state */
  resetDrawing: () => void;
}

/**
 * Hook for managing canvas drawing interactions
 */
export function useCanvasDrawing(options: CanvasDrawingOptions): CanvasDrawingState {
  const [drawingMode, setDrawingMode] = createSignal<DrawingMode>("select");
  const [isDrawing, setIsDrawing] = createSignal(false);
  const [drawStart, setDrawStart] = createSignal<Position | null>(null);
  const [drawEnd, setDrawEnd] = createSignal<Position | null>(null);

  const handleMouseDown = (e: MouseEvent) => {
    if (drawingMode() !== "draw") return;

    const pos = options.getPositionFromEvent(e);
    setIsDrawing(true);
    setDrawStart(pos);
    setDrawEnd(pos);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDrawing()) return;
    setDrawEnd(options.getPositionFromEvent(e));
  };

  const handleMouseUp = () => {
    if (!isDrawing()) return;

    const start = drawStart();
    const end = drawEnd();

    if (start && end) {
      options.onDrawComplete?.(start, end);
    }

    resetDrawing();
  };

  const resetDrawing = () => {
    setIsDrawing(false);
    setDrawStart(null);
    setDrawEnd(null);
  };

  return {
    drawingMode,
    setDrawingMode,
    isDrawing,
    drawStart,
    drawEnd,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    resetDrawing,
  };
}
