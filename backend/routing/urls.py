from django.urls import path

from . import views

urlpatterns = [
    path("health/", views.health),
    path("geocode/", views.geocode_view),
    path("geocode/reverse/", views.reverse_geocode_view),
    path("plan/", views.plan_view),
]
