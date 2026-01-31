import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  calculateVolume,
  calculatePan,
  calculateSpatialParams,
  randomPosition,
  randomFrequency,
  createSoundSource,
  SOUND_FREQUENCIES,
  CARDINAL_DIRECTIONS,
} from "./spatial-audio";

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

  describe("calculateVolume", () => {
    it("returns 0.3 at distance 0 with default params", () => {
      // volume = 1/(1+0) * 1 * 0.3 = 0.3
      expect(calculateVolume(0)).toBeCloseTo(0.3);
    });

    it("returns 0.15 at distance 1 with default params", () => {
      // volume = 1/(1+1) * 1 * 0.3 = 0.15
      expect(calculateVolume(1)).toBeCloseTo(0.15);
    });

    it("decreases with distance (inverse relationship)", () => {
      const vol0 = calculateVolume(0);
      const vol1 = calculateVolume(1);
      const vol2 = calculateVolume(2);
      const vol5 = calculateVolume(5);

      expect(vol0).toBeGreaterThan(vol1);
      expect(vol1).toBeGreaterThan(vol2);
      expect(vol2).toBeGreaterThan(vol5);
    });

    it("scales with master volume", () => {
      const fullVolume = calculateVolume(1, 1);
      const halfVolume = calculateVolume(1, 0.5);

      expect(halfVolume).toBeCloseTo(fullVolume * 0.5);
    });

    it("clamps to 0-1 range", () => {
      // Even with very close distance and high master volume
      const vol = calculateVolume(0, 10, 1);
      expect(vol).toBeLessThanOrEqual(1);
      expect(vol).toBeGreaterThanOrEqual(0);
    });
  });

  describe("calculatePan", () => {
    it("returns 0 when directly in front (dx = 0)", () => {
      expect(calculatePan(0)).toBe(0);
    });

    it("returns positive (right) for positive dx", () => {
      expect(calculatePan(1)).toBeGreaterThan(0);
    });

    it("returns negative (left) for negative dx", () => {
      expect(calculatePan(-1)).toBeLessThan(0);
    });

    it("clamps to -1 for far left", () => {
      expect(calculatePan(-10)).toBe(-1);
    });

    it("clamps to 1 for far right", () => {
      expect(calculatePan(10)).toBe(1);
    });

    it("returns correct pan for moderate offset", () => {
      // With default panWidth of 3, dx=1.5 should give 0.5
      expect(calculatePan(1.5)).toBeCloseTo(0.5);
    });

    it("respects custom pan width", () => {
      // With panWidth of 2, dx=1 should give 0.5
      expect(calculatePan(1, 2)).toBeCloseTo(0.5);
    });
  });

  describe("calculateSpatialParams", () => {
    it("returns correct params for same position", () => {
      const listener = { x: 0, y: 0 };
      const source = { x: 0, y: 0 };
      const params = calculateSpatialParams(listener, source);

      expect(params.distance).toBe(0);
      expect(params.pan).toBe(0);
      expect(params.volume).toBeCloseTo(0.3);
    });

    it("returns correct params for source to the right", () => {
      const listener = { x: 0, y: 0 };
      const source = { x: 3, y: 0 };
      const params = calculateSpatialParams(listener, source);

      expect(params.distance).toBe(3);
      expect(params.pan).toBe(1); // 3/3 = 1 (clamped)
      expect(params.volume).toBeLessThan(0.3);
    });

    it("returns correct params for source to the left", () => {
      const listener = { x: 0, y: 0 };
      const source = { x: -3, y: 0 };
      const params = calculateSpatialParams(listener, source);

      expect(params.distance).toBe(3);
      expect(params.pan).toBe(-1); // -3/3 = -1 (clamped)
    });

    it("scales volume with master volume parameter", () => {
      const listener = { x: 0, y: 0 };
      const source = { x: 1, y: 0 };

      const fullParams = calculateSpatialParams(listener, source, 1);
      const halfParams = calculateSpatialParams(listener, source, 0.5);

      expect(halfParams.volume).toBeCloseTo(fullParams.volume * 0.5);
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

  describe("CARDINAL_DIRECTIONS", () => {
    it("has 4 directions", () => {
      expect(CARDINAL_DIRECTIONS).toHaveLength(4);
    });

    it("includes left, right, front, and back", () => {
      const names = CARDINAL_DIRECTIONS.map((d) => d.name);
      expect(names).toContain("Left");
      expect(names).toContain("Right");
      expect(names).toContain("Front");
      expect(names).toContain("Back");
    });

    it("left is at negative x", () => {
      const left = CARDINAL_DIRECTIONS.find((d) => d.name === "Left");
      expect(left?.x).toBeLessThan(0);
      expect(left?.y).toBe(0);
    });

    it("right is at positive x", () => {
      const right = CARDINAL_DIRECTIONS.find((d) => d.name === "Right");
      expect(right?.x).toBeGreaterThan(0);
      expect(right?.y).toBe(0);
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
});
