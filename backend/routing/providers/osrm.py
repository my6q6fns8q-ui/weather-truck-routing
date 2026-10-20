from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass

from django.conf import settings

from .. import geometry as geo
from ..errors import ProviderError, RouteNotFound
from .http import get_json

MAX_ROUTES = 3
VIA_OFFSETS = (0.18, -0.18, 0.35, -0.35)
MAX_DETOUR_FACTOR = 1.8
OVERLAP_LIMIT = 0.8
CELL_DEG = 0.03


@dataclass
class Route:
    coords: list[geo.LatLon]
    cum_miles: list[float]
    cum_seconds: list[float]
    distance_mi: float
    duration_s: float


def _parse_route(raw: dict) -> Route:
    coords = [(lat, lon) for lon, lat in raw["geometry"]["coordinates"]]
    seconds = [d for leg in raw["legs"] for d in leg["annotation"]["duration"]]
    cum_miles = geo.cumulative_miles(coords)
    if cum_miles[-1] > 0:
        factor = raw["distance"] / geo.METERS_PER_MILE / cum_miles[-1]
        cum_miles = [m * factor for m in cum_miles]
    if len(seconds) == len(coords) - 1 and sum(seconds) > 0:
        scale = raw["duration"] / sum(seconds)
        cum_s = [0.0]
        for s in seconds:
            cum_s.append(cum_s[-1] + s * scale)
    else:
        total = cum_miles[-1] or 1.0
        cum_s = [raw["duration"] * m / total for m in cum_miles]
    return Route(coords, cum_miles, cum_s, raw["distance"] / geo.METERS_PER_MILE, raw["duration"])


def _fetch(waypoints: list[geo.LatLon], alternatives: bool) -> list[Route]:
    path = ";".join(f"{lon:.6f},{lat:.6f}" for lat, lon in waypoints)
    data = get_json(
        f"{settings.OSRM_BASE_URL}/route/v1/driving/{path}",
        {
            "alternatives": "true" if alternatives else "false",
            "overview": "full",
            "geometries": "geojson",
            "annotations": "duration",
            "continue_straight": "false",
        },
        timeout=40,
        accept=(200, 400),
    )
    code = data.get("code")
    if code in ("NoRoute", "NoSegment"):
        raise RouteNotFound("No drivable route between those two places.")
    if code != "Ok":
        raise ProviderError(f"Routing service error: {data.get('message') or code}")
    return [_parse_route(r) for r in data["routes"]]


def _cells(route: Route) -> set[tuple[int, int]]:
    total = route.cum_miles[-1]
    steps = max(int(total), 1)
    pts = [geo.interpolate_at(total * i / steps, route.cum_miles, route.coords) for i in range(steps + 1)]
    return {(round(lat / CELL_DEG), round(lon / CELL_DEG)) for lat, lon in pts}


def _is_distinct(candidate: Route, kept: list[Route]) -> bool:
    cells = _cells(candidate)
    for other in kept:
        other_cells = _cells(other)
        if len(cells & other_cells) / max(min(len(cells), len(other_cells)), 1) > OVERLAP_LIMIT:
            return False
    return True


def _select(candidates: list[Route]) -> list[Route]:
    chosen: list[Route] = []
    fastest = min(c.duration_s for c in candidates)
    for cand in sorted(candidates, key=lambda c: c.duration_s):
        if cand.duration_s > fastest * MAX_DETOUR_FACTOR:
            continue
        if _is_distinct(cand, chosen):
            chosen.append(cand)
        if len(chosen) == MAX_ROUTES:
            break
    return chosen


def route_options(origin: geo.LatLon, destination: geo.LatLon) -> list[Route]:
    candidates = _fetch([origin, destination], alternatives=True)
    chosen = _select(candidates)
    if len(chosen) >= MAX_ROUTES:
        return chosen

    straight = geo.haversine_mi(origin, destination)
    if straight < 3:
        return chosen
    mid = geo.interpolate_at(straight / 2, [0.0, straight], [origin, destination])
    heading = geo.bearing_deg(origin, destination)
    vias = [geo.lateral_offset(mid, heading, f * straight) for f in VIA_OFFSETS]

    def via_route(via: geo.LatLon) -> list[Route]:
        try:
            return _fetch([origin, via, destination], alternatives=False)
        except (ProviderError, RouteNotFound):
            return []

    with ThreadPoolExecutor(max_workers=len(vias)) as pool:
        extra = [r for routes in pool.map(via_route, vias) for r in routes]
    return _select(candidates + extra)
