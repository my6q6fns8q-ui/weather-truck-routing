import type { CheckpointRef } from "@/domain/plan";
import { emptyDraft, type TripDraft } from "@/domain/trip";
import type { PlanResponse } from "@/domain/types";
import type { Locale, MessageKey } from "@/i18n/types";

export type RequestStatus = "idle" | "loading" | "ready" | "error";

export type PickTarget = "origin" | "destination";

export interface MapFit {
  target: "all" | string;
  nonce: number;
}

export type PlanError =
  { kind: "message"; key: MessageKey } | { kind: "detail"; detail: string };

export interface AppState {
  locale: Locale;
  draft: TripDraft;
  draftOpen: boolean;
  picking: PickTarget | null;
  naming: PickTarget | null;
  status: RequestStatus;
  error: PlanError | null;
  plan: PlanResponse | null;
  selectedRouteId: string | null;
  focus: CheckpointRef | null;
  fit: MapFit;
  hour: number;
}

export const initialState = (locale: Locale, now = new Date()): AppState => ({
  locale,
  draft: emptyDraft(now),
  draftOpen: true,
  picking: "origin",
  naming: null,
  status: "idle",
  error: null,
  plan: null,
  selectedRouteId: null,
  focus: null,
  fit: { target: "all", nonce: 0 },
  hour: 0,
});

export const nextFit = (fit: MapFit, target: "all" | string): MapFit => ({
  target,
  nonce: fit.nonce + 1,
});
