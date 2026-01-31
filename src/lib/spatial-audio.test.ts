/**
 * spatial-audio.test.ts - Unit tests for spatial audio utilities
 *
 * Tests all functions in spatial-audio.ts:
 * - Distance calculations
 * - Volume attenuation
 * - Stereo panning
 * - Directional gain (cardioid pattern)
 * - Wall intersection detection
 * - Room creation
 *
 * Run with: pnpm test
 */
import { describe, it, expect } from "vitest";
import {
  calculateDistance,
  calculateVolume,
  calculatePan,
  calculateSpatialParams,
  randomPosition,
  randomFrequency,
  createSoundSource,
  calculateAngleToPoint,
  normalizeAngle,
  calculateDirectionalGain,
  lineIntersectsWall,
  countWallsBetween,
  calculateWallAttenuation,
  createRectangularRoom,
  createSpeaker,
  SOUND_FREQUENCIES,
  CARDINAL_DIRECTIONS,
  SPEAKER_COLORS,
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

  describe("calculateDirectionalGain", () => {
    it("returns 1.0 when facing directly toward listener", () => {
      const speakerPos = { x: 0, y: 0 };
      const listenerPos = { x: 1, y: 0 };
      const facing = 0; // Facing right, toward listener
      expect(calculateDirectionalGain(facing, speakerPos, listenerPos)).toBeCloseTo(1.0);
    });

    it("returns ~0 when facing directly away from listener", () => {
      const speakerPos = { x: 0, y: 0 };
      const listenerPos = { x: 1, y: 0 };
      const facing = Math.PI; // Facing left, away from listener
      expect(calculateDirectionalGain(facing, speakerPos, listenerPos)).toBeCloseTo(0);
    });

    it("returns 0.5 when facing perpendicular to listener", () => {
      const speakerPos = { x: 0, y: 0 };
      const listenerPos = { x: 1, y: 0 };
      const facing = Math.PI / 2; // Facing down, perpendicular
      expect(calculateDirectionalGain(facing, speakerPos, listenerPos)).toBeCloseTo(0.5);
    });

    it("returns values between 0 and 1", () => {
      const speakerPos = { x: 0, y: 0 };
      const listenerPos = { x: 1, y: 1 };

      for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
        const gain = calculateDirectionalGain(angle, speakerPos, listenerPos);
        expect(gain).toBeGreaterThanOrEqual(0);
        expect(gain).toBeLessThanOrEqual(1);
      }
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

  describe("createRectangularRoom", () => {
    it("creates a room with 4 walls", () => {
      const room = createRectangularRoom({ x: 0, y: 0 }, 2, 2, "test-room");
      expect(room.walls).toHaveLength(4);
    });

    it("creates walls at correct positions", () => {
      const room = createRectangularRoom({ x: 0, y: 0 }, 2, 2, "test-room");

      // Check that walls form a closed rectangle
      const wallEnds = room.walls.flatMap((w) => [w.start, w.end]);
      const corners = [
        { x: -1, y: -1 },
        { x: 1, y: -1 },
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ];

      corners.forEach((corner) => {
        const hasCorner = wallEnds.some(
          (p) => Math.abs(p.x - corner.x) < 0.01 && Math.abs(p.y - corner.y) < 0.01
        );
        expect(hasCorner).toBe(true);
      });
    });

    it("stores room id and label", () => {
      const room = createRectangularRoom({ x: 0, y: 0 }, 2, 2, "my-room", "My Room");
      expect(room.id).toBe("my-room");
      expect(room.label).toBe("My Room");
    });
  });

  describe("createSpeaker", () => {
    it("creates a speaker with valid properties", () => {
      const speaker = createSpeaker();
      expect(speaker).toHaveProperty("id");
      expect(speaker).toHaveProperty("position");
      expect(speaker).toHaveProperty("facing");
      expect(speaker).toHaveProperty("color");
    });

    it("uses provided id", () => {
      const speaker = createSpeaker("custom-speaker");
      expect(speaker.id).toBe("custom-speaker");
    });

    it("assigns colors based on index", () => {
      const speaker0 = createSpeaker(undefined, 0);
      const speaker1 = createSpeaker(undefined, 1);
      expect(speaker0.color).toBe(SPEAKER_COLORS[0]);
      expect(speaker1.color).toBe(SPEAKER_COLORS[1]);
    });

    it("wraps color index for large values", () => {
      const speaker = createSpeaker(undefined, SPEAKER_COLORS.length);
      expect(speaker.color).toBe(SPEAKER_COLORS[0]);
    });

    it("initializes facing to 0 (right)", () => {
      const speaker = createSpeaker();
      expect(speaker.facing).toBe(0);
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
