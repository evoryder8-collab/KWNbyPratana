import { de, type TranslationKey } from "./de";
import { en } from "./en";
import { th } from "./th";
import { fr } from "./fr";
import { es } from "./es";
import { it } from "./it";
import { ru } from "./ru";
import { pt } from "./pt";

export const LANGUAGE_CODES = ["de", "en", "th", "fr", "es", "it", "ru", "pt"] as const;
export type LanguageCode = (typeof LANGUAGE_CODES)[number];

export const languages = [
  { code: "de", short: "DE", name: "Deutsch" },
  { code: "en", short: "EN", name: "English" },
  { code: "th", short: "TH", name: "ไทย" },
  { code: "fr", short: "FR", name: "Français" },
  { code: "es", short: "ES", name: "Español" },
  { code: "it", short: "IT", name: "Italiano" },
  { code: "ru", short: "RU", name: "Русский" },
  { code: "pt", short: "PT", name: "Português" },
] as const;

export const translations: Record<LanguageCode, Record<TranslationKey, string>> = {
  de,
  en,
  th,
  fr,
  es,
  it,
  ru,
  pt,
};

export function translate(
  language: LanguageCode,
  key: TranslationKey,
  params: Record<string, string | number> = {}
) {
  const value = translations[language][key] ?? translations.de[key] ?? key;
  return Object.entries(params).reduce(
    (copy, [name, replacement]) => copy.replaceAll(`{${name}}`, String(replacement)),
    value
  );
}

export type { TranslationKey };
