import { describe, expect, it } from "vitest";
import { emptyDraft, isLoadValid, MAX_LOAD_LB, validateDraft } from "./trip";

const place = (label: string) => ({ label, lat: 41.88, lon: -87.63 });

const draft = (over: Partial<ReturnType<typeof emptyDraft>> = {}) => ({
  ...emptyDraft(new Date(2026, 0, 2, 3, 30)),
  origin: place("Chicago"),
  destination: place("Memphis"),
  ...over,
});

describe("validateDraft", () => {
  it("needs both endpoints", () => {
    expect(validateDraft(draft({ destination: null }))).toEqual({
      ok: false,
      issue: "endpoints",
    });
  });

  it("rejects loads outside the trailer's range", () => {
    expect(validateDraft(draft({ loadLb: "" }))).toEqual({
      ok: false,
      issue: "load",
    });
    expect(validateDraft(draft({ loadLb: String(MAX_LOAD_LB + 1) }))).toEqual({
      ok: false,
      issue: "load",
    });
    expect(isLoadValid("0")).toBe(true);
  });

  it("rejects an unparseable departure", () => {
    expect(validateDraft(draft({ departure: "not-a-date" }))).toEqual({
      ok: false,
      issue: "departure",
    });
  });

  it("turns a valid draft into an API request", () => {
    const result = validateDraft(
      draft({ loadLb: "34000", intervalMi: 10, simulateStorm: true }),
    );
    expect(result.ok && result.input).toMatchObject({
      load_lb: 34000,
      interval_mi: 10,
      simulate_storm: true,
      departure: new Date(2026, 0, 2, 4, 0).toISOString(),
    });
  });
});

describe("emptyDraft", () => {
  it("defaults departure to the next whole hour", () => {
    expect(emptyDraft(new Date(2026, 0, 2, 3, 30)).departure).toBe(
      "2026-01-02T04:00",
    );
  });
});
