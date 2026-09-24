import math
import requests
import logging

logger = logging.getLogger(__name__)

EARTH_RADIUS_MILES = 3958.8

def haversine_distance_miles(lat1, lon1, lat2, lon2):
    """Calculates great circle distance between two points in miles."""
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return EARTH_RADIUS_MILES * c

def interpolate_points(coord1, coord2, num_steps=20):
    """Interpolates coordinates between two points."""
    points = []
    lat1, lon1 = coord1
    lat2, lon2 = coord2
    for i in range(num_steps + 1):
        t = i / float(num_steps)
        lat = lat1 + (lat2 - lat1) * t
        lon = lon1 + (lon2 - lon1) * t
        points.append([lat, lon])
    return points

def get_route_between_waypoints(waypoints):
    """
    waypoints is a list of dicts: [{'lat': float, 'lng': float, 'name': str}, ...]
    Returns dict:
    {
      'legs': [
         {
            'from_name': str,
            'to_name': str,
            'distance_miles': float,
            'duration_hours': float,
            'coordinates': [[lat, lng], ...]
         }
      ],
      'total_distance_miles': float,
      'total_duration_hours': float,
      'full_coordinates': [[lat, lng], ...]
    }
    """
    legs = []
    full_coords = []
    total_dist = 0.0
    total_dur = 0.0

    for i in range(len(waypoints) - 1):
        p1 = waypoints[i]
        p2 = waypoints[i + 1]

        leg_dist = 0.0
        leg_dur = 0.0
        leg_coords = []

        # Try OSRM route API
        try:
            url = f"https://router.project-osrm.org/route/v1/driving/{p1['lng']},{p1['lat']};{p2['lng']},{p2['lat']}?overview=full&geometries=geojson"
            resp = requests.get(url, timeout=7)
            if resp.status_code == 200:
                data = resp.json()
                if data.get("routes") and len(data["routes"]) > 0:
                    route = data["routes"][0]
                    # distance in meters -> miles
                    leg_dist = route["distance"] * 0.000621371
                    # duration in seconds -> hours (commercial trucks generally travel ~55 mph avg with traffic/grades)
                    raw_hours = route["duration"] / 3600.0
                    # Standard truck speed adjustment (OSRM car speeds are often ~65-70mph)
                    # Truck average speed on US interstates is ~55-58 mph
                    leg_dur = max(raw_hours * 1.12, leg_dist / 55.0)

                    # geojson coordinates are [lon, lat], convert to [lat, lng]
                    raw_coords = route["geometry"]["coordinates"]
                    leg_coords = [[pt[1], pt[0]] for pt in raw_coords]
        except Exception as e:
            logger.warning(f"OSRM routing failed for leg {p1['name']} -> {p2['name']}: {e}")

        # Fallback if OSRM failed or empty
        if not leg_coords or leg_dist <= 0:
            crow_miles = haversine_distance_miles(p1['lat'], p1['lng'], p2['lat'], p2['lng'])
            # Highway road winding factor ~ 1.22
            leg_dist = crow_miles * 1.22
            leg_dur = leg_dist / 55.0  # standard 55 mph
            steps = max(15, int(leg_dist / 25))
            leg_coords = interpolate_points([p1['lat'], p1['lng']], [p2['lat'], p2['lng']], steps)

        legs.append({
            "from_name": p1["name"],
            "to_name": p2["name"],
            "from_coords": [p1["lat"], p1["lng"]],
            "to_coords": [p2["lat"], p2["lng"]],
            "distance_miles": round(leg_dist, 1),
            "duration_hours": round(leg_dur, 2),
            "coordinates": leg_coords
        })

        total_dist += leg_dist
        total_dur += leg_dur

        if not full_coords:
            full_coords.extend(leg_coords)
        else:
            full_coords.extend(leg_coords[1:])

    return {
        "legs": legs,
        "total_distance_miles": round(total_dist, 1),
        "total_duration_hours": round(total_dur, 2),
        "full_coordinates": full_coords
    }

def find_coordinate_at_mileage(full_coordinates, target_mile, total_miles):
    """
    Given an array of [lat, lng] representing the route, find an interpolated
    coordinate at approximately target_mile.
    """
    if not full_coordinates:
        return [0.0, 0.0]
    if target_mile <= 0 or total_miles <= 0:
        return full_coordinates[0]
    if target_mile >= total_miles:
        return full_coordinates[-1]

    ratio = min(max(target_mile / float(total_miles), 0.0), 1.0)
    idx = int(ratio * (len(full_coordinates) - 1))
    return full_coordinates[idx]
