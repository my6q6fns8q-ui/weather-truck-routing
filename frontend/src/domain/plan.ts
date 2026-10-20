import { EXPOSED_LEVELS, type RiskLevelInfo } from "./risk";
import type { Checkpoint, LatLng, PlanResponse, RouteResult } from "./types";

export interface CheckpointRef {
  routeId: string;
  mile: number;
}

export interface ResolvedCheckpoint {
  route: RouteResult;
  checkpoint: Checkpoint;
  number: number;
}

export const routesByRank = (plan: PlanResponse) =>
  [...plan.routes].sort((a, b) => a.rank - b.rank);

export const routesBySelection = (
  plan: PlanResponse,
  selectedId: string | null,
) =>
  [...plan.routes].sort(
    (a, b) => Number(a.id === selectedId) - Number(b.id === selectedId),
  );

export const findRoute = (plan: PlanResponse | null, routeId: string | null) =>
  plan?.routes.find((route) => route.id === routeId) ?? null;

export const routeNumber = (plan: PlanResponse, route: RouteResult) =>
  plan.routes.indexOf(route) + 1;

export function resolveCheckpoint(
  plan: PlanResponse | null,
  ref: CheckpointRef | null,
): ResolvedCheckpoint | null {
  const route = findRoute(plan, ref?.routeId ?? null);
  if (!plan || !route || !ref) return null;
  const checkpoint = route.checkpoints.find((cp) => cp.mile === ref.mile);
  return checkpoint
    ? { route, checkpoint, number: routeNumber(plan, route) }
    : null;
}

export const tripHours = (route: RouteResult) => route.duration_s / 3600;

export const milesAtLevel = (route: RouteResult, level: RiskLevelInfo) =>
  route.summary.miles_by_level[level.key] ?? 0;

export const totalMilesByLevel = (route: RouteResult) =>
  Object.values(route.summary.miles_by_level).reduce((sum, mi) => sum + mi, 0);

const MIN_NOTABLE_MI = 0.5;

export const exposedLevels = (route: RouteResult) =>
  EXPOSED_LEVELS.filter(
    (level) => milesAtLevel(route, level) >= MIN_NOTABLE_MI,
  );

export const routeBounds = (routes: RouteResult[]): LatLng[] =>
  routes.flatMap((route) => route.geometry);
