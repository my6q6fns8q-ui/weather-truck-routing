import { persistLocale } from "@/i18n/preference";
import type { Locale } from "@/i18n/types";
import { setState } from "./appStore";

export function setLocale(locale: Locale) {
  persistLocale(locale);
  setState({ locale });
}
