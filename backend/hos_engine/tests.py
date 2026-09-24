from django.test import TestCase
from datetime import datetime
from .services.hos_calculator import HOSCalculator

class HOSCalculatorTestCase(TestCase):
    def setUp(self):
        self.mock_route_short = {
            "total_distance_miles": 350.0,
            "total_duration_hours": 6.36,
            "full_coordinates": [[41.8781, -87.6298], [39.7684, -86.1581], [39.9612, -82.9988]],
            "legs": [
                {"distance_miles": 180.0, "duration_hours": 3.27, "to_name": "Indianapolis, IN"},
                {"distance_miles": 170.0, "duration_hours": 3.09, "to_name": "Columbus, OH"}
            ]
        }
        self.mock_route_long = {
            "total_distance_miles": 2200.0,
            "total_duration_hours": 40.0,
            "full_coordinates": [[34.0522, -118.2437], [32.7767, -96.7970], [40.7128, -74.0060]],
            "legs": [
                {"distance_miles": 1400.0, "duration_hours": 25.45, "to_name": "Dallas, TX"},
                {"distance_miles": 800.0, "duration_hours": 14.55, "to_name": "New York, NY"}
            ]
        }

    def test_pickup_and_dropoff_1_hour_on_duty(self):
        calc = HOSCalculator(
            current_loc={"name": "Chicago, IL", "lat": 41.8781, "lng": -87.6298},
            pickup_loc={"name": "Indianapolis, IN", "lat": 39.7684, "lng": -86.1581},
            dropoff_loc={"name": "Columbus, OH", "lat": 39.9612, "lng": -82.9988},
            route_data=self.mock_route_short,
            current_cycle_used=10.0
        )
        res = calc.run_simulation()
        stops = res["stops"]
        
        pickup_stop = next(s for s in stops if s["stop_type"] == "PICKUP")
        dropoff_stop = next(s for s in stops if s["stop_type"] == "DROPOFF")
        
        # Verify 1 hour on duty for pickup and dropoff
        self.assertEqual(pickup_stop["duration_hours"], 1.0)
        self.assertEqual(pickup_stop["duty_status"], "On Duty (Not Driving)")
        self.assertEqual(dropoff_stop["duration_hours"], 1.0)
        self.assertEqual(dropoff_stop["duty_status"], "On Duty (Not Driving)")

    def test_daily_logs_sum_to_exact_24_hours(self):
        calc = HOSCalculator(
            current_loc={"name": "Los Angeles, CA", "lat": 34.0522, "lng": -118.2437},
            pickup_loc={"name": "Dallas, TX", "lat": 32.7767, "lng": -96.7970},
            dropoff_loc={"name": "New York, NY", "lat": 40.7128, "lng": -74.0060},
            route_data=self.mock_route_long,
            current_cycle_used=5.0
        )
        res = calc.run_simulation()
        daily_logs = res["daily_logs"]
        self.assertGreater(len(daily_logs), 1)
        
        for log in daily_logs:
            tot = log["totals"]["total_hours"]
            self.assertAlmostEqual(tot, 24.0, delta=0.05, msg=f"Day {log['day_number']} total must sum to 24 hrs")

    def test_fueling_at_least_every_1000_miles(self):
        calc = HOSCalculator(
            current_loc={"name": "Los Angeles, CA", "lat": 34.0522, "lng": -118.2437},
            pickup_loc={"name": "Dallas, TX", "lat": 32.7767, "lng": -96.7970},
            dropoff_loc={"name": "New York, NY", "lat": 40.7128, "lng": -74.0060},
            route_data=self.mock_route_long,
            current_cycle_used=0.0
        )
        res = calc.run_simulation()
        fuel_stops = [s for s in res["stops"] if s["stop_type"] == "FUEL"]
        self.assertGreaterEqual(len(fuel_stops), 2)
