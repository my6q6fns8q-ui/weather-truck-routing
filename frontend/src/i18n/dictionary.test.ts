import { describe, expect, it } from "vitest";
import { createTranslate, detectLocale } from "./dictionary";
import { en } from "./messages/en";
import { es } from "./messages/es";
import { LOCALES } from "./types";

describe("dictionary", () => {
  it("translates every key in every locale", () => {
    for (const [locale, messages] of [
      ["en", en],
      ["es", es],
    ] as const) {
      const missing = Object.keys(en).filter(
        (key) => !(messages as Record<string, string>)[key]?.trim(),
      );
      expect(missing, `missing in ${locale}`).toEqual([]);
    }
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
  });

  it("fills placeholders and leaves unknown ones alone", () => {
    expect(createTranslate("en")("routes.checkpoints", { count: 12 })).toBe(
      "Checkpoints · 12",
    );
    expect(createTranslate("es")("pick.step", { step: 2 })).toBe("Paso 2 de 2");
    expect(createTranslate("en")("trip.interval", {})).toBe("{miles} mi");
  });

  it("picks the first supported browser language", () => {
    expect(detectLocale(["es-MX", "en-US"])).toBe("es");
    expect(detectLocale(["pt-BR"])).toBe("en");
    expect(LOCALES).toContain(detectLocale([]));
  });
});
