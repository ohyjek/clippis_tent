import { createSignal, onMount, For } from "solid-js";
import { audioStore } from "../stores/audio";
import { Slider } from "../components/ui";
import styles from "./Settings.module.css";

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function Settings() {
  const [inputDevices, setInputDevices] = createSignal<AudioDevice[]>([]);
  const [outputDevices, setOutputDevices] = createSignal<AudioDevice[]>([]);

  onMount(async () => {
    try {
      // Request permission to access devices
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      
      setInputDevices(
        devices
          .filter((d) => d.kind === "audioinput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${d.deviceId.slice(0, 8)}`,
          }))
      );
      
      setOutputDevices(
        devices
          .filter((d) => d.kind === "audiooutput")
          .map((d) => ({
            deviceId: d.deviceId,
            label: d.label || `Speaker ${d.deviceId.slice(0, 8)}`,
          }))
      );
    } catch (err) {
      console.error("Failed to enumerate devices:", err);
    }
  });

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>Settings</h1>
        <p class={styles.subtitle}>Configure your audio preferences</p>
      </header>

      <div class={styles.sections}>
        {/* Audio Devices */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>Audio Devices</h2>
          
          <div class={styles.field}>
            <label class={styles.label}>Input Device (Microphone)</label>
            <select
              class={styles.select}
              value={audioStore.audioInputDevice()}
              onChange={(e) => audioStore.setAudioInputDevice(e.currentTarget.value)}
            >
              <option value="">Default</option>
              <For each={inputDevices()}>
                {(device) => (
                  <option value={device.deviceId}>{device.label}</option>
                )}
              </For>
            </select>
          </div>

          <div class={styles.field}>
            <label class={styles.label}>Output Device (Speakers)</label>
            <select
              class={styles.select}
              value={audioStore.audioOutputDevice()}
              onChange={(e) => audioStore.setAudioOutputDevice(e.currentTarget.value)}
            >
              <option value="">Default</option>
              <For each={outputDevices()}>
                {(device) => (
                  <option value={device.deviceId}>{device.label}</option>
                )}
              </For>
            </select>
          </div>
        </section>

        {/* Volume */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>Volume</h2>
          
          <div class={styles.field}>
            <label class={styles.label}>Master Volume</label>
            <div class={styles.sliderRow}>
              <Slider
                min={0}
                max={1}
                step={0.01}
                value={audioStore.masterVolume()}
                onInput={(e) => audioStore.updateMasterVolume(parseFloat(e.currentTarget.value))}
                class={styles.slider}
              />
              <span class={styles.value}>{Math.round(audioStore.masterVolume() * 100)}%</span>
            </div>
          </div>
        </section>

        {/* Audio Processing */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>Audio Processing</h2>
          
          <div class={styles.toggle}>
            <label class={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={audioStore.spatialAudioEnabled()}
                onChange={(e) => audioStore.setSpatialAudioEnabled(e.currentTarget.checked)}
              />
              <span class={styles.toggleText}>
                <strong>Spatial Audio</strong>
                <span>Enable 3D positional audio effects</span>
              </span>
            </label>
          </div>

          <div class={styles.toggle}>
            <label class={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={audioStore.noiseSuppressionEnabled()}
                onChange={(e) => audioStore.setNoiseSuppressionEnabled(e.currentTarget.checked)}
              />
              <span class={styles.toggleText}>
                <strong>Noise Suppression</strong>
                <span>Reduce background noise from microphone</span>
              </span>
            </label>
          </div>

          <div class={styles.toggle}>
            <label class={styles.toggleLabel}>
              <input
                type="checkbox"
                checked={audioStore.echoCancellationEnabled()}
                onChange={(e) => audioStore.setEchoCancellationEnabled(e.currentTarget.checked)}
              />
              <span class={styles.toggleText}>
                <strong>Echo Cancellation</strong>
                <span>Prevent audio feedback loops</span>
              </span>
            </label>
          </div>
        </section>

        {/* About */}
        <section class={styles.section}>
          <h2 class={styles.sectionTitle}>About</h2>
          <div class={styles.about}>
            <p><strong>Clippis</strong> - Spatial Voice Chat</p>
            <p class={styles.muted}>Version 1.0.0</p>
            <p class={styles.muted}>
              A Dolby Axon-inspired spatial audio prototype built with 
              Electron, SolidJS, and Web Audio API.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
