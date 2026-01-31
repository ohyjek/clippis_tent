/**
 * vitest.d.ts - Type definitions for jest-dom matchers
 */
/// <reference types="@testing-library/jest-dom" />

import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

declare module "vitest" {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type Assertion<T = any> = TestingLibraryMatchers<T, void>;
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, void> {}
}
