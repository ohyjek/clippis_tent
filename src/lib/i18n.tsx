/**
 * i18n.tsx - Internationalization setup
 *
 * Provides multi-language support using @solid-primitives/i18n.
 * Currently supports English only, but infrastructure is ready
 * for additional languages.
 *
 * Note: Avoids createEffect at module level to prevent
 * "computations created outside createRoot" warnings.
 *
 * Usage:
 *   import { useI18n } from "@/lib/i18n";
 *   const [t] = useI18n();
 *   t("nav.settings")
 */
import { createSignal, createContext, useContext, JSX } from "solid-js";
import * as i18n from "@solid-primitives/i18n";

// Import translation files
import en from "@/locales/en.json";

// Available dictionaries
const dictionaries = { en } as const;

/** Supported locale codes */
export type Locale = keyof typeof dictionaries;

/** All available locales with display names */
export const locales: Array<{ code: Locale; name: string }> = [
  { code: "en", name: "English" },
  // Add more as needed:
  // { code: "es", name: "Español" },
  // { code: "ja", name: "日本語" },
];

// Flatten the dictionary type for the translator
type RawDictionary = typeof en;

// Create a flattened dictionary type
export type Dictionary = i18n.Flatten<RawDictionary>;

// Initialize locale from localStorage or default to "en"
const storedLocale = localStorage.getItem("locale") as Locale | null;
const initialLocale = storedLocale ?? "en";
const [locale, setLocaleInternal] = createSignal<Locale>(initialLocale);

// Create the dictionary signal with initial value
const initialDict = i18n.flatten(dictionaries[initialLocale]) as Dictionary;
const [dict, setDict] = createSignal<Dictionary>(initialDict);

/**
 * Set locale - handles signal update, dictionary update, and persistence
 */
function setLocale(newLocale: Locale): void {
  const newDict = i18n.flatten(dictionaries[newLocale]) as Dictionary;
  setLocaleInternal(newLocale);
  setDict(newDict);
  localStorage.setItem("locale", newLocale);
}

// Create the translation function
const translate = i18n.translator(dict);

/** i18n context value */
interface I18nContextValue {
  /** Translation function - t("key.path") */
  t: typeof translate;
  /** Current locale */
  locale: typeof locale;
  /** Set the current locale */
  setLocale: typeof setLocale;
}

const I18nContext = createContext<I18nContextValue>();

/**
 * I18nProvider - Wrap your app with this to enable translations
 */
export function I18nProvider(props: { children: JSX.Element }) {
  const value: I18nContextValue = {
    t: translate,
    locale,
    setLocale,
  };

  return (
    <I18nContext.Provider value={value}>
      {props.children}
    </I18nContext.Provider>
  );
}

/**
 * useI18n - Hook to access translations
 *
 * @returns [t, locale, setLocale] - Translation function and locale controls
 *
 * Example usage:
 *   const [t, locale, setLocale] = useI18n();
 *   t("nav.settings") // returns translated string
 *   setLocale("es")   // changes locale
 */
export function useI18n(): [typeof translate, typeof locale, typeof setLocale] {
  const context = useContext(I18nContext);
  if (!context) {
    // Return defaults if used outside provider (for flexibility)
    return [translate, locale, setLocale];
  }
  return [context.t, context.locale, context.setLocale];
}

/**
 * Direct access to i18n store for non-component usage
 */
export const i18nStore = {
  locale,
  setLocale,
  t: translate,
};
