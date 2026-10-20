import type { PlanResponse, RouteResult } from "@/domain/types";

export const place = (label: string, lat = 41.88, lon = -87.63) => ({
  label,
  lat,
  lon,
});

export const route = (
  id: string,
  rank: number,
  recommended = false,
): RouteResult => ({
  id,
  name: id,
  distance_mi: 530,
  duration_s: 8 * 3600,
  arrival: "2026-01-02T12:00:00Z",
  geometry: [
    [41.88, -87.63],
    [35.15, -90.05],
  ],
  segments: [{ level: 0, label: "Low", coords: [[41.88, -87.63]] }],
  checkpoints: [
    {
      mile: 0,
      lat: 41.88,
      lon: -87.63,
      eta: "2026-01-02T04:00:00Z",
      wind_mph: 8,
      rain_in_hr: 0,
      snow_in_hr: 0,
      level: 0,
      label: "Low",
      load_adjusted: false,
      reasons: [],
    },
  ],
  summary: {
    miles_by_level: { Low: 530 },
    avg_risk: 0,
    max_level: 0,
    max_label: "Low",
  },
  rank,
  recommended,
});

export const plan = (): PlanResponse => ({
  origin: place("Chicago"),
  destination: place("Memphis", 35.15, -90.05),
  departure: "2026-01-02T04:00:00Z",
  load_lb: 34000,
  interval_mi: 25,
  simulated_storm: false,
  recommended_route_id: "r2",
  routes: [route("r1", 2), route("r2", 1, true)],
  heatmap: { start: "2026-01-02T04:00:00Z", hours: 48, points: [] },
});
