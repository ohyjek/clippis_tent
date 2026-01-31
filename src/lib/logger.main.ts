/**
 * logger.main.ts - Logger for Electron main process
 *
 * Separate import for main process since it uses different transport.
 * Use this in src/main.ts and other main process files.
 *
 * Usage:
 *   import { logger } from "./lib/logger.main";
 *   logger.info("App started");
 */
import log from "electron-log/main";

// Configure file transport
log.transports.file.level = "info";
log.transports.file.maxSize = 5 * 1024 * 1024; // 5MB max file size
log.transports.console.level = "debug";
log.transports.console.format = "[{level}] {text}";

// Initialize file logging
log.initialize();

/**
 * Main process logger with scoped sub-loggers.
 */
export const logger = {
  debug: log.debug.bind(log),
  info: log.info.bind(log),
  warn: log.warn.bind(log),
  error: log.error.bind(log),

  // Scoped loggers
  app: log.scope("app"),
  window: log.scope("window"),
};

export default logger;
