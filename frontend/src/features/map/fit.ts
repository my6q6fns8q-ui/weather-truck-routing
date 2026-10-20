import L from "leaflet";
import { placePosition } from "@/domain/place";
import { routeBounds } from "@/domain/plan";
import type { TripDraft } from "@/domain/trip";
import type { LatLng, PlanResponse } from "@/domain/types";

const WIDE_BREAKPOINT_PX = 720;

export function fitOptions(): L.FitBoundsOptions {
  const wide = window.innerWidth > WIDE_BREAKPOINT_PX;
  return wide
    ? { paddingTopLeft: [408, 56], paddingBottomRight: [64, 120], maxZoom: 12 }
    : {
        paddingTopLeft: [32, 120],
        paddingBottomRight: [32, Math.round(window.innerHeight * 0.5)],
        maxZoom: 12,
      };
}

export function fitMapTo(map: L.Map, positions: LatLng[]) {
  if (!positions.length) return;
  if (positions.length === 1) {
    map.setView(positions[0], Math.max(map.getZoom(), 9), { animate: true });
    return;
  }
  map.fitBounds(L.latLngBounds(positions), {
    ...fitOptions(),
    animate: true,
    duration: 0.8,
  });
}

export function fitTargets(
  plan: PlanResponse | null,
  target: "all" | string,
  draft: TripDraft,
): LatLng[] {
  if (plan) {
    const routes =
      target === "all"
        ? plan.routes
        : plan.routes.filter((route) => route.id === target);
    if (routes.length) return routeBounds(routes);
  }
  return [draft.origin, draft.destination]
    .filter((place) => place !== null)
    .map(placePosition);
}
