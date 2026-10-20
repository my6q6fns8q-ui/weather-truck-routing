from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import planner
from .errors import PlanningError
from .providers import geocode
from .serializers import GeocodeQuerySerializer, PlanRequestSerializer, ReverseGeocodeQuerySerializer

MIN_QUERY_LEN = 3


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET"])
def geocode_view(request):
    query = GeocodeQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    q = query.validated_data["q"].strip()
    if len(q) < MIN_QUERY_LEN:
        return Response([])
    try:
        return Response(geocode.search(q, lang=query.validated_data["lang"]))
    except PlanningError as exc:
        return Response({"detail": str(exc)}, status=exc.status)


@api_view(["GET"])
def reverse_geocode_view(request):
    query = ReverseGeocodeQuerySerializer(data=request.query_params)
    query.is_valid(raise_exception=True)
    try:
        return Response(geocode.reverse(**query.validated_data))
    except PlanningError as exc:
        return Response({"detail": str(exc)}, status=exc.status)


@api_view(["POST"])
def plan_view(request):
    serializer = PlanRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        return Response(planner.plan(serializer.to_request()))
    except PlanningError as exc:
        return Response({"detail": str(exc)}, status=exc.status)
