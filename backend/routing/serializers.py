from datetime import timedelta

from django.utils import timezone
from rest_framework import serializers

from .planner import Place, PlanRequest

INTERVAL_CHOICES = (10, 25, 50)
MAX_LOAD_LB = 120_000


class PlaceSerializer(serializers.Serializer):
    label = serializers.CharField(max_length=200)
    lat = serializers.FloatField(min_value=-90, max_value=90)
    lon = serializers.FloatField(min_value=-180, max_value=180)


class PlanRequestSerializer(serializers.Serializer):
    origin = PlaceSerializer()
    destination = PlaceSerializer()
    departure = serializers.DateTimeField()
    load_lb = serializers.FloatField(min_value=0, max_value=MAX_LOAD_LB)
    interval_mi = serializers.ChoiceField(choices=INTERVAL_CHOICES, default=25)
    simulate_storm = serializers.BooleanField(default=False)

    def validate_departure(self, value):
        now = timezone.now()
        if value < now - timedelta(hours=24):
            raise serializers.ValidationError("Departure can be at most 24 hours in the past.")
        return value

    def to_request(self) -> PlanRequest:
        d = self.validated_data
        return PlanRequest(
            origin=Place(**d["origin"]),
            destination=Place(**d["destination"]),
            departure=d["departure"],
            load_lb=d["load_lb"],
            interval_mi=int(d["interval_mi"]),
            simulate_storm=d["simulate_storm"],
        )
