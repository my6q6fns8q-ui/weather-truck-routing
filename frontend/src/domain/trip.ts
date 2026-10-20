import { toLocalInputValue } from "@/lib/format";
import type { Place, TripInput } from "./types";

export const INTERVALS_MI = [10, 25, 50] as const;
export type IntervalMi = (typeof INTERVALS_MI)[number];

export const MAX_LOAD_LB = 120_000;
const DEFAULT_LOAD_LB = "34000";

export interface TripDraft {
  origin: Place | null;
  destination: Place | null;
  departure: string;
  loadLb: string;
  intervalMi: IntervalMi;
  simulateStorm: boolean;
}

export function defaultDeparture(now = new Date()): string {
  const departure = new Date(now);
  departure.setMinutes(0, 0, 0);
  departure.setHours(departure.getHours() + 1);
  return toLocalInputValue(departure);
}

export const emptyDraft = (now = new Date()): TripDraft => ({
  origin: null,
  destination: null,
  departure: defaultDeparture(now),
  loadLb: DEFAULT_LOAD_LB,
  intervalMi: 25,
  simulateStorm: false,
});

export type DraftIssue = "endpoints" | "load" | "departure";

export type DraftValidation =
  { ok: true; input: TripInput } | { ok: false; issue: DraftIssue };

export function isLoadValid(loadLb: string): boolean {
  const value = Number(loadLb);
  return (
    loadLb.trim() !== "" &&
    Number.isFinite(value) &&
    value >= 0 &&
    value <= MAX_LOAD_LB
  );
}

export function validateDraft(draft: TripDraft): DraftValidation {
  if (!draft.origin || !draft.destination)
    return { ok: false, issue: "endpoints" };
  if (!isLoadValid(draft.loadLb)) return { ok: false, issue: "load" };
  const departure = new Date(draft.departure);
  if (!draft.departure || Number.isNaN(departure.getTime()))
    return { ok: false, issue: "departure" };

  return {
    ok: true,
    input: {
      origin: draft.origin,
      destination: draft.destination,
      departure: departure.toISOString(),
      load_lb: Number(draft.loadLb),
      interval_mi: draft.intervalMi,
      simulate_storm: draft.simulateStorm,
    },
  };
}

export const isDraftReady = (draft: TripDraft) => validateDraft(draft).ok;
