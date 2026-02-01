/**
 * test/setup.ts - Global test setup for app tests
 *
 * Provides common mocks for Electron-specific modules that don't work in jsdom.
 * This file is loaded before each test file via vitest.config.ts setupFiles.
 */
import { vi } from "vitest";

// Mock electron-log (doesn't work outside Electron)

vi.mock("@lib/logger", () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  },
}));

// Mock electron-specific APIs that might be imported
vi.mock("electron", () => ({
  ipcRenderer: {
    on: vi.fn(),
    send: vi.fn(),
    invoke: vi.fn(),
  },
}));
