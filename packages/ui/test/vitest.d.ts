/**
 * vitest.d.ts - Type definitions for jest-dom matchers
 */
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  // biome-ignore lint/suspicious/noExplicitAny: must match vitest's own Assertion<T = any> signature
  type Assertion<T = any> = TestingLibraryMatchers<T, void>;
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
