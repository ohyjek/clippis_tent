/**
 * preload.ts - Electron preload script
 *
 * Runs before the renderer loads, with access to Node.js APIs.
 * Use contextBridge to safely expose APIs to the renderer.
 *
 * @see https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts
 */
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getHardwareAccelerationDisabled: () =>
    ipcRenderer.invoke("settings:getHardwareAccelerationDisabled"),
  setHardwareAccelerationDisabled: (disabled: boolean) =>
    ipcRenderer.invoke("settings:setHardwareAccelerationDisabled", disabled),
});
