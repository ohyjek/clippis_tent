/**
 * spatial-audio-engine.test.ts - Tests for advanced spatial audio engine
 */
import { describe, it, expect } from "vitest";
import {
  calculateDirectivityGain,
  calculateDistanceAttenuation,
  calculateStereoPan,
  calculateListenerDirectionalGain,
  calculateAudioParameters,
  createSourceConfig,
  createListener,
} from "@lib/spatial-audio-engine";

describe("Directivity Patterns", () => {
  describe("omnidirectional", () => {
    it("returns 1.0 regardless of angle", () => {
      expect(calculateDirectivityGain("omnidirectional", 0)).toBe(1.0);
      expect(calculateDirectivityGain("omnidirectional", Math.PI)).toBe(1.0);
      expect(calculateDirectivityGain("omnidirectional", Math.PI / 2)).toBe(1.0);
    });
  });

  describe("cardioid", () => {
    it("returns 1.0 when facing listener (0 degrees)", () => {
      expect(calculateDirectivityGain("cardioid", 0)).toBeCloseTo(1.0);
    });

    it("returns 0.5 at 90 degrees", () => {
      expect(calculateDirectivityGain("cardioid", Math.PI / 2)).toBeCloseTo(0.5);
    });

    it("returns 0.0 when facing away (180 degrees)", () => {
      expect(calculateDirectivityGain("cardioid", Math.PI)).toBeCloseTo(0.0);
    });
  });

  describe("supercardioid", () => {
    it("returns 1.0 when facing listener", () => {
      expect(calculateDirectivityGain("supercardioid", 0)).toBeCloseTo(1.0);
    });

    it("returns less than cardioid at 90 degrees", () => {
      const superGain = calculateDirectivityGain("supercardioid", Math.PI / 2);
      const cardioidGain = calculateDirectivityGain("cardioid", Math.PI / 2);
      expect(superGain).toBeLessThan(cardioidGain);
    });
  });

  describe("hypercardioid", () => {
    it("returns 1.0 when facing listener", () => {
      expect(calculateDirectivityGain("hypercardioid", 0)).toBeCloseTo(1.0);
    });

    it("returns near zero at 90 degrees", () => {
      expect(calculateDirectivityGain("hypercardioid", Math.PI / 2)).toBeCloseTo(0.25);
    });
  });

  describe("figure8", () => {
    it("returns 1.0 at front", () => {
      expect(calculateDirectivityGain("figure8", 0)).toBeCloseTo(1.0);
    });

    it("returns 0.0 at 90 degrees", () => {
      expect(calculateDirectivityGain("figure8", Math.PI / 2)).toBeCloseTo(0.0);
    });

    it("returns 1.0 at back (180 degrees)", () => {
      expect(calculateDirectivityGain("figure8", Math.PI)).toBeCloseTo(1.0);
    });
  });

  describe("hemisphere", () => {
    it("returns 1.0 at front", () => {
      expect(calculateDirectivityGain("hemisphere", 0)).toBeCloseTo(1.0);
    });

    it("returns 0.0 at 90 degrees", () => {
      expect(calculateDirectivityGain("hemisphere", Math.PI / 2)).toBeCloseTo(0.0);
    });

    it("returns 0.0 behind", () => {
      expect(calculateDirectivityGain("hemisphere", Math.PI)).toBe(0.0);
      expect(calculateDirectivityGain("hemisphere", -Math.PI / 2 - 0.1)).toBe(0.0);
    });
  });
});

describe("Distance Attenuation Models", () => {
  describe("linear", () => {
    it("returns 1.0 at reference distance", () => {
      expect(calculateDistanceAttenuation(1, "linear", 1, 10)).toBeCloseTo(1.0);
    });

    it("returns 0.5 at midpoint", () => {
      expect(calculateDistanceAttenuation(5.5, "linear", 1, 10)).toBeCloseTo(0.5);
    });

    it("returns 0.0 at max distance", () => {
      expect(calculateDistanceAttenuation(10, "linear", 1, 10)).toBeCloseTo(0.0);
    });

    it("clamps to 0 beyond max distance", () => {
      expect(calculateDistanceAttenuation(15, "linear", 1, 10)).toBe(0.0);
    });
  });

  describe("inverse", () => {
    it("returns 1.0 at reference distance", () => {
      expect(calculateDistanceAttenuation(1, "inverse", 1)).toBeCloseTo(1.0);
    });

    it("returns 0.5 at 2x reference distance", () => {
      expect(calculateDistanceAttenuation(2, "inverse", 1)).toBeCloseTo(0.5);
    });

    it("approaches 0 at large distances", () => {
      expect(calculateDistanceAttenuation(100, "inverse", 1)).toBeLessThan(0.02);
    });
  });

  describe("exponential", () => {
    it("returns 1.0 at reference distance", () => {
      expect(calculateDistanceAttenuation(1, "exponential", 1)).toBeCloseTo(1.0);
    });

    it("follows exponential decay", () => {
      const at2 = calculateDistanceAttenuation(2, "exponential", 1, 10, 2);
      expect(at2).toBeCloseTo(0.25); // (1/2)^2
    });
  });
});

describe("Stereo Pan", () => {
  const listener = createListener({ x: 0, y: 0 }, 0); // Facing right

  it("pans right for source on the right", () => {
    const pan = calculateStereoPan(listener, { x: 2, y: 0 });
    expect(pan).toBeCloseTo(0, 1); // In front = center
  });

  it("pans left for source on the left", () => {
    const pan = calculateStereoPan(listener, { x: -2, y: 0 });
    expect(pan).toBeCloseTo(0, 1); // Behind = center (flipped)
  });

  it("pans right for source to the right side", () => {
    const pan = calculateStereoPan(listener, { x: 0, y: 2 });
    expect(pan).toBeGreaterThan(0); // To listener's right
  });

  it("pans left for source to the left side", () => {
    const pan = calculateStereoPan(listener, { x: 0, y: -2 });
    expect(pan).toBeLessThan(0); // To listener's left
  });

  it("accounts for listener facing direction", () => {
    const facingDown = createListener({ x: 0, y: 0 }, Math.PI / 2);
    const panRight = calculateStereoPan(facingDown, { x: -2, y: 0 });
    const panLeft = calculateStereoPan(facingDown, { x: 2, y: 0 });
    expect(panRight).toBeGreaterThan(0); // Now on right
    expect(panLeft).toBeLessThan(0); // Now on left
  });
});

describe("Listener Directional Hearing", () => {
  // Default minGain is 0.3, so the formula is: minGain + (1 - minGain) * rawGain
  // where rawGain = 0.5 + 0.5 * cos(angle)
  const DEFAULT_MIN_GAIN = 0.3;

  it("returns 1.0 when source is directly in front", () => {
    const listener = createListener({ x: 0, y: 0 }, 0); // Facing right
    const gain = calculateListenerDirectionalGain(listener, { x: 2, y: 0 });
    expect(gain).toBeCloseTo(1.0);
  });

  it("returns ~0.65 when source is at 90 degrees (to the side)", () => {
    const listener = createListener({ x: 0, y: 0 }, 0); // Facing right
    const gain = calculateListenerDirectionalGain(listener, { x: 0, y: 2 });
    // rawGain = 0.5 + 0.5*cos(90°) = 0.5
    // gain = 0.3 + 0.7 * 0.5 = 0.65
    expect(gain).toBeCloseTo(DEFAULT_MIN_GAIN + (1 - DEFAULT_MIN_GAIN) * 0.5);
  });

  it("returns minGain when source is directly behind", () => {
    const listener = createListener({ x: 0, y: 0 }, 0); // Facing right
    const gain = calculateListenerDirectionalGain(listener, { x: -2, y: 0 });
    // rawGain = 0.5 + 0.5*cos(180°) = 0
    // gain = minGain (sounds behind are still audible!)
    expect(gain).toBeCloseTo(DEFAULT_MIN_GAIN);
  });

  it("returns ~0.825 when listener faces source at 60 degrees", () => {
    const listener = createListener({ x: 0, y: 0 }, 0); // Facing right
    // Source at 60 degrees from facing direction
    const gain = calculateListenerDirectionalGain(listener, {
      x: Math.cos(Math.PI / 3), // 0.5
      y: Math.sin(Math.PI / 3), // ~0.866
    });
    // rawGain = 0.5 + 0.5*cos(60°) = 0.5 + 0.25 = 0.75
    // gain = 0.3 + 0.7 * 0.75 = 0.825
    expect(gain).toBeCloseTo(DEFAULT_MIN_GAIN + (1 - DEFAULT_MIN_GAIN) * 0.75);
  });

  it("updates correctly when listener rotates", () => {
    const sourcePos = { x: 2, y: 0 };

    // Facing toward source
    const facingSource = createListener({ x: 0, y: 0 }, 0);
    const gainFront = calculateListenerDirectionalGain(facingSource, sourcePos);

    // Facing away from source
    const facingAway = createListener({ x: 0, y: 0 }, Math.PI);
    const gainBack = calculateListenerDirectionalGain(facingAway, sourcePos);

    expect(gainFront).toBeCloseTo(1.0);
    expect(gainBack).toBeCloseTo(DEFAULT_MIN_GAIN); // Still audible behind
  });

  it("respects custom minGain parameter", () => {
    const listener = createListener({ x: 0, y: 0 }, 0);
    const sourcePos = { x: -2, y: 0 }; // Behind listener

    const gainDefault = calculateListenerDirectionalGain(listener, sourcePos);
    const gainCustom = calculateListenerDirectionalGain(listener, sourcePos, 0.5);

    expect(gainDefault).toBeCloseTo(0.3);
    expect(gainCustom).toBeCloseTo(0.5);
  });
});

describe("calculateAudioParameters", () => {
  const source = createSourceConfig("test", {
    position: { x: 2, y: 0 },
    facing: Math.PI, // Facing left (toward origin)
    directivity: "cardioid",
    volume: 1,
  });
  const listener = createListener({ x: 0, y: 0 }, 0);

  it("calculates distance correctly", () => {
    const params = calculateAudioParameters(source, listener);
    expect(params.distance).toBeCloseTo(2);
  });

  it("includes directional gain", () => {
    const params = calculateAudioParameters(source, listener);
    expect(params.directionalGain).toBeGreaterThan(0);
    expect(params.directionalGain).toBeLessThanOrEqual(1);
  });

  it("applies wall attenuation", () => {
    const wall = { start: { x: 1, y: -2 }, end: { x: 1, y: 2 } };
    const paramsNoWall = calculateAudioParameters(source, listener, []);
    const paramsWithWall = calculateAudioParameters(source, listener, [wall]);

    expect(paramsWithWall.wallCount).toBe(1);
    expect(paramsWithWall.wallAttenuation).toBeLessThan(1);
    expect(paramsWithWall.volume).toBeLessThan(paramsNoWall.volume);
  });

  it("respects master volume", () => {
    const paramsHalf = calculateAudioParameters(source, listener, [], {
      distanceModel: "inverse",
      masterVolume: 0.5,
    });
    const paramsFull = calculateAudioParameters(source, listener, [], {
      distanceModel: "inverse",
      masterVolume: 1.0,
    });
    expect(paramsHalf.volume).toBeLessThan(paramsFull.volume);
  });
});
