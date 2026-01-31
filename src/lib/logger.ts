/**
 * logger.ts - Structured logging utility
 *
 * Wraps electron-log to provide:
 * - File logging (persisted to disk)
 * - Console logging with environment-based levels
 * - Scoped loggers for different modules (audio, ui, store)
 *
 * Usage:
 *   import { logger } from "@/lib/logger";
 *   logger.info("App started");
 *   logger.audio.debug("Playing sound", { freq: 440 });
 */
import log from "electron-log/renderer";

// Configure log levels based on environment
// In dev: show all logs in console
// In prod: only warnings and errors to console, but everything to file
log.transports.console.level = "debug"; // Vite handles dev/prod
if (log.transports.file) {
  log.transports.file.level = "info";
}

// Format logs with timestamps
log.transports.console.format = "[{level}] {text}";

/**
 * Main logger with scoped sub-loggers for different modules.
 * Use scoped loggers for easier filtering in log files.
 */
export const logger = {
  // Standard log levels
  debug: log.debug.bind(log),
  info: log.info.bind(log),
  warn: log.warn.bind(log),
  error: log.error.bind(log),

  // Scoped loggers for specific modules
  audio: log.scope("audio"),
  ui: log.scope("ui"),
  store: log.scope("store"),
  perf: log.scope("perf"),
};

export default logger;
