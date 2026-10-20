export type RiskLevel = 0 | 1 | 2 | 3 | 4;
export type LatLng = [number, number];

export interface Place {
  label: string;
  lat: number;
  lon: number;
}

export interface TripInput {
  origin: Place;
  destination: Place;
  departure: string;
  load_lb: number;
  interval_mi: number;
  simulate_storm: boolean;
}

export interface Checkpoint {
  mile: number;
  lat: number;
  lon: number;
  eta: string;
  wind_mph: number;
  rain_in_hr: number;
  snow_in_hr: number;
  level: RiskLevel;
  label: string;
  load_adjusted: boolean;
  reasons: string[];
}

export interface Segment {
  level: RiskLevel;
  label: string;
  coords: LatLng[];
}

export interface RouteResult {
  id: string;
  name: string;
  distance_mi: number;
  duration_s: number;
  arrival: string;
  geometry: LatLng[];
  segments: Segment[];
  checkpoints: Checkpoint[];
  summary: {
    miles_by_level: Record<string, number>;
    avg_risk: number;
    max_level: RiskLevel;
    max_label: string;
  };
  rank: number;
  recommended: boolean;
  recommendation_reason?: string;
}

export interface HeatPoint {
  lat: number;
  lon: number;
  risk: RiskLevel[];
}

export interface PlanResponse {
  origin: Place;
  destination: Place;
  departure: string;
  load_lb: number;
  interval_mi: number;
  simulated_storm: boolean;
  recommended_route_id: string;
  routes: RouteResult[];
  heatmap: { start: string; hours: number; points: HeatPoint[] };
}
