import time

import requests
from django.conf import settings

from ..errors import ProviderError

_session = requests.Session()


def get_json(
    url: str, params: dict, *, timeout: float = 25, retries: int = 2, accept: tuple[int, ...] = (200,)
) -> dict | list:
    last = "unknown error"
    for attempt in range(retries + 1):
        try:
            resp = _session.get(url, params=params, timeout=timeout, headers={"User-Agent": settings.HTTP_USER_AGENT})
        except requests.RequestException as exc:
            last = str(exc)
        else:
            if resp.status_code in accept:
                return resp.json()
            last = f"HTTP {resp.status_code}: {resp.text[:200]}"
            if resp.status_code not in (429, 500, 502, 503, 504):
                break
        time.sleep(0.8 * (attempt + 1))
    raise ProviderError(f"Upstream request to {url.split('?')[0]} failed ({last})")
