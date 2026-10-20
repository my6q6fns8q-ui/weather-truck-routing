from datetime import datetime, timedelta, timezone
from unittest import mock

from django.test import SimpleTestCase
from rest_framework.test import APIClient

from routing import planner
from routing.errors import RouteNotFound


def payload(**over):
    body = {
        "origin": {"label": "A", "lat": 41.88, "lon": -87.63},
        "destination": {"label": "B", "lat": 35.15, "lon": -90.05},
        "departure": (datetime.now(timezone.utc) + timedelta(hours=2)).isoformat(),
        "load_lb": 30000,
        "interval_mi": 25,
    }
    body.update(over)
    return body


class PlanApiTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()

    def test_rejects_bad_interval_and_load(self):
        self.assertEqual(self.client.post("/api/plan/", payload(interval_mi=7), format="json").status_code, 400)
        self.assertEqual(self.client.post("/api/plan/", payload(load_lb=-1), format="json").status_code, 400)

    def test_rejects_stale_departure(self):
        old = (datetime.now(timezone.utc) - timedelta(days=3)).isoformat()
        self.assertEqual(self.client.post("/api/plan/", payload(departure=old), format="json").status_code, 400)

    def test_planning_errors_map_to_status(self):
        with mock.patch.object(planner, "plan", side_effect=RouteNotFound("nope")):
            resp = self.client.post("/api/plan/", payload(), format="json")
        self.assertEqual((resp.status_code, resp.json()["detail"]), (422, "nope"))

    def test_geocode_short_query_is_empty(self):
        self.assertEqual(self.client.get("/api/geocode/?q=ab").json(), [])
