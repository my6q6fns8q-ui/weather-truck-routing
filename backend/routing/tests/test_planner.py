from datetime import datetime, timezone
from unittest import mock

from django.test import SimpleTestCase

from routing import geometry as geo
from routing import planner
from routing.providers import openmeteo, osrm


def straight_route(lat0, lon0, miles, hours, n=60) -> osrm.Route:
    coords = [(lat0, lon0 + i * miles / (n - 1) / 55.0) for i in range(n)]
    cum = geo.cumulative_miles(coords)
    factor = miles / cum[-1]
    cum = [m * factor for m in cum]
    secs = [hours * 3600 * m / miles for m in cum]
    return osrm.Route(coords, cum, secs, miles, hours * 3600)


class CheckpointTests(SimpleTestCase):
    def test_miles_include_start_and_destination(self):
        self.assertEqual(planner.checkpoint_miles(100, 25), [0, 25, 50, 75, 100])
        self.assertEqual(planner.checkpoint_miles(110, 50), [0, 50, 100, 110])
        self.assertEqual(planner.checkpoint_miles(100.2, 50), [0, 50, 100.2])

    def test_segments_tile_the_route(self):
        miles = planner.checkpoint_miles(110, 50)
        bounds = planner.segment_bounds(miles, 110)
        self.assertEqual(bounds[0][0], 0)
        self.assertEqual(bounds[-1][1], 110)
        for (_, end), (start, _) in zip(bounds, bounds[1:]):
            self.assertEqual(end, start)


class PlanTests(SimpleTestCase):
    def setUp(self):
        self.now = datetime.now(timezone.utc).replace(minute=0, second=0, microsecond=0)
        self.fast = straight_route(40.0, -100.0, 400, 6)
        self.slow = straight_route(41.0, -100.0, 440, 8)

    def request(self, load=20_000):
        return planner.PlanRequest(
            planner.Place("A", 40.0, -100.0), planner.Place("B", 40.0, -93.0), self.now, load, 50
        )

    def run_plan(self, wind_for_lat, load=20_000):

        def fake_fetch(points, start, end):
            hours = int(
                (datetime.combine(end, datetime.min.time()) - datetime.combine(start, datetime.min.time())).days * 24
                + 24
            )
            return {p: openmeteo.Hourly([wind_for_lat(p[0])] * hours, [0.0] * hours, [0.0] * hours) for p in points}

        with (
            mock.patch.object(osrm, "route_options", return_value=[self.fast, self.slow]),
            mock.patch.object(openmeteo, "fetch_forecasts", side_effect=fake_fetch),
        ):
            return planner.plan(self.request(load))

    def test_eta_increases_and_matches_duration(self):
        result = self.run_plan(lambda lat: 5)
        cps = result["routes"][0]["checkpoints"]
        etas = [datetime.fromisoformat(c["eta"]) for c in cps]
        self.assertEqual(etas, sorted(etas))
        self.assertEqual(etas[0], self.now)
        self.assertAlmostEqual((etas[-1] - self.now).total_seconds(), 6 * 3600, delta=1)

    def test_prefers_calm_route_even_if_slower(self):
        result = self.run_plan(lambda lat: 50 if lat < 40.5 else 5, load=10_000)
        self.assertEqual(result["recommended_route_id"], "route-2")
        by_id = {r["id"]: r for r in result["routes"]}
        self.assertGreater(by_id["route-1"]["summary"]["miles_by_level"]["Severe"], 0)
        self.assertEqual(by_id["route-2"]["summary"]["max_label"], "Low")
        self.assertRegex(by_id["route-2"]["recommendation_reason"], r"^\+\d+ min, avoids \d+ Severe mi\.$")

    def test_heavy_load_turns_windy_route_into_no_travel(self):
        result = self.run_plan(lambda lat: 50 if lat < 40.5 else 5, load=35_000)
        by_id = {r["id"]: r for r in result["routes"]}
        self.assertGreater(by_id["route-1"]["summary"]["miles_by_level"]["No Travel"], 0)
        self.assertEqual(result["recommended_route_id"], "route-2")

    def test_fastest_wins_when_conditions_match(self):
        result = self.run_plan(lambda lat: 5)
        self.assertEqual(result["recommended_route_id"], "route-1")

    def test_heatmap_shape(self):
        result = self.run_plan(lambda lat: 30)
        heat = result["heatmap"]
        self.assertEqual(heat["hours"], 48)
        self.assertTrue(all(len(p["risk"]) == 49 for p in heat["points"]))
        self.assertTrue(all(v == 1 for p in heat["points"] for v in p["risk"]))

    def test_segments_cover_route_and_colour_by_level(self):
        result = self.run_plan(lambda lat: 50 if lat < 40.5 else 5, load=10_000)
        route = next(r for r in result["routes"] if r["id"] == "route-1")
        self.assertEqual({s["level"] for s in route["segments"]}, {3})
        self.assertEqual(route["segments"][0]["coords"][0], route["geometry"][0])

    def test_storm_overlay_raises_risk_only_when_requested(self):
        calm = self.run_plan(lambda lat: 2)
        self.assertEqual({p["risk"][0] for p in calm["heatmap"]["points"]}, {0})
        self.assertFalse(calm["simulated_storm"])

        def fake_fetch(points, start, end):
            hours = int(
                (datetime.combine(end, datetime.min.time()) - datetime.combine(start, datetime.min.time())).days * 24
                + 24
            )
            return {p: openmeteo.Hourly([2.0] * hours, [0.0] * hours, [0.0] * hours) for p in points}

        req = self.request()
        req = planner.PlanRequest(req.origin, req.destination, req.departure, req.load_lb, req.interval_mi, True)
        with (
            mock.patch.object(osrm, "route_options", return_value=[self.fast, self.slow]),
            mock.patch.object(openmeteo, "fetch_forecasts", side_effect=fake_fetch),
        ):
            stormy = planner.plan(req)
        self.assertTrue(stormy["simulated_storm"])
        self.assertGreater(max(max(p["risk"]) for p in stormy["heatmap"]["points"]), 0)
