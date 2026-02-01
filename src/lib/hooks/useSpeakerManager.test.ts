/**
 * useSpeakerManager.test.ts - Unit tests for speaker management hook
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { createRoot } from "solid-js";
import { useSpeakerManager, type SpeakerManagerState } from "@lib/hooks/useSpeakerManager";
import type { SpeakerState } from "@clippis/types";

// Mock SPEAKER_COLORS (must match exact import path in source)
vi.mock("@lib/spatial-audio", () => ({
  SPEAKER_COLORS: ["#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#ec4899"],
}));

describe("useSpeakerManager", () => {
  let manager: SpeakerManagerState;
  let dispose: () => void;

  const createManager = (options?: Parameters<typeof useSpeakerManager>[0]) => {
    dispose = createRoot((d) => {
      manager = useSpeakerManager(options);
      return d;
    });
  };

  afterEach(() => {
    dispose?.();
  });

  describe("initial state with defaults", () => {
    beforeEach(() => createManager());

    it("starts with two default speakers", () => {
      expect(manager.speakers().length).toBe(2);
    });

    it("has observer as first speaker", () => {
      expect(manager.speakers()[0].id).toBe("observer");
    });

    it("has observer selected by default", () => {
      expect(manager.selectedSpeaker()).toBe("observer");
    });

    it("has observer as current perspective", () => {
      expect(manager.currentPerspective()).toBe("observer");
    });
  });

  describe("initial state with custom speakers", () => {
    const customSpeakers: SpeakerState[] = [
      {
        id: "custom-1",
        position: { x: 0, y: 0 },
        facing: 0,
        color: "#ff0000",
        directivity: "cardioid",
        frequency: 440,
        sourceType: "oscillator",
      },
    ];

    beforeEach(() => createManager({ initialSpeakers: customSpeakers }));

    it("uses provided initial speakers", () => {
      expect(manager.speakers().length).toBe(1);
      expect(manager.speakers()[0].id).toBe("custom-1");
    });
  });

  describe("getSpeakerById", () => {
    beforeEach(() => createManager());

    it("returns speaker when found", () => {
      const speaker = manager.getSpeakerById("observer");
      expect(speaker?.id).toBe("observer");
    });

    it("returns undefined when not found", () => {
      const speaker = manager.getSpeakerById("nonexistent");
      expect(speaker).toBeUndefined();
    });
  });

  describe("getSelectedSpeaker", () => {
    beforeEach(() => createManager());

    it("returns the currently selected speaker", () => {
      const speaker = manager.getSelectedSpeaker();
      expect(speaker?.id).toBe("observer");
    });
  });

  describe("addSpeaker", () => {
    beforeEach(() => createManager());

    it("adds a new speaker", () => {
      const initialCount = manager.speakers().length;
      manager.addSpeaker();
      expect(manager.speakers().length).toBe(initialCount + 1);
    });

    it("returns the new speaker", () => {
      const newSpeaker = manager.addSpeaker();
      expect(newSpeaker.id).toBeDefined();
    });

    it("selects the new speaker", () => {
      const newSpeaker = manager.addSpeaker();
      expect(manager.selectedSpeaker()).toBe(newSpeaker.id);
    });

    it("assigns cardioid directivity by default", () => {
      const newSpeaker = manager.addSpeaker();
      expect(newSpeaker.directivity).toBe("cardioid");
    });

    it("assigns oscillator source type by default", () => {
      const newSpeaker = manager.addSpeaker();
      expect(newSpeaker.sourceType).toBe("oscillator");
    });
  });

  describe("deleteSelectedSpeaker", () => {
    beforeEach(() => createManager());

    it("removes the selected speaker", () => {
      const initialCount = manager.speakers().length;
      manager.deleteSelectedSpeaker();
      expect(manager.speakers().length).toBe(initialCount - 1);
    });

    it("calls onStopPlayback callback", () => {
      const onStopPlayback = vi.fn();
      createManager({ onStopPlayback });
      manager.deleteSelectedSpeaker();
      expect(onStopPlayback).toHaveBeenCalledWith("observer");
    });

    it("switches perspective if deleting current perspective", () => {
      expect(manager.currentPerspective()).toBe("observer");
      manager.deleteSelectedSpeaker();
      expect(manager.currentPerspective()).toBe("speaker-1");
    });

    it("selects another speaker after deletion", () => {
      manager.deleteSelectedSpeaker();
      expect(manager.selectedSpeaker()).toBe("speaker-1");
    });
  });

  describe("perspective helpers", () => {
    beforeEach(() => createManager());

    it("isCurrentPerspective returns true for perspective speaker", () => {
      expect(manager.isCurrentPerspective("observer")).toBe(true);
    });

    it("isCurrentPerspective returns false for other speakers", () => {
      expect(manager.isCurrentPerspective("speaker-1")).toBe(false);
    });

    it("getPerspectivePosition returns perspective speaker position", () => {
      const pos = manager.getPerspectivePosition();
      expect(pos).toEqual({ x: 0, y: 0 });
    });

    it("getPerspectiveFacing returns perspective speaker facing", () => {
      const facing = manager.getPerspectiveFacing();
      expect(facing).toBe(0);
    });
  });

  describe("updatePosition", () => {
    beforeEach(() => createManager());

    it("updates speaker position", () => {
      manager.updatePosition("observer", { x: 1, y: 2 });
      expect(manager.getSpeakerById("observer")?.position).toEqual({ x: 1, y: 2 });
    });
  });

  describe("updateFacing", () => {
    beforeEach(() => createManager());

    it("updates speaker facing angle", () => {
      manager.updateFacing("observer", Math.PI / 2);
      expect(manager.getSpeakerById("observer")?.facing).toBe(Math.PI / 2);
    });
  });

  describe("updateDirectivity", () => {
    beforeEach(() => createManager());

    it("updates selected speaker directivity", () => {
      manager.updateDirectivity("cardioid");
      expect(manager.getSelectedSpeaker()?.directivity).toBe("cardioid");
    });
  });

  describe("updateFrequency", () => {
    beforeEach(() => createManager());

    it("updates selected speaker frequency", () => {
      manager.updateFrequency(880);
      expect(manager.getSelectedSpeaker()?.frequency).toBe(880);
    });
  });

  describe("updateColor", () => {
    beforeEach(() => createManager());

    it("updates selected speaker color", () => {
      manager.updateColor("#00ff00");
      expect(manager.getSelectedSpeaker()?.color).toBe("#00ff00");
    });
  });

  describe("updateSourceType", () => {
    beforeEach(() => createManager());

    it("updates selected speaker source type", () => {
      manager.updateSourceType("microphone");
      expect(manager.getSelectedSpeaker()?.sourceType).toBe("microphone");
    });
  });

  describe("reset", () => {
    beforeEach(() => createManager());

    it("resets to provided speakers", () => {
      manager.addSpeaker();
      manager.addSpeaker();
      expect(manager.speakers().length).toBe(4);

      const newSpeakers: SpeakerState[] = [
        {
          id: "reset-1",
          position: { x: 0, y: 0 },
          facing: 0,
          color: "#ff0000",
          directivity: "omnidirectional",
          frequency: 440,
          sourceType: "oscillator",
        },
      ];

      manager.reset(newSpeakers);
      expect(manager.speakers().length).toBe(1);
      expect(manager.speakers()[0].id).toBe("reset-1");
    });

    it("updates selection to first speaker", () => {
      const newSpeakers: SpeakerState[] = [
        {
          id: "reset-1",
          position: { x: 0, y: 0 },
          facing: 0,
          color: "#ff0000",
          directivity: "omnidirectional",
          frequency: 440,
          sourceType: "oscillator",
        },
      ];

      manager.reset(newSpeakers);
      expect(manager.selectedSpeaker()).toBe("reset-1");
      expect(manager.currentPerspective()).toBe("reset-1");
    });
  });
});
