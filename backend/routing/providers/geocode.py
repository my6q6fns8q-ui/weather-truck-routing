import hashlib

from django.conf import settings
from django.core.cache import cache

from .http import get_json

NA_BBOX = "-170,15,-50,72"


def _label(props: dict) -> str:
    parts = [props.get("name"), props.get("street"), props.get("city") or props.get("county"), props.get("state")]
    out = []
    for p in parts:
        if p and p not in out:
            out.append(p)
    return ", ".join(out) or "Unnamed place"


def search(query: str, limit: int = 6) -> list[dict]:
    key = "geocode:" + hashlib.sha1(f"{query.strip().lower()}:{limit}".encode()).hexdigest()
    if (hit := cache.get(key)) is not None:
        return hit
    data = get_json(
        f"{settings.PHOTON_BASE_URL}/api/",
        {"q": query, "limit": limit * 2, "lang": "en", "bbox": NA_BBOX},
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
    cache.set(key, results, 3600)
    return results
