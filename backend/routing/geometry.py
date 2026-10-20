import math
from bisect import bisect_right

EARTH_RADIUS_MI = 3958.8
METERS_PER_MILE = 1609.344

LatLon = tuple[float, float]


def haversine_mi(a: LatLon, b: LatLon) -> float:
    lat1, lon1, lat2, lon2 = map(math.radians, (*a, *b))
    h = math.sin((lat2 - lat1) / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin((lon2 - lon1) / 2) ** 2
    return 2 * EARTH_RADIUS_MI * math.asin(math.sqrt(h))


def cumulative_miles(coords: list[LatLon]) -> list[float]:
    cum = [0.0]
    for prev, cur in zip(coords, coords[1:]):
        cum.append(cum[-1] + haversine_mi(prev, cur))
    return cum


def bearing_deg(a: LatLon, b: LatLon) -> float:
    lat1, lat2 = math.radians(a[0]), math.radians(b[0])
    dlon = math.radians(b[1] - a[1])
    y = math.sin(dlon) * math.cos(lat2)
    x = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    return (math.degrees(math.atan2(y, x)) + 360) % 360


def destination_point(origin: LatLon, bearing: float, miles: float) -> LatLon:
    lat1, lon1 = math.radians(origin[0]), math.radians(origin[1])
    brg = math.radians(bearing)
    ang = miles / EARTH_RADIUS_MI
    lat2 = math.asin(math.sin(lat1) * math.cos(ang) + math.cos(lat1) * math.sin(ang) * math.cos(brg))
    lon2 = lon1 + math.atan2(
        math.sin(brg) * math.sin(ang) * math.cos(lat1), math.cos(ang) - math.sin(lat1) * math.sin(lat2)
    )
    return math.degrees(lat2), (math.degrees(lon2) + 540) % 360 - 180


def interpolate_at(distance: float, cum: list[float], values: list[LatLon] | list[float]):
    if distance <= cum[0]:
        return values[0]
    if distance >= cum[-1]:
        return values[-1]
    i = bisect_right(cum, distance) - 1
    span = cum[i + 1] - cum[i]
    t = 0.0 if span == 0 else (distance - cum[i]) / span
    a, b = values[i], values[i + 1]
    if isinstance(a, tuple):
        return (a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t)
    return a + (b - a) * t


def slice_path(start: float, end: float, cum: list[float], coords: list[LatLon]) -> list[LatLon]:
    path = [interpolate_at(start, cum, coords)]
    lo, hi = bisect_right(cum, start), bisect_right(cum, end)
    path.extend(coords[lo:hi])
    last = interpolate_at(end, cum, coords)
    if path[-1] != last:
        path.append(last)
    return path


def thin_path(coords: list[LatLon], min_miles: float = 0.15) -> list[LatLon]:
    if len(coords) < 3:
        return list(coords)
    kept = [coords[0]]
    for pt in coords[1:-1]:
        if haversine_mi(kept[-1], pt) >= min_miles:
            kept.append(pt)
    kept.append(coords[-1])
    return kept


def lateral_offset(point: LatLon, heading: float, miles: float) -> LatLon:
    if miles >= 0:
        return destination_point(point, (heading + 90) % 360, miles)
    return destination_point(point, (heading - 90) % 360, -miles)
