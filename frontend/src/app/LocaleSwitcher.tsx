import { useId } from "react";
import { type Locale, LOCALES, useTranslate } from "@/i18n";
import { localeActions, useLocale } from "@/store";

export default function LocaleSwitcher() {
  const locale = useLocale();
  const t = useTranslate();
  const id = useId();

  return (
    <div className="locale">
      <label className="sr-only" htmlFor={id}>
        {t("app.language")}
      </label>
      <select
        id={id}
        value={locale}
        onChange={(event) =>
          localeActions.setLocale(event.target.value as Locale)
        }
      >
        {LOCALES.map((option) => (
          <option key={option} value={option}>
            {t(`locale.${option}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
