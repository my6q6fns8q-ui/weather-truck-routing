from dataclasses import replace
from datetime import datetime

from . import geometry as geo
from .providers.openmeteo import Hourly

RADIUS_MI = 130.0
SPEED_MPH = 22.0
START_OFFSET_MI = 220.0
PEAK_WIND_MPH = 50.0
PEAK_RAIN_IN_HR = 0.9


def intensity(point: geo.LatLon, hours_after_departure: float, midpoint: geo.LatLon) -> float:
    travelled = hours_after_departure * SPEED_MPH - START_OFFSET_MI
    centre = geo.destination_point(midpoint, 90.0 if travelled >= 0 else 270.0, abs(travelled))
    distance = geo.haversine_mi(point, centre)
    return max(0.0, 1.0 - distance / RADIUS_MI) ** 1.5


def overlay(
    forecasts: dict[tuple[float, float], Hourly], window_start: datetime, departure: datetime, midpoint: geo.LatLon
) -> dict[tuple[float, float], Hourly]:
    offset_h = (departure - window_start).total_seconds() / 3600
    out = {}
    for point, f in forecasts.items():
        k = [intensity(point, i - offset_h, midpoint) for i in range(len(f.wind_mph))]
        out[point] = replace(
            f,
            wind_mph=[w + PEAK_WIND_MPH * x for w, x in zip(f.wind_mph, k)],
            rain_in=[r + PEAK_RAIN_IN_HR * x for r, x in zip(f.rain_in, k)],
        )
    return out
