/**
 * spatial-utils.test.ts - Unit tests for spatial utility functions
 */
import { describe, it, expect } from "vitest";
import {
  toPercent,
  fromPercent,
  distanceBetween,
  angleBetween,
  normalizeAngle,
  createWallsFromBounds,
  createRoomFromCorners,
  isValidRoomSize,
  isSpeakerInsideRoom,
  updateItemById,
  DEFAULT_ATTENUATION,
  MIN_ROOM_SIZE,
} from "@lib/spatial-utils";
import type { DrawnRoom, SpeakerState } from "@clippis/types";

describe("Coordinate Conversion", () => {
  describe("toPercent", () => {
    it("converts center (0) to 50%", () => {
      expect(toPercent(0)).toBe(50);
    });

    it("converts positive values correctly", () => {
      expect(toPercent(2.5)).toBe(100);
      expect(toPercent(1)).toBe(70);
    });

    it("converts negative values correctly", () => {
      expect(toPercent(-2.5)).toBe(0);
      expect(toPercent(-1)).toBe(30);
    });
  });

  describe("fromPercent", () => {
    it("converts 50% to center (0)", () => {
      expect(fromPercent(50)).toBe(0);
    });

    it("converts 100% to 2.5", () => {
      expect(fromPercent(100)).toBe(2.5);
    });

    it("converts 0% to -2.5", () => {
      expect(fromPercent(0)).toBe(-2.5);
    });

    it("is the inverse of toPercent", () => {
      const values = [-2, -1, 0, 1, 2];
      for (const val of values) {
        expect(fromPercent(toPercent(val))).toBeCloseTo(val);
      }
    });
  });
});

describe("Geometry Calculations", () => {
  describe("distanceBetween", () => {
    it("returns 0 for same position", () => {
      expect(distanceBetween({ x: 1, y: 1 }, { x: 1, y: 1 })).toBe(0);
    });

    it("calculates horizontal distance", () => {
      expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 0 })).toBe(3);
    });

    it("calculates vertical distance", () => {
      expect(distanceBetween({ x: 0, y: 0 }, { x: 0, y: 4 })).toBe(4);
    });

    it("calculates diagonal distance (3-4-5 triangle)", () => {
      expect(distanceBetween({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
    });

    it("works with negative coordinates", () => {
      expect(distanceBetween({ x: -1, y: -1 }, { x: 2, y: 3 })).toBe(5);
    });
  });

  describe("angleBetween", () => {
    it("returns 0 for point to the right", () => {
      expect(angleBetween({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe(0);
    });

    it("returns PI/2 for point below", () => {
      expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: 1 })).toBeCloseTo(Math.PI / 2);
    });

    it("returns PI for point to the left", () => {
      expect(angleBetween({ x: 0, y: 0 }, { x: -1, y: 0 })).toBeCloseTo(Math.PI);
    });

    it("returns -PI/2 for point above", () => {
      expect(angleBetween({ x: 0, y: 0 }, { x: 0, y: -1 })).toBeCloseTo(-Math.PI / 2);
    });
  });

  describe("normalizeAngle", () => {
    it("keeps angles in [-PI, PI] unchanged", () => {
      expect(normalizeAngle(0)).toBe(0);
      expect(normalizeAngle(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    });

    it("normalizes angles > PI", () => {
      expect(normalizeAngle(Math.PI + 0.5)).toBeCloseTo(-Math.PI + 0.5);
    });

    it("normalizes angles < -PI", () => {
      expect(normalizeAngle(-Math.PI - 0.5)).toBeCloseTo(Math.PI - 0.5);
    });

    it("normalizes full rotations", () => {
      expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0);
      expect(normalizeAngle(-2 * Math.PI)).toBeCloseTo(0);
    });
  });
});

describe("Room/Wall Geometry", () => {
  describe("createWallsFromBounds", () => {
    it("creates 4 walls from bounds", () => {
      const bounds = { x: 0, y: 0, width: 2, height: 2 };
      const walls = createWallsFromBounds(bounds);
      expect(walls.length).toBe(4);
    });

    it("creates correct wall positions", () => {
      const bounds = { x: 0, y: 0, width: 2, height: 2 };
      const walls = createWallsFromBounds(bounds);

      // Top wall
      expect(walls[0].start).toEqual({ x: -1, y: -1 });
      expect(walls[0].end).toEqual({ x: 1, y: -1 });

      // Right wall
      expect(walls[1].start).toEqual({ x: 1, y: -1 });
      expect(walls[1].end).toEqual({ x: 1, y: 1 });

      // Bottom wall
      expect(walls[2].start).toEqual({ x: 1, y: 1 });
      expect(walls[2].end).toEqual({ x: -1, y: 1 });

      // Left wall
      expect(walls[3].start).toEqual({ x: -1, y: 1 });
      expect(walls[3].end).toEqual({ x: -1, y: -1 });
    });

    it("handles non-centered bounds", () => {
      const bounds = { x: 2, y: 3, width: 2, height: 2 };
      const walls = createWallsFromBounds(bounds);

      expect(walls[0].start).toEqual({ x: 1, y: 2 });
      expect(walls[0].end).toEqual({ x: 3, y: 2 });
    });
  });

  describe("createRoomFromCorners", () => {
    it("creates a room with correct bounds", () => {
      const room = createRoomFromCorners({ x: -1, y: -1 }, { x: 1, y: 1 }, "test-room", "#ff0000");

      expect(room.bounds.width).toBe(2);
      expect(room.bounds.height).toBe(2);
      expect(room.bounds.x).toBe(0);
      expect(room.bounds.y).toBe(0);
    });

    it("handles reversed corners", () => {
      const room = createRoomFromCorners({ x: 1, y: 1 }, { x: -1, y: -1 }, "test-room", "#ff0000");

      expect(room.bounds.width).toBe(2);
      expect(room.bounds.height).toBe(2);
    });

    it("uses default attenuation", () => {
      const room = createRoomFromCorners({ x: -1, y: -1 }, { x: 1, y: 1 }, "test-room", "#ff0000");

      expect(room.attenuation).toBe(DEFAULT_ATTENUATION);
    });

    it("accepts custom attenuation", () => {
      const room = createRoomFromCorners(
        { x: -1, y: -1 },
        { x: 1, y: 1 },
        "test-room",
        "#ff0000",
        0.8
      );

      expect(room.attenuation).toBe(0.8);
    });

    it("creates 4 walls", () => {
      const room = createRoomFromCorners({ x: -1, y: -1 }, { x: 1, y: 1 }, "test-room", "#ff0000");

      expect(room.walls.length).toBe(4);
    });

    it("calculates correct center", () => {
      const room = createRoomFromCorners({ x: 0, y: 0 }, { x: 2, y: 2 }, "test-room", "#ff0000");

      expect(room.center).toEqual({ x: 1, y: 1 });
    });
  });

  describe("isValidRoomSize", () => {
    it("returns true for rooms larger than MIN_ROOM_SIZE", () => {
      expect(isValidRoomSize({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(true);
    });

    it("returns false for rooms smaller than MIN_ROOM_SIZE", () => {
      const small = MIN_ROOM_SIZE / 2;
      expect(isValidRoomSize({ x: 0, y: 0 }, { x: small, y: small })).toBe(false);
    });

    it("returns false when only width is too small", () => {
      expect(isValidRoomSize({ x: 0, y: 0 }, { x: 0.1, y: 1 })).toBe(false);
    });

    it("returns false when only height is too small", () => {
      expect(isValidRoomSize({ x: 0, y: 0 }, { x: 1, y: 0.1 })).toBe(false);
    });

    it("handles negative coordinates correctly", () => {
      expect(isValidRoomSize({ x: -1, y: -1 }, { x: 1, y: 1 })).toBe(true);
    });
  });
});

describe("isSpeakerInsideRoom", () => {
  const createMockRoom = (x: number, y: number, width: number, height: number): DrawnRoom => ({
    id: "test-room",
    label: "Test Room",
    bounds: { x, y, width, height },
    walls: [],
    center: { x, y },
    color: "#ff0000",
    attenuation: 0.5,
  });

  const createMockSpeaker = (x: number, y: number): SpeakerState => ({
    id: "test-speaker",
    position: { x, y },
    facing: 0,
    color: "#00ff00",
    directivity: "cardioid",
    frequency: 440,
    sourceType: "oscillator",
  });

  it("returns true when speaker is at room center", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(0, 0);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(true);
  });

  it("returns true when speaker is inside room bounds", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(0.5, 0.5);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(true);
  });

  it("returns false when speaker is outside room (to the right)", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(2, 0);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(false);
  });

  it("returns false when speaker is outside room (to the left)", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(-2, 0);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(false);
  });

  it("returns false when speaker is outside room (above)", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(0, -2);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(false);
  });

  it("returns false when speaker is outside room (below)", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(0, 2);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(false);
  });

  it("returns true when speaker is exactly on room boundary", () => {
    const room = createMockRoom(0, 0, 2, 2);
    const speaker = createMockSpeaker(1, 0); // On right edge
    expect(isSpeakerInsideRoom(room, speaker)).toBe(true);
  });

  it("handles non-centered rooms", () => {
    const room = createMockRoom(5, 5, 2, 2);
    const speaker = createMockSpeaker(5, 5);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(true);
  });

  it("returns false for speaker outside non-centered room", () => {
    const room = createMockRoom(5, 5, 2, 2);
    const speaker = createMockSpeaker(0, 0);
    expect(isSpeakerInsideRoom(room, speaker)).toBe(false);
  });
});

describe("Collection Helpers", () => {
  describe("updateItemById", () => {
    interface TestItem {
      id: string;
      name: string;
      value: number;
    }

    const items: TestItem[] = [
      { id: "1", name: "first", value: 1 },
      { id: "2", name: "second", value: 2 },
      { id: "3", name: "third", value: 3 },
    ];

    it("updates the correct item", () => {
      const updated = updateItemById(items, "2", { name: "updated" });
      expect(updated[1].name).toBe("updated");
      expect(updated[1].value).toBe(2); // Unchanged
    });

    it("does not modify other items", () => {
      const updated = updateItemById(items, "2", { name: "updated" });
      expect(updated[0]).toEqual(items[0]);
      expect(updated[2]).toEqual(items[2]);
    });

    it("returns new array (immutable)", () => {
      const updated = updateItemById(items, "2", { name: "updated" });
      expect(updated).not.toBe(items);
    });

    it("handles non-existent id gracefully", () => {
      const updated = updateItemById(items, "999", { name: "nope" });
      expect(updated).toEqual(items);
    });

    it("can update multiple properties", () => {
      const updated = updateItemById(items, "1", { name: "new", value: 100 });
      expect(updated[0].name).toBe("new");
      expect(updated[0].value).toBe(100);
    });
  });
});
