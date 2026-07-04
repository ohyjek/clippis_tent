/**
 * spatial-audio.test.ts - Unit tests for spatial audio utilities
 *
 * Tests all functions in spatial-audio.ts:
 * - Distance and angle calculations
 * - Wall intersection detection and attenuation
 * - Sound source creation helpers
 *
 * Run with: pnpm test
 */

import {
  calculateAngleToPoint,
  calculateDistance,
  calculateWallAttenuation,
  countWallsBetween,
  createSoundSource,
  lineIntersectsWall,
  normalizeAngle,
  randomFrequency,
  randomPosition,
  SOUND_FREQUENCIES,
  SPEAKER_COLORS,
} from "@lib/spatial-audio";
import { describe, expect, it } from "vitest";

describe("spatial-audio utilities", () => {
  describe("calculateDistance", () => {
    it("returns 0 for same positions", () => {
      const pos = { x: 0, y: 0 };
      expect(calculateDistance(pos, pos)).toBe(0);
    });

    it("calculates distance correctly for horizontal offset", () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 0 };
      expect(calculateDistance(pos1, pos2)).toBe(3);
    });

    it("calculates distance correctly for vertical offset", () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 0, y: 4 };
      expect(calculateDistance(pos1, pos2)).toBe(4);
    });

    it("calculates distance correctly for diagonal (3-4-5 triangle)", () => {
      const pos1 = { x: 0, y: 0 };
      const pos2 = { x: 3, y: 4 };
      expect(calculateDistance(pos1, pos2)).toBe(5);
    });

    it("handles negative coordinates", () => {
      const pos1 = { x: -1, y: -1 };
      const pos2 = { x: 2, y: 3 };
      expect(calculateDistance(pos1, pos2)).toBe(5);
    });
  });

  describe("randomPosition", () => {
    it("generates position within default range (-2 to 2)", () => {
      for (let i = 0; i < 100; i++) {
        const pos = randomPosition();
        expect(pos.x).toBeGreaterThanOrEqual(-2);
        expect(pos.x).toBeLessThanOrEqual(2);
        expect(pos.y).toBeGreaterThanOrEqual(-2);
        expect(pos.y).toBeLessThanOrEqual(2);
      }
    });

    it("generates position within custom range", () => {
      for (let i = 0; i < 100; i++) {
        const pos = randomPosition(5);
        expect(pos.x).toBeGreaterThanOrEqual(-5);
        expect(pos.x).toBeLessThanOrEqual(5);
        expect(pos.y).toBeGreaterThanOrEqual(-5);
        expect(pos.y).toBeLessThanOrEqual(5);
      }
    });
  });

  describe("randomFrequency", () => {
    it("returns a frequency from the SOUND_FREQUENCIES array", () => {
      for (let i = 0; i < 100; i++) {
        const freq = randomFrequency();
        expect(SOUND_FREQUENCIES).toContain(freq);
      }
    });
  });

  describe("createSoundSource", () => {
    it("creates a sound source with valid properties", () => {
      const source = createSoundSource();

      expect(source).toHaveProperty("id");
      expect(source).toHaveProperty("position");
      expect(source).toHaveProperty("frequency");
      expect(source.id).toMatch(/^sound-/);
      expect(source.position.x).toBeGreaterThanOrEqual(-2);
      expect(source.position.x).toBeLessThanOrEqual(2);
      expect(SOUND_FREQUENCIES).toContain(source.frequency);
    });

    it("uses provided id", () => {
      const source = createSoundSource("custom-id");
      expect(source.id).toBe("custom-id");
    });

    it("generates unique ids", () => {
      const ids = new Set<string>();
      for (let i = 0; i < 100; i++) {
        const source = createSoundSource();
        expect(ids.has(source.id)).toBe(false);
        ids.add(source.id);
      }
    });
  });

  describe("SOUND_FREQUENCIES", () => {
    it("has 8 frequencies", () => {
      expect(SOUND_FREQUENCIES).toHaveLength(8);
    });

    it("contains musical note frequencies in audible range", () => {
      SOUND_FREQUENCIES.forEach((freq) => {
        expect(freq).toBeGreaterThan(200);
        expect(freq).toBeLessThan(1000);
      });
    });

    it("is sorted in ascending order", () => {
      for (let i = 1; i < SOUND_FREQUENCIES.length; i++) {
        expect(SOUND_FREQUENCIES[i]).toBeGreaterThan(SOUND_FREQUENCIES[i - 1]);
      }
    });
  });

  describe("calculateAngleToPoint", () => {
    it("returns 0 for point directly to the right", () => {
      const from = { x: 0, y: 0 };
      const to = { x: 1, y: 0 };
      expect(calculateAngleToPoint(from, to)).toBeCloseTo(0);
    });

    it("returns PI/2 for point directly below", () => {
      const from = { x: 0, y: 0 };
      const to = { x: 0, y: 1 };
      expect(calculateAngleToPoint(from, to)).toBeCloseTo(Math.PI / 2);
    });

    it("returns PI for point directly to the left", () => {
      const from = { x: 0, y: 0 };
      const to = { x: -1, y: 0 };
      expect(Math.abs(calculateAngleToPoint(from, to))).toBeCloseTo(Math.PI);
    });

    it("returns -PI/2 for point directly above", () => {
      const from = { x: 0, y: 0 };
      const to = { x: 0, y: -1 };
      expect(calculateAngleToPoint(from, to)).toBeCloseTo(-Math.PI / 2);
    });

    it("returns PI/4 for diagonal (down-right)", () => {
      const from = { x: 0, y: 0 };
      const to = { x: 1, y: 1 };
      expect(calculateAngleToPoint(from, to)).toBeCloseTo(Math.PI / 4);
    });
  });

  describe("normalizeAngle", () => {
    it("returns same angle for values within range", () => {
      expect(normalizeAngle(0)).toBeCloseTo(0);
      expect(normalizeAngle(Math.PI / 2)).toBeCloseTo(Math.PI / 2);
      expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo(-Math.PI / 2);
    });

    it("normalizes angles greater than PI", () => {
      expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
      expect(normalizeAngle(2.5 * Math.PI)).toBeCloseTo(0.5 * Math.PI);
    });

    it("normalizes angles less than -PI", () => {
      expect(normalizeAngle(-3 * Math.PI)).toBeCloseTo(-Math.PI);
      expect(normalizeAngle(-2.5 * Math.PI)).toBeCloseTo(-0.5 * Math.PI);
    });
  });

  describe("lineIntersectsWall", () => {
    const horizontalWall = { start: { x: -1, y: 0 }, end: { x: 1, y: 0 } };
    const verticalWall = { start: { x: 0, y: -1 }, end: { x: 0, y: 1 } };

    it("returns true when line crosses horizontal wall", () => {
      const p1 = { x: 0, y: -1 };
      const p2 = { x: 0, y: 1 };
      expect(lineIntersectsWall(p1, p2, horizontalWall)).toBe(true);
    });

    it("returns true when line crosses vertical wall", () => {
      const p1 = { x: -1, y: 0 };
      const p2 = { x: 1, y: 0 };
      expect(lineIntersectsWall(p1, p2, verticalWall)).toBe(true);
    });

    it("returns false when line does not cross wall", () => {
      const p1 = { x: 2, y: 2 };
      const p2 = { x: 3, y: 3 };
      expect(lineIntersectsWall(p1, p2, horizontalWall)).toBe(false);
    });

    it("returns false when line is parallel to wall", () => {
      const p1 = { x: -2, y: 1 };
      const p2 = { x: 2, y: 1 };
      expect(lineIntersectsWall(p1, p2, horizontalWall)).toBe(false);
    });
  });

  describe("countWallsBetween", () => {
    it("returns 0 when no walls between points", () => {
      const walls = [{ start: { x: 10, y: 10 }, end: { x: 11, y: 10 } }];
      expect(countWallsBetween({ x: 0, y: 0 }, { x: 1, y: 1 }, walls)).toBe(0);
    });

    it("returns 1 when one wall between points", () => {
      const walls = [{ start: { x: 0.5, y: -1 }, end: { x: 0.5, y: 1 } }];
      expect(countWallsBetween({ x: 0, y: 0 }, { x: 1, y: 0 }, walls)).toBe(1);
    });

    it("returns correct count for multiple walls", () => {
      const walls = [
        { start: { x: 1, y: -1 }, end: { x: 1, y: 1 } },
        { start: { x: 2, y: -1 }, end: { x: 2, y: 1 } },
        { start: { x: 3, y: -1 }, end: { x: 3, y: 1 } },
      ];
      expect(countWallsBetween({ x: 0, y: 0 }, { x: 4, y: 0 }, walls)).toBe(3);
    });
  });

  describe("calculateWallAttenuation", () => {
    it("returns 1.0 for 0 walls", () => {
      expect(calculateWallAttenuation(0)).toBe(1);
    });

    it("returns 0.3 for 1 wall with default attenuation", () => {
      expect(calculateWallAttenuation(1)).toBeCloseTo(0.3);
    });

    it("returns 0.09 for 2 walls with default attenuation", () => {
      expect(calculateWallAttenuation(2)).toBeCloseTo(0.09);
    });

    it("respects custom attenuation factor", () => {
      expect(calculateWallAttenuation(1, 0.5)).toBeCloseTo(0.5);
      expect(calculateWallAttenuation(2, 0.5)).toBeCloseTo(0.25);
    });
  });

  describe("SPEAKER_COLORS", () => {
    it("has at least 4 colors", () => {
      expect(SPEAKER_COLORS.length).toBeGreaterThanOrEqual(4);
    });

    it("contains valid hex color strings", () => {
      SPEAKER_COLORS.forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });
});
