/**
 * perf.ts - Simple performance monitoring utility
 *
 * Provides helpers for measuring code execution time using the Performance API.
 * Logs measurements using the perf-scoped logger.
 *
 * Usage:
 *   perf.mark("audio-init-start");
 *   // ... do work ...
 *   perf.measure("audio-init", "audio-init-start");
 *
 *   // Or use the helper for simple timing:
 *   const end = perf.start("load-settings");
 *   // ... do work ...
 *   end(); // Logs duration
 */
import { logger } from "./logger";

export const perf = {
  /**
   * Create a performance mark
   */
  mark: (name: string): PerformanceMark => {
    return performance.mark(name);
  },

  /**
   * Measure time between marks and log the result
   */
  measure: (name: string, startMark: string, endMark?: string): PerformanceMeasure => {
    const measure = performance.measure(name, startMark, endMark);
    logger.perf.debug(`${name}: ${measure.duration.toFixed(2)}ms`);
    return measure;
  },

  /**
   * Simple timing helper - returns a function to call when done
   * @example
   * const done = perf.start("my-operation");
   * // ... do work ...
   * done(); // Logs: "my-operation: 123.45ms"
   */
  start: (name: string): (() => number) => {
    const startMark = `${name}-start`;
    performance.mark(startMark);

    return () => {
      const endMark = `${name}-end`;
      performance.mark(endMark);
      const measure = performance.measure(name, startMark, endMark);
      logger.perf.debug(`${name}: ${measure.duration.toFixed(2)}ms`);

      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(endMark);
      performance.clearMeasures(name);

      return measure.duration;
    };
  },

  /**
   * Clear all performance entries
   */
  clear: (): void => {
    performance.clearMarks();
    performance.clearMeasures();
  },
};

export default perf;
