from rest_framework.decorators import api_view
from rest_framework.response import Response

from . import planner
from .errors import PlanningError
from .providers import geocode
from .serializers import PlanRequestSerializer


@api_view(["GET"])
def health(request):
    return Response({"status": "ok"})


@api_view(["GET"])
def geocode_view(request):
    q = request.query_params.get("q", "").strip()
    if len(q) < 3:
        return Response([])
    try:
        return Response(geocode.search(q))
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
