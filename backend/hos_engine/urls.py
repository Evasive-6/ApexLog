from django.urls import path
from .views import CalculateTripView, PresetsView, HealthCheckView

urlpatterns = [
    path("calculate-trip/", CalculateTripView.as_view(), name="calculate_trip"),
    path("presets/", PresetsView.as_view(), name="presets"),
    path("health/", HealthCheckView.as_view(), name="health"),
]
