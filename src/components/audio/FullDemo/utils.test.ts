/**
 * utils.test.ts - Unit tests for demo-specific utility functions
 */

import { DEFAULT_ATTENUATION } from "@lib/spatial-utils";
import type { DrawnRoom } from "@tentchat/types";
import { describe, expect, it } from "vitest";
import { maxWallAttenuationAt } from "./utils";

/** Minimal DrawnRoom centered at (x, y) with the given size and attenuation */
function makeRoom(id: string, x: number, y: number, size: number, attenuation: number): DrawnRoom {
  return {
    id,
    label: id,
    bounds: { x, y, width: size, height: size },
    walls: [],
    center: { x, y },
    color: "#000000",
    attenuation,
  };
}

describe("maxWallAttenuationAt", () => {
  it("returns DEFAULT_ATTENUATION when the position is in no room", () => {
    const rooms = [makeRoom("a", 0, 0, 1, 0.9)];
    expect(maxWallAttenuationAt(rooms, [{ x: 2, y: 2 }])).toBe(DEFAULT_ATTENUATION);
  });

  it("returns the custom fallback when the position is in no room", () => {
    const rooms = [makeRoom("a", 0, 0, 1, 0.9)];
    expect(maxWallAttenuationAt(rooms, [{ x: 2, y: 2 }], 0.25)).toBe(0.25);
  });

  it("returns the fallback for an empty room list", () => {
    expect(maxWallAttenuationAt([], [{ x: 0, y: 0 }])).toBe(DEFAULT_ATTENUATION);
  });

  it("returns the room's attenuation when the position is in exactly one room", () => {
    const rooms = [makeRoom("a", 0, 0, 1, 0.3), makeRoom("b", 2, 2, 1, 0.9)];
    expect(maxWallAttenuationAt(rooms, [{ x: 0, y: 0 }])).toBe(0.3);
  });

  it("uses the maximum attenuation across overlapping rooms", () => {
    // Inner fully-blocking room must not be diluted by a weaker outer room
    const rooms = [makeRoom("outer", 0, 0, 4, 0.2), makeRoom("inner", 0, 0, 1, 1)];
    expect(maxWallAttenuationAt(rooms, [{ x: 0, y: 0 }])).toBe(1);
  });

  it("uses the maximum attenuation across multiple positions", () => {
    // Rooms containing ANY given position count (e.g. listener and source)
    const rooms = [makeRoom("a", -2, -2, 1, 0.4), makeRoom("b", 2, 2, 1, 0.7)];
    const positions = [
      { x: -2, y: -2 },
      { x: 2, y: 2 },
    ];
    expect(maxWallAttenuationAt(rooms, positions)).toBe(0.7);
  });

  it("does not apply the fallback when only some positions are outside all rooms", () => {
    const rooms = [makeRoom("a", 0, 0, 1, 0.3)];
    const positions = [
      { x: 0, y: 0 },
      { x: 2, y: 2 },
    ];
    // 0.3 from room "a" wins even though it is below DEFAULT_ATTENUATION (0.5)
    expect(maxWallAttenuationAt(rooms, positions)).toBe(0.3);
  });

  it("clamps room attenuation above 1 down to 1", () => {
    const rooms = [makeRoom("a", 0, 0, 1, 1.5)];
    expect(maxWallAttenuationAt(rooms, [{ x: 0, y: 0 }])).toBe(1);
  });

  it("clamps negative room attenuation up to 0", () => {
    const rooms = [makeRoom("a", 0, 0, 1, -0.5)];
    expect(maxWallAttenuationAt(rooms, [{ x: 0, y: 0 }])).toBe(0);
  });
});
