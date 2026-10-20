import { detectLocale, isLocale } from "./dictionary";
import type { Locale } from "./types";

const STORAGE_KEY = "routewise.locale";

export function initialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {}
  return detectLocale();
}

export function persistLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {}
}
