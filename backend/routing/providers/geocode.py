import hashlib

from django.conf import settings
from django.core.cache import cache

from .http import get_json

NA_BBOX = "-170,15,-50,72"
SUPPORTED_LANGS = ("de", "en", "fr", "it")
CACHE_TTL_S = 3600


def normalize_lang(code: str) -> str:
    base = (code or "").split("-")[0].lower()
    return base if base in SUPPORTED_LANGS else "en"


def _label(props: dict) -> str:
    parts = [props.get("name"), props.get("street"), props.get("city") or props.get("county"), props.get("state")]
    out = []
    for p in parts:
        if p and p not in out:
            out.append(p)
    return ", ".join(out) or "Unnamed place"


def _cache_key(*parts: object) -> str:
    return "geocode:" + hashlib.sha1(":".join(str(p) for p in parts).encode()).hexdigest()


def search(query: str, limit: int = 6, lang: str = "en") -> list[dict]:
    lang = normalize_lang(lang)
    key = _cache_key("search", query.strip().lower(), limit, lang)
    if (hit := cache.get(key)) is not None:
        return hit
    data = get_json(
        f"{settings.PHOTON_BASE_URL}/api/",
        {"q": query, "limit": limit * 2, "lang": lang, "bbox": NA_BBOX},
    )
    features = sorted(data.get("features", []), key=lambda f: f["properties"].get("osm_key") != "place")
    results = [
        {
            "label": _label(f["properties"]),
            "lat": f["geometry"]["coordinates"][1],
            "lon": f["geometry"]["coordinates"][0],
        }
        for f in features[:limit]
    ]
    cache.set(key, results, CACHE_TTL_S)
    return results


def reverse(lat: float, lon: float, lang: str = "en") -> dict | None:
    lang = normalize_lang(lang)
    key = _cache_key("reverse", round(lat, 4), round(lon, 4), lang)
    if (hit := cache.get(key)) is not None:
        return hit
    data = get_json(f"{settings.PHOTON_BASE_URL}/reverse/", {"lat": lat, "lon": lon, "lang": lang, "limit": 1})
    features = data.get("features", [])
    result = {"label": _label(features[0]["properties"]), "lat": lat, "lon": lon} if features else None
    cache.set(key, result, CACHE_TTL_S)
    return result
