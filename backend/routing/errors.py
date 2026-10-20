class PlanningError(Exception):
    status = 400


class RouteNotFound(PlanningError):
    status = 422


class ProviderError(PlanningError):
    status = 502
