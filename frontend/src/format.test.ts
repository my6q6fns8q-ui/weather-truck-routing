import { describe, expect, it } from "vitest";
import { formatDuration, toLocalInputValue } from "./format";

describe("format", () => {
  it("formats durations", () => {
    expect(formatDuration(59 * 60)).toBe("59m");
    expect(formatDuration(3600 * 11 + 60 * 5)).toBe("11h 05m");
  });

  it("builds a datetime-local string from local fields", () => {
    expect(toLocalInputValue(new Date(2026, 0, 2, 3, 4))).toBe("2026-01-02T03:04");
  });
});
