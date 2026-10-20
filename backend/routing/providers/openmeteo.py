from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from datetime import date

from django.conf import settings
from django.core.cache import cache

from ..errors import ProviderError
from .http import get_json

BATCH_SIZE = 100
CACHE_SECONDS = 20 * 60
GRID_DECIMALS = 1


@dataclass(frozen=True)
class Hourly:
    wind_mph: list[float]
    rain_in: list[float]
    snow_in: list[float]

    def at(self, hour_index: int) -> tuple[float, float, float]:
        i = max(0, min(hour_index, len(self.wind_mph) - 1))
        return self.wind_mph[i], self.rain_in[i], self.snow_in[i]


def _key(point: tuple[float, float], start: date, end: date) -> str:
    return f"wx:{point[0]}:{point[1]}:{start}:{end}"


def snap(lat: float, lon: float) -> tuple[float, float]:
    return round(lat, GRID_DECIMALS), round(lon, GRID_DECIMALS)


def _series(block: dict, name: str, size: int) -> list[float]:
    return [v if v is not None else 0.0 for v in block.get(name, [])] or [0.0] * size


def _parse(entry: dict) -> Hourly:
    h = entry["hourly"]
    size = len(h["time"])
    rain = [a + b for a, b in zip(_series(h, "rain", size), _series(h, "showers", size))]
    return Hourly(_series(h, "wind_speed_10m", size), rain, _series(h, "snowfall", size))


def _fetch_batch(points: list[tuple[float, float]], start: date, end: date) -> list[Hourly]:
    params = {
        "latitude": ",".join(str(p[0]) for p in points),
        "longitude": ",".join(str(p[1]) for p in points),
        "hourly": "wind_speed_10m,rain,showers,snowfall",
        "wind_speed_unit": "mph",
        "precipitation_unit": "inch",
        "timezone": "UTC",
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
    }
    if settings.OPEN_METEO_API_KEY:
        params["apikey"] = settings.OPEN_METEO_API_KEY
    data = get_json(f"{settings.OPEN_METEO_BASE_URL}/v1/forecast", params, timeout=40, retries=3)
    entries = data if isinstance(data, list) else [data]
    if len(entries) != len(points):
        raise ProviderError("Weather service returned an unexpected number of locations.")
    return [_parse(e) for e in entries]


def fetch_forecasts(points: set[tuple[float, float]], start: date, end: date) -> dict[tuple[float, float], Hourly]:
    result: dict[tuple[float, float], Hourly] = {}
    missing: list[tuple[float, float]] = []
    for p in points:
        hit = cache.get(_key(p, start, end))
        if hit is not None:
            result[p] = hit
        else:
            missing.append(p)

    batches = [missing[i : i + BATCH_SIZE] for i in range(0, len(missing), BATCH_SIZE)]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for batch, forecasts in zip(batches, pool.map(lambda b: _fetch_batch(b, start, end), batches)):
            for p, forecast in zip(batch, forecasts):
                cache.set(_key(p, start, end), forecast, CACHE_SECONDS)
                result[p] = forecast
    return result
