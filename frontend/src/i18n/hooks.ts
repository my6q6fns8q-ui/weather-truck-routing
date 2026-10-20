import { useEffect, useMemo } from "react";
import { createFormatter, type Formatter } from "@/lib/format";
import { useLocale } from "@/store/hooks";
import { createTranslate } from "./dictionary";
import type { Locale, MessageKey, Translate } from "./types";

export { useLocale };

export function useTranslate(): Translate {
  const locale = useLocale();
  return useMemo(() => createTranslate(locale), [locale]);
}

export function useFormatter(): Formatter {
  const locale = useLocale();
  const t = useTranslate();
  return useMemo(
    () => createFormatter(locale, { mi: t("units.mi"), lb: t("units.lb") }),
    [locale, t],
  );
}

export const riskMessageKey = (level: number) => `risk.${level}` as MessageKey;

export function useDocumentLocale(locale: Locale) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
}
