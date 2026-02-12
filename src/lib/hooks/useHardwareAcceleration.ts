import { createSignal, onMount } from "solid-js";

/**
 * Hook for hardware acceleration preference (saved to settings.json, applied on next launch).
 * In Electron: syncs with main process via IPC. Outside Electron: local state only.
 * Value is "enabled" (true = HA on, false = HA off).
 */
function useHardwareAcceleration() {
  const [hardwareAcceleration, setHardwareAcceleration] = createSignal(true);

  onMount(() => {
    const api = typeof window !== "undefined" ? window.electron : undefined;
    if (api) {
      api
        .getHardwareAccelerationDisabled()
        .then((disabled: boolean) => setHardwareAcceleration(!disabled))
        .catch(() => undefined);
    }
  });

  const setEnabled = (enabled: boolean) => {
    setHardwareAcceleration(enabled);
    const api = typeof window !== "undefined" ? window.electron : undefined;
    if (api) {
      api.setHardwareAccelerationDisabled(!enabled).catch(() => undefined);
    }
  };

  return {
    hardwareAcceleration,
    setHardwareAcceleration: setEnabled,
  };
}

export default useHardwareAcceleration;
