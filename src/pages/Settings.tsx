/**
 * Settings.tsx - Application settings page (/settings)
 *
 * Allows users to configure:
 * - Appearance (theme, language)
 * - Input/output audio devices
 * - Master volume
 * - Audio processing (spatial audio, noise suppression, echo cancellation)
 *
 * Device enumeration requires microphone permission on first load.
 */
import { createSignal, onMount } from "solid-js";
import { audioStore } from "@/stores/audio";
import { themeStore, ThemeMode } from "@/stores/theme";
import { useI18n, locales, Locale } from "@/lib/i18n";
import { Section, SelectField, Slider, Toggle } from "@/components/ui";
import { logger } from "@/lib/logger";
import { showToast } from "@/stores/toast";
import styles from "./Settings.module.css";

interface AudioDevice {
  deviceId: string;
  label: string;
}

export function Settings() {
  const [t, locale, setLocale] = useI18n();
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
      logger.error("Failed to enumerate audio devices:", err);
      showToast({ 
        type: "warning", 
        message: t("errors.audioDevices") 
      });
    }
  });

  // Theme options using translations
  const themeOptions = () => [
    { value: "system", label: t("theme.system") },
    { value: "dark", label: t("theme.dark") },
    { value: "light", label: t("theme.light") },
  ];

  // Language options from locales
  const languageOptions = () => 
    locales.map((l) => ({ value: l.code, label: l.name }));

  const inputOptions = () =>
    inputDevices().map((d) => ({ value: d.deviceId, label: d.label }));

  const outputOptions = () =>
    outputDevices().map((d) => ({ value: d.deviceId, label: d.label }));

  return (
    <div class={styles.page}>
      <header class={styles.header}>
        <h1 class={styles.title}>{t("settings.title")}</h1>
        <p class={styles.subtitle}>{t("settings.subtitle")}</p>
      </header>

      <div class={styles.sections}>
        <Section title={t("settings.appearance")}>
          <SelectField
            label={t("settings.theme")}
            options={themeOptions()}
            value={themeStore.themeMode()}
            onChange={(e) => themeStore.setThemeMode(e.currentTarget.value as ThemeMode)}
          />
          <SelectField
            label={t("settings.language")}
            options={languageOptions()}
            value={locale()}
            onChange={(e) => setLocale(e.currentTarget.value as Locale)}
          />
        </Section>

        <Section title={t("settings.audioDevices")}>
          <SelectField
            label={t("settings.inputDevice")}
            options={inputOptions()}
            placeholder={t("common.default")}
            value={audioStore.audioInputDevice()}
            onChange={(e) => audioStore.setAudioInputDevice(e.currentTarget.value)}
          />
          <SelectField
            label={t("settings.outputDevice")}
            options={outputOptions()}
            placeholder={t("common.default")}
            value={audioStore.audioOutputDevice()}
            onChange={(e) => audioStore.setAudioOutputDevice(e.currentTarget.value)}
          />
        </Section>

        <Section title={t("settings.volume")}>
          <div class={styles.volumeRow}>
            <span class={styles.volumeLabel}>{t("settings.masterVolume")}</span>
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

        <Section title={t("settings.audioProcessing")}>
          <div class={styles.toggleList}>
            <Toggle
              label={t("settings.spatialAudio")}
              description={t("settings.spatialAudioDesc")}
              checked={audioStore.spatialAudioEnabled()}
              onChange={(e) => audioStore.setSpatialAudioEnabled(e.currentTarget.checked)}
            />
            <Toggle
              label={t("settings.noiseSuppression")}
              description={t("settings.noiseSuppressionDesc")}
              checked={audioStore.noiseSuppressionEnabled()}
              onChange={(e) => audioStore.setNoiseSuppressionEnabled(e.currentTarget.checked)}
            />
            <Toggle
              label={t("settings.echoCancellation")}
              description={t("settings.echoCancellationDesc")}
              checked={audioStore.echoCancellationEnabled()}
              onChange={(e) => audioStore.setEchoCancellationEnabled(e.currentTarget.checked)}
            />
          </div>
        </Section>

        <Section title={t("settings.about")}>
          <div class={styles.about}>
            <p><strong>{t("app.name")}</strong> — {t("app.tagline")}</p>
            <p class={styles.muted}>{t("settings.version")} 1.0.0</p>
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
