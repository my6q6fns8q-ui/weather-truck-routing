from django.test import SimpleTestCase

from routing.risk import Risk, assess, classify_rain, classify_snow, classify_wind, rank_key, summarize


class BandTests(SimpleTestCase):
    def test_wind_bands(self):
        cases = {
            0: Risk.LOW,
            24.9: Risk.LOW,
            25: Risk.MODERATE,
            34.9: Risk.MODERATE,
            35: Risk.HIGH,
            44.9: Risk.HIGH,
            45: Risk.SEVERE,
            54.9: Risk.SEVERE,
            55: Risk.NO_TRAVEL,
            80: Risk.NO_TRAVEL,
        }
        for mph, expected in cases.items():
            with self.subTest(mph=mph):
                self.assertEqual(classify_wind(mph), expected)

    def test_rain_bands(self):
        cases = {
            0.09: Risk.LOW,
            0.10: Risk.MODERATE,
            0.24: Risk.MODERATE,
            0.25: Risk.HIGH,
            0.49: Risk.HIGH,
            0.50: Risk.SEVERE,
            1.00: Risk.SEVERE,
            1.01: Risk.NO_TRAVEL,
        }
        for value, expected in cases.items():
            with self.subTest(rain=value):
                self.assertEqual(classify_rain(value), expected)

    def test_snow_bands(self):
        cases = {
            0.4: Risk.LOW,
            0.5: Risk.MODERATE,
            1.0: Risk.HIGH,
            2.0: Risk.SEVERE,
            3.0: Risk.SEVERE,
            3.1: Risk.NO_TRAVEL,
        }
        for value, expected in cases.items():
            with self.subTest(snow=value):
                self.assertEqual(classify_snow(value), expected)


class LoadRuleTests(SimpleTestCase):
    def test_no_travel_wind_for_any_load(self):
        self.assertEqual(assess(55, 0, 0, 0).level, Risk.NO_TRAVEL)

    def test_heavy_load_in_severe_wind_is_no_travel(self):
        self.assertEqual(assess(50, 0, 0, 30_001).level, Risk.NO_TRAVEL)
        self.assertEqual(assess(50, 0, 0, 30_000).level, Risk.SEVERE)

    def test_heavy_load_in_high_wind_is_severe(self):
        a = assess(40, 0, 0, 40_001)
        self.assertEqual(a.level, Risk.SEVERE)
        self.assertTrue(a.load_adjusted)
        self.assertEqual(assess(40, 0, 0, 40_000).level, Risk.HIGH)

    def test_load_rules_do_not_apply_outside_their_wind_band(self):
        self.assertEqual(assess(30, 0, 0, 80_000).level, Risk.MODERATE)
        self.assertEqual(assess(60, 0, 0, 0).level, Risk.NO_TRAVEL)

    def test_overall_is_worst_condition(self):
        a = assess(10, 0.6, 0.6, 10_000)
        self.assertEqual((a.wind, a.rain, a.snow, a.level), (Risk.LOW, Risk.SEVERE, Risk.MODERATE, Risk.SEVERE))
        self.assertTrue(any("Rain" in r for r in a.reasons))


class SummaryTests(SimpleTestCase):
    def test_summary_weights_by_miles(self):
        s = summarize([Risk.LOW, Risk.SEVERE, Risk.LOW], [10, 20, 10])
        self.assertEqual(s.miles_by_level["Severe"], 20)
        self.assertEqual(s.miles_by_level["Low"], 20)
        self.assertAlmostEqual(s.avg_risk, 1.5)
        self.assertEqual(s.max_level, Risk.SEVERE)

    def test_ranking_order(self):
        def s(levels, miles):
            return summarize(levels, miles)

        clean_slow = (s([Risk.LOW], [100]), 9000)
        severe_fast = (s([Risk.SEVERE, Risk.LOW], [50, 50]), 5000)
        no_travel = (s([Risk.NO_TRAVEL], [100]), 1000)
        high_only = (s([Risk.HIGH, Risk.LOW], [50, 50]), 6000)
        ordered = sorted([no_travel, severe_fast, high_only, clean_slow], key=lambda x: rank_key(*x))
        self.assertEqual(ordered, [clean_slow, high_only, severe_fast, no_travel])

    def test_time_breaks_ties(self):
        a = (summarize([Risk.LOW], [100]), 4000)
        b = (summarize([Risk.LOW], [100]), 3000)
        self.assertLess(rank_key(*b), rank_key(*a))
