from dataclasses import dataclass, field
from enum import IntEnum


class Risk(IntEnum):
    LOW = 0
    MODERATE = 1
    HIGH = 2
    SEVERE = 3
    NO_TRAVEL = 4

    @property
    def label(self) -> str:
        return self.name.replace("_", " ").title()


WIND_BOUNDS = (25, 35, 45, 55)
RAIN_BOUNDS = (0.10, 0.25, 0.50, 1.00)
SNOW_BOUNDS = (0.5, 1.0, 2.0, 3.0)

HEAVY_LOAD_NO_TRAVEL_LB = 30_000
HEAVY_LOAD_SEVERE_LB = 40_000


def _band(value: float, bounds: tuple[float, ...], strict_top: bool) -> Risk:
    level = 0
    for i, bound in enumerate(bounds):
        is_top = i == len(bounds) - 1
        if (value > bound) if (is_top and strict_top) else (value >= bound):
            level = i + 1
    return Risk(level)


def classify_wind(mph: float) -> Risk:
    return _band(mph, WIND_BOUNDS, strict_top=False)


def classify_rain(in_per_hr: float) -> Risk:
    return _band(in_per_hr, RAIN_BOUNDS, strict_top=True)


def classify_snow(in_per_hr: float) -> Risk:
    return _band(in_per_hr, SNOW_BOUNDS, strict_top=True)


@dataclass(frozen=True)
class Assessment:
    level: Risk
    wind: Risk
    rain: Risk
    snow: Risk
    load_adjusted: bool = False
    reasons: list[str] = field(default_factory=list)


def assess(wind_mph: float, rain_in_hr: float, snow_in_hr: float, load_lb: float) -> Assessment:
    wind, rain, snow = classify_wind(wind_mph), classify_rain(rain_in_hr), classify_snow(snow_in_hr)
    level = max(wind, rain, snow)
    reasons = [
        f"{name} {value:g} {unit} → {band.label}"
        for name, value, unit, band in (
            ("Wind", round(wind_mph, 1), "mph", wind),
            ("Rain", round(rain_in_hr, 2), "in/hr", rain),
            ("Snow", round(snow_in_hr, 2), "in/hr", snow),
        )
        if band >= Risk.MODERATE
    ]

    adjusted = False
    if 45 <= wind_mph < 55 and load_lb > HEAVY_LOAD_NO_TRAVEL_LB:
        level, adjusted = Risk.NO_TRAVEL, True
        reasons.append(f"Load {load_lb:,.0f} lb > {HEAVY_LOAD_NO_TRAVEL_LB:,} lb in 45–54 mph wind → No Travel")
    elif 35 <= wind_mph < 45 and load_lb > HEAVY_LOAD_SEVERE_LB and level < Risk.SEVERE:
        level, adjusted = Risk.SEVERE, True
        reasons.append(f"Load {load_lb:,.0f} lb > {HEAVY_LOAD_SEVERE_LB:,} lb in 35–44 mph wind → Severe")

    return Assessment(Risk(level), wind, rain, snow, adjusted, reasons)


@dataclass(frozen=True)
class RouteSummary:
    miles_by_level: dict[str, float]
    avg_risk: float
    max_level: Risk


def summarize(levels: list[Risk], segment_miles: list[float]) -> RouteSummary:
    miles = {r.label: 0.0 for r in Risk}
    for level, length in zip(levels, segment_miles):
        miles[level.label] += length
    total = sum(segment_miles)
    avg = sum(int(level) * length for level, length in zip(levels, segment_miles)) / total if total else 0.0
    return RouteSummary({k: round(v, 1) for k, v in miles.items()}, round(avg, 3), max(levels, default=Risk.LOW))


MILES_TOLERANCE = 5.0
AVG_RISK_TOLERANCE = 0.05


def rank_key(summary: RouteSummary, duration_s: float) -> tuple:
    m = summary.miles_by_level
    return (
        m[Risk.NO_TRAVEL.label] > 0,
        round(m[Risk.SEVERE.label] / MILES_TOLERANCE),
        round(m[Risk.HIGH.label] / MILES_TOLERANCE),
        round(summary.avg_risk / AVG_RISK_TOLERANCE),
        duration_s,
    )
