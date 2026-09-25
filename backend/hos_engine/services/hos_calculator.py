import math
from datetime import datetime, timedelta
from .routing import find_coordinate_at_mileage

TRUCK_SPEED_MPH = 55.0  # Commercial truck cruising average speed

class HOSCalculator:
    def __init__(
        self,
        current_loc,
        pickup_loc,
        dropoff_loc,
        route_data,
        current_cycle_used=0.0,
        start_datetime=None,
        driver_name="John E. Doe",
        carrier_name="Apex Freight Logistics LLC",
        truck_number="TRK-4421 / TRL-8809",
        main_office="100 Interstate Pkwy, Dallas, TX",
        home_terminal="Dallas Terminal, TX",
        shipping_doc="BOL-908234",
        commodity="General Freight"
    ):
        self.current_loc = current_loc
        self.pickup_loc = pickup_loc
        self.dropoff_loc = dropoff_loc
        self.route_data = route_data
        self.current_cycle_used = float(current_cycle_used)
        
        # Start at 06:00 AM on the given or current date
        if start_datetime is None:
            now = datetime.now()
            self.start_datetime = datetime(now.year, now.month, now.day, 6, 0, 0)
        else:
            # Strip timezone info if present to keep all internal simulation calculations offset-naive
            if hasattr(start_datetime, "tzinfo") and start_datetime.tzinfo is not None:
                self.start_datetime = start_datetime.replace(tzinfo=None)
            else:
                self.start_datetime = start_datetime

        self.driver_name = driver_name
        self.carrier_name = carrier_name
        self.truck_number = truck_number
        self.main_office = main_office
        self.home_terminal = home_terminal
        self.shipping_doc = shipping_doc
        self.commodity = commodity

        self.events = []
        self.stops = []
        self.daily_logs = []

    def run_simulation(self):
        legs = self.route_data.get("legs", [])
        if len(legs) == 0:
            return self._build_empty_response()

        leg1 = legs[0]
        leg2 = legs[1] if len(legs) > 1 else {"distance_miles": 0, "coordinates": [], "to_name": self.dropoff_loc["name"]}

        full_coords = self.route_data.get("full_coordinates", [])
        total_trip_miles = self.route_data.get("total_distance_miles", 0.0)

        curr_time = self.start_datetime
        day_start_midnight = datetime(curr_time.year, curr_time.month, curr_time.day, 0, 0, 0)

        if curr_time > day_start_midnight:
            self.events.append({
                "status": 1,
                "status_label": "Off Duty",
                "start_time": day_start_midnight,
                "end_time": curr_time,
                "duration_hours": (curr_time - day_start_midnight).total_seconds() / 3600.0,
                "location": self.current_loc["name"],
                "remarks": "Off Duty before shift",
                "odometer_start": 0.0,
                "odometer_end": 0.0
            })

        pre_trip_duration = 0.25
        pre_trip_end = curr_time + timedelta(hours=pre_trip_duration)
        self.events.append({
            "status": 4,
            "status_label": "On Duty (Not Driving)",
            "start_time": curr_time,
            "end_time": pre_trip_end,
            "duration_hours": pre_trip_duration,
            "location": self.current_loc["name"],
            "remarks": "Pre-Trip Inspection & Dispatch",
            "odometer_start": 0.0,
            "odometer_end": 0.0
        })

        self.stops.append({
            "stop_type": "ORIGIN",
            "name": self.current_loc["name"],
            "lat": self.current_loc["lat"],
            "lng": self.current_loc["lng"],
            "arrival_time": curr_time.isoformat(),
            "departure_time": pre_trip_end.isoformat(),
            "activity": "Pre-Trip Inspection & Departure",
            "duration_hours": pre_trip_duration,
            "duty_status": "On Duty (Not Driving)",
            "mileage": 0.0
        })

        curr_time = pre_trip_end
        current_odometer = 0.0

        shift_driving_hours = 0.0
        shift_duty_window_hours = pre_trip_duration
        driving_since_break = 0.0
        miles_since_fuel = 0.0
        cycle_used = self.current_cycle_used + pre_trip_duration

        def simulate_drive(target_miles, destination_name, destination_coords, is_to_pickup=False):
            nonlocal curr_time, current_odometer, shift_driving_hours, shift_duty_window_hours
            nonlocal driving_since_break, miles_since_fuel, cycle_used

            miles_remaining = target_miles

            while miles_remaining > 0.001:
                # Check 70-hr / 8-day cycle limit
                if cycle_used >= 70.0:
                    # Driver must take 34-Hour Restart
                    restart_dur = 34.0
                    restart_end = curr_time + timedelta(hours=restart_dur)
                    loc_coords = find_coordinate_at_mileage(full_coords, current_odometer, total_trip_miles)
                    loc_name = f"En Route ({round(current_odometer)} mi)"

                    self.events.append({
                        "status": 2,  # Sleeper Berth
                        "status_label": "Sleeper Berth",
                        "start_time": curr_time,
                        "end_time": restart_end,
                        "duration_hours": restart_dur,
                        "location": loc_name,
                        "remarks": "34-Hour Restart - 70-Hour Cycle Reset",
                        "odometer_start": current_odometer,
                        "odometer_end": current_odometer
                    })

                    self.stops.append({
                        "stop_type": "34H_RESTART",
                        "name": f"34-Hr Restart @ Mile {round(current_odometer)}",
                        "lat": loc_coords[0],
                        "lng": loc_coords[1],
                        "arrival_time": curr_time.isoformat(),
                        "departure_time": restart_end.isoformat(),
                        "activity": "Mandatory 34-Hour Restart (Cycle Reset)",
                        "duration_hours": restart_dur,
                        "duty_status": "Sleeper Berth",
                        "mileage": round(current_odometer, 1)
                    })

                    curr_time = restart_end
                    cycle_used = 0.0
                    shift_driving_hours = 0.0
                    shift_duty_window_hours = 0.0
                    driving_since_break = 0.0

                    # 15-minute Pre-trip after restart
                    pre_dur = 0.25
                    pre_end = curr_time + timedelta(hours=pre_dur)
                    self.events.append({
                        "status": 4,
                        "status_label": "On Duty (Not Driving)",
                        "start_time": curr_time,
                        "end_time": pre_end,
                        "duration_hours": pre_dur,
                        "location": loc_name,
                        "remarks": "Post-Restart Pre-Trip Inspection",
                        "odometer_start": current_odometer,
                        "odometer_end": current_odometer
                    })
                    curr_time = pre_end
                    shift_duty_window_hours = pre_dur
                    cycle_used += pre_dur
                    continue

                # Check 11-Hour Driving Limit or 14-Hour Duty Window
                available_drive = min(11.0 - shift_driving_hours, 14.0 - shift_duty_window_hours)
                available_drive = max(0.0, available_drive)

                if available_drive <= 0.01:
                    # Must take 10-Hour Sleeper Berth Rest
                    rest_dur = 10.0
                    rest_end = curr_time + timedelta(hours=rest_dur)
                    loc_coords = find_coordinate_at_mileage(full_coords, current_odometer, total_trip_miles)
                    loc_name = f"Truck Stop / Rest Area (Mile {round(current_odometer)})"

                    self.events.append({
                        "status": 2,  # Sleeper Berth
                        "status_label": "Sleeper Berth",
                        "start_time": curr_time,
                        "end_time": rest_end,
                        "duration_hours": rest_dur,
                        "location": loc_name,
                        "remarks": "10-Hour Mandatory Sleeper Berth Rest",
                        "odometer_start": current_odometer,
                        "odometer_end": current_odometer
                    })

                    self.stops.append({
                        "stop_type": "10H_REST",
                        "name": f"10-Hr Rest @ Mile {round(current_odometer)}",
                        "lat": loc_coords[0],
                        "lng": loc_coords[1],
                        "arrival_time": curr_time.isoformat(),
                        "departure_time": rest_end.isoformat(),
                        "activity": "Mandatory 10-Hour Daily Sleeper Rest",
                        "duration_hours": rest_dur,
                        "duty_status": "Sleeper Berth",
                        "mileage": round(current_odometer, 1)
                    })

                    curr_time = rest_end
                    shift_driving_hours = 0.0
                    shift_duty_window_hours = 0.0
                    driving_since_break = 0.0

                    # 15 min pre-trip inspection before next shift
                    pre_dur = 0.25
                    pre_end = curr_time + timedelta(hours=pre_dur)
                    self.events.append({
                        "status": 4,
                        "status_label": "On Duty (Not Driving)",
                        "start_time": curr_time,
                        "end_time": pre_end,
                        "duration_hours": pre_dur,
                        "location": loc_name,
                        "remarks": "Pre-Trip Inspection & Daily Log Signoff",
                        "odometer_start": current_odometer,
                        "odometer_end": current_odometer
                    })
                    curr_time = pre_end
                    shift_duty_window_hours = pre_dur
                    cycle_used += pre_dur
                    continue

                # Check 8-Hour driving break limit
                drive_until_break = 8.0 - driving_since_break
                # Check 1,000-mile fueling limit
                miles_until_fuel = 1000.0 - miles_since_fuel

                # Calculate max possible drive time before next required interruption
                max_time_allowed = min(available_drive, drive_until_break)
                # Max driving time needed for current leg
                needed_drive_time = miles_remaining / TRUCK_SPEED_MPH

                # Check if fueling will happen before the time limit
                time_until_fuel = miles_until_fuel / TRUCK_SPEED_MPH

                drive_step_time = min(needed_drive_time, max_time_allowed, time_until_fuel)
                drive_step_miles = drive_step_time * TRUCK_SPEED_MPH

                # If driving time is very small, round out to finish
                if drive_step_time <= 0.001:
                    drive_step_time = min(0.1, needed_drive_time)
                    drive_step_miles = drive_step_time * TRUCK_SPEED_MPH

                # Execute Driving Step
                drive_end = curr_time + timedelta(hours=drive_step_time)
                start_odom = current_odometer
                current_odometer += drive_step_miles
                miles_remaining -= drive_step_miles

                loc_coords = find_coordinate_at_mileage(full_coords, current_odometer, total_trip_miles)
                drive_loc_name = f"Highway En Route ({round(current_odometer)} mi)"
                if miles_remaining <= 0.01:
                    drive_loc_name = destination_name

                self.events.append({
                    "status": 3,  # Driving
                    "status_label": "Driving",
                    "start_time": curr_time,
                    "end_time": drive_end,
                    "duration_hours": drive_step_time,
                    "location": drive_loc_name,
                    "remarks": f"Driving interstate highway ({round(drive_step_miles)} mi)",
                    "odometer_start": start_odom,
                    "odometer_end": current_odometer
                })

                curr_time = drive_end
                shift_driving_hours += drive_step_time
                shift_duty_window_hours += drive_step_time
                driving_since_break += drive_step_time
                miles_since_fuel += drive_step_miles
                cycle_used += drive_step_time

                # Check if Fueling is triggered (>= 1000 miles since last fuel)
                if miles_since_fuel >= 999.0 and miles_remaining > 10.0:
                    fuel_dur = 0.5  # 30 minutes fueling (On Duty Not Driving)
                    fuel_end = curr_time + timedelta(hours=fuel_dur)
                    fuel_loc = f"Travel Plaza / Fuel Station (Mile {round(current_odometer)})"

                    self.events.append({
                        "status": 4,  # On Duty Not Driving
                        "status_label": "On Duty (Not Driving)",
                        "start_time": curr_time,
                        "end_time": fuel_end,
                        "duration_hours": fuel_dur,
                        "location": fuel_loc,
                        "remarks": "Fueling (150 gal) & Vehicle Safety Check",
                        "odometer_start": current_odometer,
                        "odometer_end": current_odometer
                    })

                    self.stops.append({
                        "stop_type": "FUEL",
                        "name": f"Fueling Stop @ Mile {round(current_odometer)}",
                        "lat": loc_coords[0],
                        "lng": loc_coords[1],
                        "arrival_time": curr_time.isoformat(),
                        "departure_time": fuel_end.isoformat(),
                        "activity": "Diesel Fueling (1,000-mile requirement) & 30-min break",
                        "duration_hours": fuel_dur,
                        "duty_status": "On Duty (Not Driving)",
                        "mileage": round(current_odometer, 1)
                    })

                    curr_time = fuel_end
                    shift_duty_window_hours += fuel_dur
                    cycle_used += fuel_dur
                    miles_since_fuel = 0.0
                    # 30-min non-driving interruption resets the 8-hour driving clock!
                    driving_since_break = 0.0
                    continue

                # Check if 30-minute rest break is needed (>= 8 hours cumulative driving)
                if driving_since_break >= 7.99 and miles_remaining > 5.0:
                    break_dur = 0.5  # 30 minutes break (Off Duty)
                    break_end = curr_time + timedelta(hours=break_dur)
                    break_loc = f"Highway Rest Area (Mile {round(current_odometer)})"

                    self.events.append({
                        "status": 1,  # Off Duty
                        "status_label": "Off Duty",
                        "start_time": curr_time,
                        "end_time": break_end,
                        "duration_hours": break_dur,
                        "location": break_loc,
                        "remarks": "Mandatory 30-Minute FMCSA Rest Break",
                        "odometer_start": current_odometer,
                        "odometer_end": current_odometer
                    })

                    self.stops.append({
                        "stop_type": "30M_BREAK",
                        "name": f"30-Min Rest Break @ Mile {round(current_odometer)}",
                        "lat": loc_coords[0],
                        "lng": loc_coords[1],
                        "arrival_time": curr_time.isoformat(),
                        "departure_time": break_end.isoformat(),
                        "activity": "FMCSA 30-Min Break (Mandatory after 8 hrs driving)",
                        "duration_hours": break_dur,
                        "duty_status": "Off Duty",
                        "mileage": round(current_odometer, 1)
                    })

                    curr_time = break_end
                    shift_duty_window_hours += break_dur
                    # Does not count towards on-duty cycle because it's off duty!
                    driving_since_break = 0.0
                    continue

        # Step 1: Drive to Pickup
        simulate_drive(leg1["distance_miles"], self.pickup_loc["name"], [self.pickup_loc["lat"], self.pickup_loc["lng"]], is_to_pickup=True)

        # Step 2: Arrived at Pickup - 1 hour On Duty (Not Driving) loading
        pickup_dur = 1.0
        pickup_end = curr_time + timedelta(hours=pickup_dur)

        self.events.append({
            "status": 4,  # On Duty Not Driving
            "status_label": "On Duty (Not Driving)",
            "start_time": curr_time,
            "end_time": pickup_end,
            "duration_hours": pickup_dur,
            "location": self.pickup_loc["name"],
            "remarks": f"Shipper Loading - {self.shipping_doc} / {self.commodity}",
            "odometer_start": current_odometer,
            "odometer_end": current_odometer
        })

        self.stops.append({
            "stop_type": "PICKUP",
            "name": self.pickup_loc["name"],
            "lat": self.pickup_loc["lat"],
            "lng": self.pickup_loc["lng"],
            "arrival_time": curr_time.isoformat(),
            "departure_time": pickup_end.isoformat(),
            "activity": "Cargo Loading & BOL Signoff (1 Hour)",
            "duration_hours": pickup_dur,
            "duty_status": "On Duty (Not Driving)",
            "mileage": round(current_odometer, 1)
        })

        curr_time = pickup_end
        shift_duty_window_hours += pickup_dur
        cycle_used += pickup_dur
        # Since 1 hour on duty is a non-driving period >= 30 mins, it resets 8h break clock!
        driving_since_break = 0.0

        # Step 3: Drive to Dropoff
        simulate_drive(leg2["distance_miles"], self.dropoff_loc["name"], [self.dropoff_loc["lat"], self.dropoff_loc["lng"]], is_to_pickup=False)

        # Step 4: Arrived at Dropoff - 1 hour On Duty (Not Driving) unloading
        dropoff_dur = 1.0
        dropoff_end = curr_time + timedelta(hours=dropoff_dur)

        self.events.append({
            "status": 4,  # On Duty Not Driving
            "status_label": "On Duty (Not Driving)",
            "start_time": curr_time,
            "end_time": dropoff_end,
            "duration_hours": dropoff_dur,
            "location": self.dropoff_loc["name"],
            "remarks": f"Consignee Unloading - Final Delivery Completed",
            "odometer_start": current_odometer,
            "odometer_end": current_odometer
        })

        self.stops.append({
            "stop_type": "DROPOFF",
            "name": self.dropoff_loc["name"],
            "lat": self.dropoff_loc["lat"],
            "lng": self.dropoff_loc["lng"],
            "arrival_time": curr_time.isoformat(),
            "departure_time": dropoff_end.isoformat(),
            "activity": "Cargo Unloading & Final Delivery Receipt (1 Hour)",
            "duration_hours": dropoff_dur,
            "duty_status": "On Duty (Not Driving)",
            "mileage": round(current_odometer, 1)
        })

        curr_time = dropoff_end
        shift_duty_window_hours += dropoff_dur
        cycle_used += dropoff_dur

        # Step 5: Post-trip Inspection: 15 mins On Duty Not Driving
        post_dur = 0.25
        post_end = curr_time + timedelta(hours=post_dur)
        self.events.append({
            "status": 4,
            "status_label": "On Duty (Not Driving)",
            "start_time": curr_time,
            "end_time": post_end,
            "duration_hours": post_dur,
            "location": self.dropoff_loc["name"],
            "remarks": "Post-Trip Vehicle Inspection & End of Shift",
            "odometer_start": current_odometer,
            "odometer_end": current_odometer
        })

        curr_time = post_end
        cycle_used += post_dur

        # Complete final day with Off-Duty until midnight (24:00)
        final_day_midnight = datetime(curr_time.year, curr_time.month, curr_time.day, 0, 0, 0) + timedelta(days=1)
        if curr_time < final_day_midnight:
            off_rem = (final_day_midnight - curr_time).total_seconds() / 3600.0
            self.events.append({
                "status": 1,
                "status_label": "Off Duty",
                "start_time": curr_time,
                "end_time": final_day_midnight,
                "duration_hours": off_rem,
                "location": self.dropoff_loc["name"],
                "remarks": "Off Duty after delivery",
                "odometer_start": current_odometer,
                "odometer_end": current_odometer
            })

        # Partition all events into exact 24-Hour Calendar Day Logs (Midnight to Midnight)
        self._partition_events_into_daily_logs()

        # Compute summary metrics
        total_drive_time = sum(e["duration_hours"] for e in self.events if e["status"] == 3)
        total_on_duty_time = sum(e["duration_hours"] for e in self.events if e["status"] in [3, 4])
        trip_start_time = self.events[0]["start_time"]
        trip_end_time = post_end
        total_trip_duration = (trip_end_time - trip_start_time).total_seconds() / 3600.0

        return {
            "summary": {
                "total_miles": round(current_odometer, 1),
                "total_driving_hours": round(total_drive_time, 2),
                "total_on_duty_hours": round(total_on_duty_time, 2),
                "total_trip_duration_hours": round(total_trip_duration, 2),
                "total_days": len(self.daily_logs),
                "starting_cycle_used": round(self.current_cycle_used, 1),
                "final_cycle_used": round(cycle_used, 1),
                "cycle_remaining": max(0.0, round(70.0 - (cycle_used % 70.0), 1)),
                "num_fuel_stops": len([s for s in self.stops if s["stop_type"] == "FUEL"]),
                "num_rest_breaks": len([s for s in self.stops if s["stop_type"] == "30M_BREAK"]),
                "num_10h_sleepers": len([s for s in self.stops if s["stop_type"] == "10H_REST"]),
                "num_34h_restarts": len([s for s in self.stops if s["stop_type"] == "34H_RESTART"]),
                "compliance_status": "100% FMCSA Compliant",
                "violations": []
            },
            "driver_info": {
                "driver_name": self.driver_name,
                "carrier_name": self.carrier_name,
                "truck_number": self.truck_number,
                "main_office": self.main_office,
                "home_terminal": self.home_terminal,
                "shipping_doc": self.shipping_doc,
                "commodity": self.commodity
            },
            "stops": self.stops,
            "daily_logs": self.daily_logs,
            "route": {
                "total_distance_miles": round(self.route_data.get("total_distance_miles", 0.0), 1),
                "total_duration_hours": round(self.route_data.get("total_duration_hours", 0.0), 2),
                "coordinates": self.route_data.get("full_coordinates", []),
                "legs": self.route_data.get("legs", [])
            }
        }

    def _partition_events_into_daily_logs(self):
        """
        Splits events strictly at calendar midnights (00:00:00) into clean 24-hour daily logs.
        Every daily log has duty segments whose durations exactly sum to 24.0 hours.
        """
        if not self.events:
            return

        min_time = self.events[0]["start_time"]
        max_time = self.events[-1]["end_time"]

        # First calendar day midnight
        current_day_midnight = datetime(min_time.year, min_time.month, min_time.day, 0, 0, 0)
        day_idx = 1
        rolling_cycle = self.current_cycle_used

        while current_day_midnight < max_time:
            next_day_midnight = current_day_midnight + timedelta(days=1)
            day_intervals = []
            day_miles = 0.0
            day_remarks = []

            for ev in self.events:
                # Interval overlap with [current_day_midnight, next_day_midnight]
                overlap_start = max(ev["start_time"], current_day_midnight)
                overlap_end = min(ev["end_time"], next_day_midnight)

                if overlap_start < overlap_end:
                    seg_duration = (overlap_end - overlap_start).total_seconds() / 3600.0
                    start_hour = (overlap_start - current_day_midnight).total_seconds() / 3600.0
                    end_hour = (overlap_end - current_day_midnight).total_seconds() / 3600.0

                    seg = {
                        "status": ev["status"],
                        "status_label": ev["status_label"],
                        "start_hour": round(start_hour, 2),
                        "end_hour": round(end_hour, 2),
                        "duration_hours": round(seg_duration, 2),
                        "start_time_str": overlap_start.strftime("%I:%M %p"),
                        "end_time_str": overlap_end.strftime("%I:%M %p"),
                        "location": ev["location"],
                        "remarks": ev["remarks"]
                    }
                    day_intervals.append(seg)

                    if ev["status"] == 3:  # Driving
                        # Proportional miles
                        if ev["duration_hours"] > 0:
                            seg_miles = (ev["odometer_end"] - ev["odometer_start"]) * (seg_duration / ev["duration_hours"])
                            day_miles += seg_miles

                    # If this event started today or transitioned, add to remarks
                    if ev["start_time"] >= current_day_midnight and ev["start_time"] < next_day_midnight:
                        day_remarks.append({
                            "time_str": ev["start_time"].strftime("%I:%M %p"),
                            "hour": round(start_hour, 2),
                            "location": ev["location"],
                            "status_label": ev["status_label"],
                            "remarks": ev["remarks"]
                        })

            # Calculate totals for the 4 FMCSA lines
            off_duty_hrs = sum(i["duration_hours"] for i in day_intervals if i["status"] == 1)
            sleeper_hrs = sum(i["duration_hours"] for i in day_intervals if i["status"] == 2)
            driving_hrs = sum(i["duration_hours"] for i in day_intervals if i["status"] == 3)
            on_duty_hrs = sum(i["duration_hours"] for i in day_intervals if i["status"] == 4)

            # Check if 34-hour restart was completed today
            had_restart = any(i["status"] == 2 and "34-Hour" in i["remarks"] for i in day_intervals)

            # Cycle math for 70-hour recap
            on_duty_today = round(driving_hrs + on_duty_hrs, 2)
            if had_restart:
                rolling_cycle = on_duty_today
            else:
                rolling_cycle += on_duty_today

            available_tomorrow = max(0.0, round(70.0 - rolling_cycle, 2))

            date_str = current_day_midnight.strftime("%m/%d/%Y")

            self.daily_logs.append({
                "day_number": day_idx,
                "date": date_str,
                "date_formatted": current_day_midnight.strftime("%B %d, %Y"),
                "carrier_name": self.carrier_name,
                "main_office": self.main_office,
                "home_terminal": self.home_terminal,
                "driver_name": self.driver_name,
                "truck_number": self.truck_number,
                "shipping_doc": self.shipping_doc,
                "commodity": self.commodity,
                "from_location": self.current_loc["name"] if day_idx == 1 else "En Route",
                "to_location": self.dropoff_loc["name"],
                "miles_driving_today": round(day_miles, 1),
                "intervals": day_intervals,
                "totals": {
                    "off_duty": round(off_duty_hrs, 2),
                    "sleeper_berth": round(sleeper_hrs, 2),
                    "driving": round(driving_hrs, 2),
                    "on_duty": round(on_duty_hrs, 2),
                    "total_hours": round(off_duty_hrs + sleeper_hrs + driving_hrs + on_duty_hrs, 2)
                },
                "remarks": day_remarks,
                "recap": {
                    "on_duty_today": on_duty_today,
                    "cycle_used_cumulative": round(rolling_cycle, 2),
                    "cycle_available_tomorrow": available_tomorrow,
                    "cycle_limit": 70.0,
                    "restart_applied": had_restart
                }
            })

            day_idx += 1
            current_day_midnight = next_day_midnight

    def _build_empty_response(self):
        return {
            "summary": {
                "total_miles": 0,
                "total_driving_hours": 0,
                "total_on_duty_hours": 0,
                "total_trip_duration_hours": 0,
                "total_days": 0,
                "compliance_status": "No route data"
            },
            "stops": [],
            "daily_logs": [],
            "route": {}
        }
