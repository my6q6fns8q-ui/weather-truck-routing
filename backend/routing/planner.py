from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from . import geometry as geo
from . import risk, storm
from .errors import PlanningError
from .providers import openmeteo, osrm

HEAT_HOURS = 48
HEAT_SPACING_MI = 30.0
HEAT_MAX_POSITIONS = 45
HEAT_LATERAL_MI = (-15.0, 0.0, 15.0)
HEAT_CELL_DEG = 0.2
FORECAST_HORIZON_DAYS = 15


@dataclass(frozen=True)
class Place:
    label: str
    lat: float
    lon: float

    @property
    def latlon(self) -> geo.LatLon:
        return (self.lat, self.lon)


@dataclass(frozen=True)
class PlanRequest:
    origin: Place
    destination: Place
    departure: datetime
    load_lb: float
    interval_mi: int
    simulate_storm: bool = False


def checkpoint_miles(total: float, interval: float) -> list[float]:
    miles = [i * interval for i in range(int(total // interval) + 1)]
    if total - miles[-1] > 0.5:
        miles.append(total)
    else:
        miles[-1] = total
    return miles


def segment_bounds(miles: list[float], total: float) -> list[tuple[float, float]]:
    mids = [(a + b) / 2 for a, b in zip(miles, miles[1:])]
    starts, ends = [0.0] + mids, mids + [total]
    return list(zip(starts, ends))


def _hour_index(t: datetime, origin_midnight: datetime) -> int:
    return round((t - origin_midnight).total_seconds() / 3600)


def _heat_points(route: osrm.Route) -> list[geo.LatLon]:
    total = route.cum_miles[-1]
    spacing = max(HEAT_SPACING_MI, total / HEAT_MAX_POSITIONS)
    points = []
    for mile in checkpoint_miles(total, spacing):
        here = geo.interpolate_at(mile, route.cum_miles, route.coords)
        ahead = geo.interpolate_at(min(mile + 2, total), route.cum_miles, route.coords)
        behind = geo.interpolate_at(max(mile - 2, 0), route.cum_miles, route.coords)
        heading = geo.bearing_deg(behind, ahead) if behind != ahead else 0.0
        points.extend(geo.lateral_offset(here, heading, off) if off else here for off in HEAT_LATERAL_MI)
    return points


def _round_pt(pt: geo.LatLon, nd: int = 5) -> list[float]:
    return [round(pt[0], nd), round(pt[1], nd)]


def _build_segments(route: osrm.Route, levels: list[risk.Risk], bounds: list[tuple[float, float]]) -> list[dict]:
    merged: list[list] = []
    for level, (start, end) in zip(levels, bounds):
        if merged and merged[-1][0] == level:
            merged[-1][2] = end
        else:
            merged.append([level, start, end])
    return [
        {
            "level": int(level),
            "label": level.label,
            "coords": [_round_pt(p) for p in geo.thin_path(geo.slice_path(s, e, route.cum_miles, route.coords))],
        }
        for level, s, e in merged
    ]


def _miles(route: dict, level: str) -> float:
    return route["summary"]["miles_by_level"][level]


def _explain(best: dict, others: list[dict]) -> str:
    fastest = min([best, *others], key=lambda r: r["duration_s"])
    if _miles(best, "No Travel") > 0:
        return "Every route hits No Travel. Consider delaying."

    if best is fastest:
        same = all(
            _miles(o, "Severe") == _miles(best, "Severe") and _miles(o, "High") == _miles(best, "High") for o in others
        )
        return "Fastest, and no riskier." if same else "Fastest and safest."

    extra_min = round((best["duration_s"] - fastest["duration_s"]) / 60)
    saved = []
    severe_saved = _miles(fastest, "Severe") - _miles(best, "Severe")
    high_saved = _miles(fastest, "High") - _miles(best, "High")
    if severe_saved >= 0.5:
        saved.append(f"{severe_saved:.0f} Severe mi")
    if high_saved >= 0.5:
        saved.append(f"{high_saved:.0f} High mi")
    benefit = " and ".join(saved) if saved else "weather risk"
    return f"+{extra_min} min, avoids {benefit}."


def plan(req: PlanRequest) -> dict:
    now = datetime.now(timezone.utc)
    routes = osrm.route_options(req.origin.latlon, req.destination.latlon)
    departure = req.departure.astimezone(timezone.utc)

    sampled = []
    for route in routes:
        total = route.cum_miles[-1]
        miles = checkpoint_miles(total, req.interval_mi)
        pts = [geo.interpolate_at(m, route.cum_miles, route.coords) for m in miles]
        etas = [departure + timedelta(seconds=geo.interpolate_at(m, route.cum_miles, route.cum_seconds)) for m in miles]
        sampled.append((miles, pts, etas))

    heat_cells: dict[tuple[int, int], geo.LatLon] = {}
    for route in routes:
        for pt in _heat_points(route):
            heat_cells.setdefault((round(pt[0] / HEAT_CELL_DEG), round(pt[1] / HEAT_CELL_DEG)), pt)
    heat_pts = list(heat_cells.values())

    last_eta = max(etas[-1] for _, _, etas in sampled)
    window_start = departure.replace(hour=0, minute=0, second=0, microsecond=0)
    window_end = max(last_eta, departure + timedelta(hours=HEAT_HOURS + 1))
    if window_end.date() > (now + timedelta(days=FORECAST_HORIZON_DAYS)).date():
        raise PlanningError(
            f"Forecast data only reaches {FORECAST_HORIZON_DAYS} days ahead; the trip would arrive after that. "
            "Pick an earlier departure."
        )

    wanted = {openmeteo.snap(*p) for _, pts, _ in sampled for p in pts} | {openmeteo.snap(*p) for p in heat_pts}
    forecasts = openmeteo.fetch_forecasts(wanted, window_start.date(), window_end.date())
    if req.simulate_storm:
        midpoint = geo.interpolate_at(0.5, [0.0, 1.0], [req.origin.latlon, req.destination.latlon])
        forecasts = storm.overlay(forecasts, window_start, departure, midpoint)

    out_routes = []
    for idx, (route, (miles, pts, etas)) in enumerate(zip(routes, sampled), start=1):
        total = route.cum_miles[-1]
        bounds = segment_bounds(miles, total)
        checkpoints, levels = [], []
        for mile, pt, eta in zip(miles, pts, etas):
            wind, rain, snow = forecasts[openmeteo.snap(*pt)].at(_hour_index(eta, window_start))
            a = risk.assess(wind, rain, snow, req.load_lb)
            levels.append(a.level)
            checkpoints.append(
                {
                    "mile": round(mile, 1),
                    "lat": round(pt[0], 5),
                    "lon": round(pt[1], 5),
                    "eta": eta.isoformat(),
                    "wind_mph": round(wind, 1),
                    "rain_in_hr": round(rain, 2),
                    "snow_in_hr": round(snow, 2),
                    "level": int(a.level),
                    "label": a.level.label,
                    "load_adjusted": a.load_adjusted,
                    "reasons": a.reasons,
                }
            )
        summary = risk.summarize(levels, [e - s for s, e in bounds])
        out_routes.append(
            {
                "id": f"route-{idx}",
                "name": f"Route {idx}",
                "distance_mi": round(route.distance_mi, 1),
                "duration_s": round(route.duration_s),
                "arrival": etas[-1].isoformat(),
                "geometry": [_round_pt(p) for p in geo.thin_path(route.coords)],
                "segments": _build_segments(route, levels, bounds),
                "checkpoints": checkpoints,
                "summary": {
                    "miles_by_level": summary.miles_by_level,
                    "avg_risk": summary.avg_risk,
                    "max_level": int(summary.max_level),
                    "max_label": summary.max_level.label,
                },
                "_rank_key": risk.rank_key(summary, route.duration_s),
            }
        )

    ranked = sorted(out_routes, key=lambda r: r["_rank_key"])
    for rank, r in enumerate(ranked, start=1):
        r["rank"] = rank
        r["recommended"] = rank == 1
        del r["_rank_key"]
    best = ranked[0]
    best["recommendation_reason"] = _explain(best, ranked[1:])

    base_idx = _hour_index(departure, window_start)
    heat = []
    for pt in heat_pts:
        f = forecasts[openmeteo.snap(*pt)]
        heat.append(
            {
                "lat": round(pt[0], 4),
                "lon": round(pt[1], 4),
                "risk": [int(risk.assess(*f.at(base_idx + h), req.load_lb).level) for h in range(HEAT_HOURS + 1)],
            }
        )

    return {
        "origin": {"label": req.origin.label, "lat": req.origin.lat, "lon": req.origin.lon},
        "destination": {"label": req.destination.label, "lat": req.destination.lat, "lon": req.destination.lon},
        "departure": departure.isoformat(),
        "load_lb": req.load_lb,
        "interval_mi": req.interval_mi,
        "simulated_storm": req.simulate_storm,
        "recommended_route_id": best["id"],
        "routes": sorted(out_routes, key=lambda r: r["id"]),
        "heatmap": {
            "start": (window_start + timedelta(hours=base_idx)).isoformat(),
            "hours": HEAT_HOURS,
            "points": heat,
        },
    }
