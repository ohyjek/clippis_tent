/**
 * useCanvasDrawing.test.ts - Unit tests for canvas drawing hook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { useCanvasDrawing, type CanvasDrawingState } from "@lib/hooks/useCanvasDrawing";

describe("useCanvasDrawing", () => {
  let drawing: CanvasDrawingState;
  let dispose: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let onDrawComplete: ReturnType<typeof vi.fn>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let getPositionFromEvent: ReturnType<typeof vi.fn>;

  const createDrawing = () => {
    onDrawComplete = vi.fn();
    getPositionFromEvent = vi.fn((e: MouseEvent) => ({
      x: e.clientX / 100,
      y: e.clientY / 100,
    }));

    dispose = createRoot((d) => {
      drawing = useCanvasDrawing({
        // Cast mocks to expected types for the hook
        onDrawComplete: onDrawComplete as (
          start: { x: number; y: number },
          end: { x: number; y: number }
        ) => void,
        getPositionFromEvent: getPositionFromEvent as (e: MouseEvent) => { x: number; y: number },
      });
      return d;
    });
  };

  beforeEach(() => createDrawing());

  afterEach(() => {
    dispose?.();
  });

  describe("initial state", () => {
    it("starts in select mode", () => {
      expect(drawing.drawingMode()).toBe("select");
    });

    it("is not drawing initially", () => {
      expect(drawing.isDrawing()).toBe(false);
    });

    it("has no draw start position", () => {
      expect(drawing.drawStart()).toBeNull();
    });

    it("has no draw end position", () => {
      expect(drawing.drawEnd()).toBeNull();
    });
  });

  describe("drawing mode", () => {
    it("can switch to draw mode", () => {
      drawing.setDrawingMode("draw");
      expect(drawing.drawingMode()).toBe("draw");
    });

    it("can switch back to select mode", () => {
      drawing.setDrawingMode("draw");
      drawing.setDrawingMode("select");
      expect(drawing.drawingMode()).toBe("select");
    });
  });

  describe("handleMouseDown", () => {
    it("does nothing in select mode", () => {
      const mockEvent = { clientX: 100, clientY: 100 } as MouseEvent;
      drawing.handleMouseDown(mockEvent);

      expect(drawing.isDrawing()).toBe(false);
      expect(getPositionFromEvent).not.toHaveBeenCalled();
    });

    it("starts drawing in draw mode", () => {
      drawing.setDrawingMode("draw");
      const mockEvent = { clientX: 100, clientY: 100 } as MouseEvent;
      drawing.handleMouseDown(mockEvent);

      expect(drawing.isDrawing()).toBe(true);
      expect(getPositionFromEvent).toHaveBeenCalledWith(mockEvent);
    });

    it("sets draw start position", () => {
      drawing.setDrawingMode("draw");
      const mockEvent = { clientX: 100, clientY: 200 } as MouseEvent;
      drawing.handleMouseDown(mockEvent);

      expect(drawing.drawStart()).toEqual({ x: 1, y: 2 });
    });

    it("sets draw end to same position as start", () => {
      drawing.setDrawingMode("draw");
      const mockEvent = { clientX: 100, clientY: 200 } as MouseEvent;
      drawing.handleMouseDown(mockEvent);

      expect(drawing.drawEnd()).toEqual({ x: 1, y: 2 });
    });
  });

  describe("handleMouseMove", () => {
    it("does nothing when not drawing", () => {
      const mockEvent = { clientX: 200, clientY: 200 } as MouseEvent;
      drawing.handleMouseMove(mockEvent);

      expect(drawing.drawEnd()).toBeNull();
    });

    it("updates draw end when drawing", () => {
      drawing.setDrawingMode("draw");
      drawing.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
      drawing.handleMouseMove({ clientX: 200, clientY: 300 } as MouseEvent);

      expect(drawing.drawEnd()).toEqual({ x: 2, y: 3 });
    });
  });

  describe("handleMouseUp", () => {
    it("does nothing when not drawing", () => {
      drawing.handleMouseUp();
      expect(onDrawComplete).not.toHaveBeenCalled();
    });

    it("calls onDrawComplete with start and end positions", () => {
      drawing.setDrawingMode("draw");
      drawing.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
      drawing.handleMouseMove({ clientX: 200, clientY: 300 } as MouseEvent);
      drawing.handleMouseUp();

      expect(onDrawComplete).toHaveBeenCalledWith({ x: 1, y: 1 }, { x: 2, y: 3 });
    });

    it("resets drawing state", () => {
      drawing.setDrawingMode("draw");
      drawing.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
      drawing.handleMouseMove({ clientX: 200, clientY: 300 } as MouseEvent);
      drawing.handleMouseUp();

      expect(drawing.isDrawing()).toBe(false);
      expect(drawing.drawStart()).toBeNull();
      expect(drawing.drawEnd()).toBeNull();
    });
  });

  describe("resetDrawing", () => {
    it("clears all drawing state", () => {
      drawing.setDrawingMode("draw");
      drawing.handleMouseDown({ clientX: 100, clientY: 100 } as MouseEvent);
      drawing.handleMouseMove({ clientX: 200, clientY: 300 } as MouseEvent);

      drawing.resetDrawing();

      expect(drawing.isDrawing()).toBe(false);
      expect(drawing.drawStart()).toBeNull();
      expect(drawing.drawEnd()).toBeNull();
    });
  });

  describe("full draw flow", () => {
    it("completes a full draw cycle", () => {
      // Switch to draw mode
      drawing.setDrawingMode("draw");
      expect(drawing.drawingMode()).toBe("draw");

      // Start drawing
      drawing.handleMouseDown({ clientX: 50, clientY: 50 } as MouseEvent);
      expect(drawing.isDrawing()).toBe(true);
      expect(drawing.drawStart()).toEqual({ x: 0.5, y: 0.5 });

      // Move during drawing
      drawing.handleMouseMove({ clientX: 150, clientY: 150 } as MouseEvent);
      expect(drawing.drawEnd()).toEqual({ x: 1.5, y: 1.5 });

      // Complete drawing
      drawing.handleMouseUp();
      expect(onDrawComplete).toHaveBeenCalledWith({ x: 0.5, y: 0.5 }, { x: 1.5, y: 1.5 });
      expect(drawing.isDrawing()).toBe(false);
    });
  });
});
