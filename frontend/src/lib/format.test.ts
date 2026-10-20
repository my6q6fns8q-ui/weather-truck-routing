import { describe, expect, it } from "vitest";
import { createFormatter, formatDuration, toLocalInputValue } from "./format";

describe("format", () => {
  it("formats durations", () => {
    expect(formatDuration(59 * 60)).toBe("59m");
    expect(formatDuration(3600 * 11 + 60 * 5)).toBe("11h 05m");
  });

  it("builds a datetime-local string from local fields", () => {
    expect(toLocalInputValue(new Date(2026, 0, 2, 3, 4))).toBe(
      "2026-01-02T03:04",
    );
  });

  it("formats quantities with the locale's separators and translated units", () => {
    expect(createFormatter("en-US", { mi: "mi", lb: "lb" }).miles(1234.6)).toBe(
      "1,235 mi",
    );
    expect(createFormatter("es-ES", { mi: "mi", lb: "lb" }).pounds(34000)).toBe(
      "34.000 lb",
    );
  });
});
