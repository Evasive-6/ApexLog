import os
import logging
from datetime import datetime
from django.http import HttpResponse, FileResponse
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

def index_view(request):
    dist_index = settings.BASE_DIR.parent / "frontend" / "dist" / "index.html"
    if dist_index.exists():
        return FileResponse(open(dist_index, "rb"), content_type="text/html")
    return HttpResponse("ApexLog FMCSA HOS Engine is active. API accessible at /api/")

from .services.geocoding import geocode_location
from .services.routing import get_route_between_waypoints
from .services.hos_calculator import HOSCalculator

logger = logging.getLogger(__name__)

class CalculateTripView(APIView):
    def post(self, request):
        try:
            current_loc_str = request.data.get("current_location", "").strip()
            pickup_loc_str = request.data.get("pickup_location", "").strip()
            dropoff_loc_str = request.data.get("dropoff_location", "").strip()
            
            try:
                cycle_used = float(request.data.get("current_cycle_used", 0.0))
            except (ValueError, TypeError):
                cycle_used = 0.0

            if not current_loc_str or not pickup_loc_str or not dropoff_loc_str:
                return Response(
                    {"error": "Please provide Current Location, Pickup Location, and Dropoff Location."},
                    status=status.HTTP_400_BAD_REQUEST
                )

            driver_name = request.data.get("driver_name", "John E. Doe")
            carrier_name = request.data.get("carrier_name", "Apex Freight Logistics LLC")
            truck_number = request.data.get("truck_number", "TRK-4421 / TRL-8809")
            main_office = request.data.get("main_office", "100 Interstate Pkwy, Dallas, TX")
            home_terminal = request.data.get("home_terminal", "Dallas Terminal, TX")
            shipping_doc = request.data.get("shipping_doc", "BOL-908234")
            commodity = request.data.get("commodity", "General Freight")
            dep_time_str = request.data.get("departure_time")

            start_dt = None
            if dep_time_str:
                try:
                    start_dt = datetime.fromisoformat(dep_time_str.replace("Z", "+00:00"))
                    if start_dt.tzinfo is not None:
                        start_dt = start_dt.replace(tzinfo=None)
                except Exception:
                    start_dt = None

            current_geo = geocode_location(current_loc_str)
            pickup_geo = geocode_location(pickup_loc_str)
            dropoff_geo = geocode_location(dropoff_loc_str)

            waypoints = [
                {"name": current_geo.get("name", current_loc_str), "lat": current_geo["lat"], "lng": current_geo["lng"]},
                {"name": pickup_geo.get("name", pickup_loc_str), "lat": pickup_geo["lat"], "lng": pickup_geo["lng"]},
                {"name": dropoff_geo.get("name", dropoff_loc_str), "lat": dropoff_geo["lat"], "lng": dropoff_geo["lng"]}
            ]

            route_data = get_route_between_waypoints(waypoints)

            calculator = HOSCalculator(
                current_loc=current_geo,
                pickup_loc=pickup_geo,
                dropoff_loc=dropoff_geo,
                route_data=route_data,
                current_cycle_used=cycle_used,
                start_datetime=start_dt,
                driver_name=driver_name,
                carrier_name=carrier_name,
                truck_number=truck_number,
                main_office=main_office,
                home_terminal=home_terminal,
                shipping_doc=shipping_doc,
                commodity=commodity
            )

            result = calculator.run_simulation()
            return Response(result, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Error in CalculateTripView")
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class PresetsView(APIView):
    def get(self, request):
        presets = [
            {
                "id": "cross_country",
                "title": "Cross-Country Heavy Haul (Coast to Coast)",
                "description": "Los Angeles to New York via Dallas hub (~2,800 miles, 4+ days, multiple 10h sleeper rests, 1000-mile fueling)",
                "current_location": "Los Angeles, CA",
                "pickup_location": "Dallas, TX",
                "dropoff_location": "New York, NY",
                "current_cycle_used": 12.0
            },
            {
                "id": "midwest_regional",
                "title": "Midwest Express (Regional 1-Day)",
                "description": "Chicago to Columbus via Indianapolis (~350 miles, 1 calendar day, 1 hour pickup and dropoff)",
                "current_location": "Chicago, IL",
                "pickup_location": "Indianapolis, IN",
                "dropoff_location": "Columbus, OH",
                "current_cycle_used": 8.5
            },
            {
                "id": "southern_freight",
                "title": "Southeast Corridor (2-Day Medium Haul)",
                "description": "Miami to Nashville via Atlanta (~950 miles, requires 10-hr sleeper rest and 30-min break)",
                "current_location": "Miami, FL",
                "pickup_location": "Atlanta, GA",
                "dropoff_location": "Nashville, TN",
                "current_cycle_used": 24.0
            },
            {
                "id": "cycle_restart_stress",
                "title": "Cycle Exhaustion & 34-Hour Restart Test",
                "description": "High starting cycle (62.0 hrs) forcing a mandatory 34-hour restart mid-route before reaching 70 hours",
                "current_location": "Dallas, TX",
                "pickup_location": "Memphis, TN",
                "dropoff_location": "Philadelphia, PA",
                "current_cycle_used": 62.0
            }
        ]
        return Response({"presets": presets})

class HealthCheckView(APIView):
    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "ApexLog FMCSA HOS Engine",
            "version": "1.0.0",
            "fmcsa_rules": {
                "property_carrying": True,
                "cycle_limit": "70hrs/8days",
                "driving_limit": "11 hours",
                "duty_window": "14 hours",
                "rest_break": "30 minutes after 8 driving hours",
                "sleeper_reset": "10 consecutive hours",
                "cycle_restart": "34 consecutive hours",
                "fueling_rule": "Every 1,000 miles",
                "pickup_dropoff_duration": "1 hour each"
            }
        })
