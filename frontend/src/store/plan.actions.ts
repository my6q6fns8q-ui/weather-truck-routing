import type { Checkpoint, RouteResult } from "@/domain/types";
import { type DraftIssue, validateDraft } from "@/domain/trip";
import { ApiError, isAbort } from "@/services/http";
import * as planning from "@/services/planning";
import type { MessageKey } from "@/i18n/types";
import { getState, setState } from "./appStore";
import { nextFit, type PlanError } from "./state";

let inflight: AbortController | null = null;

export async function submitPlan() {
  const validation = validateDraft(getState().draft);
  if (!validation.ok) {
    setState({
      status: "error",
      error: { kind: "message", key: ISSUE_MESSAGES[validation.issue] },
    });
    return;
  }

  inflight?.abort();
  const controller = (inflight = new AbortController());
  setState({ status: "loading", error: null });

  try {
    const plan = await planning.planTrip(validation.input, controller.signal);
    if (inflight !== controller) return;
    setState((state) => ({
      plan,
      status: "ready",
      error: null,
      selectedRouteId: plan.recommended_route_id,
      focus: null,
      hour: 0,
      draftOpen: false,
      picking: null,
      fit: nextFit(state.fit, "all"),
    }));
  } catch (error) {
    if (isAbort(error) || inflight !== controller) return;
    setState({ status: "error", error: toPlanError(error) });
  } finally {
    if (inflight === controller) inflight = null;
  }
}

export const selectRoute = (routeId: string) =>
  setState((state) => ({
    selectedRouteId: routeId,
    focus: null,
    fit: nextFit(state.fit, routeId),
  }));

export const focusCheckpoint = (route: RouteResult, checkpoint: Checkpoint) =>
  setState({ focus: { routeId: route.id, mile: checkpoint.mile } });

export const clearFocus = () => setState({ focus: null });

export const setHour = (hour: number) => setState({ hour });

export const fitTo = (target: "all" | string) =>
  setState((state) => ({ fit: nextFit(state.fit, target) }));

const ISSUE_MESSAGES: Record<DraftIssue, MessageKey> = {
  endpoints: "error.endpoints",
  load: "error.load",
  departure: "error.departure",
};

function toPlanError(error: unknown): PlanError {
  if (!(error instanceof ApiError))
    return { kind: "message", key: "error.plan" };
  if (error.code === "network")
    return { kind: "message", key: "error.network" };
  return error.detail
    ? { kind: "detail", detail: error.detail }
    : { kind: "message", key: "error.server" };
}
