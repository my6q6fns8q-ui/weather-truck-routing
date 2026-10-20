import {
  findRoute,
  resolveCheckpoint,
  type ResolvedCheckpoint,
} from "@/domain/plan";
import type { RouteResult } from "@/domain/types";
import type { AppState } from "./state";

export const selectIsLoading = (state: AppState) => state.status === "loading";

export const selectSelectedRoute = (state: AppState): RouteResult | null =>
  findRoute(state.plan, state.selectedRouteId);

export const selectFocusedCheckpoint = (
  state: AppState,
): ResolvedCheckpoint | null => resolveCheckpoint(state.plan, state.focus);

export const selectCanSubmit = (state: AppState) => state.status !== "loading";
