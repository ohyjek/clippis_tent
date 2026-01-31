/**
 * Settings.tsx - Audio settings page (/settings)
 *
 * Allows users to configure:
 * - Input/output audio devices
 * - Master volume
 * - Audio processing (spatial audio, noise suppression, echo cancellation)
 *
 * Device enumeration requires microphone permission on first load.
 */
import { createSignal, onMount } from "solid-js";
import { audioStore } from "@/stores/audio";
import { Section, SelectField, Slider, Toggle } from "@/components/ui";
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

  const inputOptions = () =>
    inputDevices().map((d) => ({ value: d.deviceId, label: d.label }));

  const outputOptions = () =>
    outputDevices().map((d) => ({ value: d.deviceId, label: d.label }));

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>Settings</h1>
        <p class={styles.subtitle}>Configure your audio preferences</p>
      </header>

      <div class={styles.sections}>
        <Section title="Audio Devices">
          <SelectField
            label="Input Device (Microphone)"
            options={inputOptions()}
            placeholder="Default"
            value={audioStore.audioInputDevice()}
            onChange={(e) => audioStore.setAudioInputDevice(e.currentTarget.value)}
          />
          <SelectField
            label="Output Device (Speakers)"
            options={outputOptions()}
            placeholder="Default"
            value={audioStore.audioOutputDevice()}
            onChange={(e) => audioStore.setAudioOutputDevice(e.currentTarget.value)}
          />
        </Section>

        <Section title="Volume">
          <div class={styles.volumeRow}>
            <span class={styles.volumeLabel}>Master Volume</span>
            <Slider
              min={0}
              max={1}
              step={0.01}
              value={audioStore.masterVolume()}
              onInput={(e) => audioStore.updateMasterVolume(parseFloat(e.currentTarget.value))}
              class={styles.volumeSlider}
            />
            <span class={styles.volumeValue}>
              {Math.round(audioStore.masterVolume() * 100)}%
            </span>
          </div>
        </Section>

        <Section title="Audio Processing">
          <div class={styles.toggleList}>
            <Toggle
              label="Spatial Audio"
              description="Enable 3D positional audio effects"
              checked={audioStore.spatialAudioEnabled()}
              onChange={(e) => audioStore.setSpatialAudioEnabled(e.currentTarget.checked)}
            />
            <Toggle
              label="Noise Suppression"
              description="Reduce background noise from microphone"
              checked={audioStore.noiseSuppressionEnabled()}
              onChange={(e) => audioStore.setNoiseSuppressionEnabled(e.currentTarget.checked)}
            />
            <Toggle
              label="Echo Cancellation"
              description="Prevent audio feedback loops"
              checked={audioStore.echoCancellationEnabled()}
              onChange={(e) => audioStore.setEchoCancellationEnabled(e.currentTarget.checked)}
            />
          </div>
        </Section>

        <Section title="About">
          <div class={styles.about}>
            <p><strong>Clippis</strong> — Spatial Voice Chat</p>
            <p class={styles.muted}>Version 1.0.0</p>
            <p class={styles.muted}>
              A Dolby Axon-inspired spatial audio prototype built with Electron,
              SolidJS, and Web Audio API.
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}
