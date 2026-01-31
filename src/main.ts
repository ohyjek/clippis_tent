/**
 * main.ts - Electron main process entry point
 *
 * Runs in Node.js, responsible for:
 * - Creating the browser window
 * - Loading the renderer (index.html or dev server)
 * - Handling app lifecycle events (ready, quit, activate)
 *
 * This is the "backend" of the Electron app.
 */
import { app, BrowserWindow } from "electron";
import path from "node:path";
import started from "electron-squirrel-startup";
import { logger } from "./lib/logger.main";

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  logger.app.info("Squirrel startup detected, quitting");
  app.quit();
}

logger.app.info("App starting", {
  version: app.getVersion(),
  platform: process.platform,
});

const createWindow = () => {
  logger.window.info("Creating main window");

  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 2048,
    height: 2048,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    logger.window.debug("Loading dev server URL", {
      url: MAIN_WINDOW_VITE_DEV_SERVER_URL,
    });
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    const filePath = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    logger.window.debug("Loading file", { path: filePath });
    mainWindow.loadFile(filePath);
  }

  // Window lifecycle logging
  mainWindow.on("ready-to-show", () => {
    logger.window.info("Window ready to show");
  });

  mainWindow.on("closed", () => {
    logger.window.info("Window closed");
  });

  // Open the DevTools in development
  mainWindow.webContents.openDevTools();

  logger.window.info("Main window created");
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on("ready", () => {
  logger.app.info("App ready");
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  logger.app.info("All windows closed");
  if (process.platform !== "darwin") {
    logger.app.info("Quitting app (non-macOS)");
    app.quit();
  }
});

app.on("activate", () => {
  logger.app.info("App activated");
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  logger.app.info("App quitting");
});
