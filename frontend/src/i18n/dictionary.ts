import { en } from "./messages/en";
import { es } from "./messages/es";
import {
  DEFAULT_LOCALE,
  type Locale,
  LOCALES,
  type Messages,
  type Translate,
} from "./types";

const MESSAGES: Record<Locale, Messages> = { en, es };

const PLACEHOLDER = /\{(\w+)\}/g;

export function createTranslate(locale: Locale): Translate {
  const messages = MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE];
  return (key, values) => {
    const template = messages[key] ?? MESSAGES[DEFAULT_LOCALE][key] ?? key;
    if (!values) return template;
    return template.replace(PLACEHOLDER, (match, name: string) =>
      name in values ? String(values[name]) : match,
    );
  };
}

export const isLocale = (value: string): value is Locale =>
  (LOCALES as readonly string[]).includes(value);

function browserLanguages(): readonly string[] {
  if (typeof navigator === "undefined") return [];
  return (
    navigator.languages ?? (navigator.language ? [navigator.language] : [])
  );
}

export function detectLocale(
  languages: readonly string[] = browserLanguages(),
): Locale {
  for (const language of languages) {
    const base = language.split("-")[0].toLowerCase();
    if (isLocale(base)) return base;
  }
  return DEFAULT_LOCALE;
}
