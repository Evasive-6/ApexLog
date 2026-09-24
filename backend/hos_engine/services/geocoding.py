import os
import requests
import math
import logging

logger = logging.getLogger(__name__)

# Curated fallback coordinates for instant offline / rate-limit resilience
MAJOR_US_CITIES = {
    "new york, ny": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY, USA"},
    "new york": {"lat": 40.7128, "lng": -74.0060, "display_name": "New York, NY, USA"},
    "los angeles, ca": {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, CA, USA"},
    "los angeles": {"lat": 34.0522, "lng": -118.2437, "display_name": "Los Angeles, CA, USA"},
    "chicago, il": {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL, USA"},
    "chicago": {"lat": 41.8781, "lng": -87.6298, "display_name": "Chicago, IL, USA"},
    "houston, tx": {"lat": 29.7604, "lng": -95.3698, "display_name": "Houston, TX, USA"},
    "houston": {"lat": 29.7604, "lng": -95.3698, "display_name": "Houston, TX, USA"},
    "phoenix, az": {"lat": 33.4484, "lng": -112.0740, "display_name": "Phoenix, AZ, USA"},
    "phoenix": {"lat": 33.4484, "lng": -112.0740, "display_name": "Phoenix, AZ, USA"},
    "philadelphia, pa": {"lat": 39.9526, "lng": -75.1652, "display_name": "Philadelphia, PA, USA"},
    "philadelphia": {"lat": 39.9526, "lng": -75.1652, "display_name": "Philadelphia, PA, USA"},
    "san antonio, tx": {"lat": 29.4241, "lng": -98.4936, "display_name": "San Antonio, TX, USA"},
    "san diego, ca": {"lat": 32.7157, "lng": -117.1611, "display_name": "San Diego, CA, USA"},
    "dallas, tx": {"lat": 32.7767, "lng": -96.7970, "display_name": "Dallas, TX, USA"},
    "dallas": {"lat": 32.7767, "lng": -96.7970, "display_name": "Dallas, TX, USA"},
    "austin, tx": {"lat": 30.2672, "lng": -97.7431, "display_name": "Austin, TX, USA"},
    "jacksonville, fl": {"lat": 30.3322, "lng": -81.6557, "display_name": "Jacksonville, FL, USA"},
    "fort worth, tx": {"lat": 32.7555, "lng": -97.3308, "display_name": "Fort Worth, TX, USA"},
    "columbus, oh": {"lat": 39.9612, "lng": -82.9988, "display_name": "Columbus, OH, USA"},
    "columbus": {"lat": 39.9612, "lng": -82.9988, "display_name": "Columbus, OH, USA"},
    "charlotte, nc": {"lat": 35.2271, "lng": -80.8431, "display_name": "Charlotte, NC, USA"},
    "charlotte": {"lat": 35.2271, "lng": -80.8431, "display_name": "Charlotte, NC, USA"},
    "san francisco, ca": {"lat": 37.7749, "lng": -122.4194, "display_name": "San Francisco, CA, USA"},
    "indianapolis, in": {"lat": 39.7684, "lng": -86.1581, "display_name": "Indianapolis, IN, USA"},
    "indianapolis": {"lat": 39.7684, "lng": -86.1581, "display_name": "Indianapolis, IN, USA"},
    "seattle, wa": {"lat": 47.6062, "lng": -122.3321, "display_name": "Seattle, WA, USA"},
    "seattle": {"lat": 47.6062, "lng": -122.3321, "display_name": "Seattle, WA, USA"},
    "denver, co": {"lat": 39.7392, "lng": -104.9903, "display_name": "Denver, CO, USA"},
    "denver": {"lat": 39.7392, "lng": -104.9903, "display_name": "Denver, CO, USA"},
    "washington, dc": {"lat": 38.9072, "lng": -77.0369, "display_name": "Washington, DC, USA"},
    "boston, ma": {"lat": 42.3601, "lng": -71.0589, "display_name": "Boston, MA, USA"},
    "boston": {"lat": 42.3601, "lng": -71.0589, "display_name": "Boston, MA, USA"},
    "el paso, tx": {"lat": 31.7619, "lng": -106.4850, "display_name": "El Paso, TX, USA"},
    "nashville, tn": {"lat": 36.1627, "lng": -86.7816, "display_name": "Nashville, TN, USA"},
    "nashville": {"lat": 36.1627, "lng": -86.7816, "display_name": "Nashville, TN, USA"},
    "detroit, mi": {"lat": 42.3314, "lng": -83.0458, "display_name": "Detroit, MI, USA"},
    "oklahoma city, ok": {"lat": 35.4676, "lng": -97.5164, "display_name": "Oklahoma City, OK, USA"},
    "portland, or": {"lat": 45.5152, "lng": -122.6784, "display_name": "Portland, OR, USA"},
    "las vegas, nv": {"lat": 36.1699, "lng": -115.1398, "display_name": "Las Vegas, NV, USA"},
    "las vegas": {"lat": 36.1699, "lng": -115.1398, "display_name": "Las Vegas, NV, USA"},
    "memphis, tn": {"lat": 35.1495, "lng": -90.0490, "display_name": "Memphis, TN, USA"},
    "louisville, ky": {"lat": 38.2527, "lng": -85.7585, "display_name": "Louisville, KY, USA"},
    "baltimore, md": {"lat": 39.2904, "lng": -76.6122, "display_name": "Baltimore, MD, USA"},
    "milwaukee, wi": {"lat": 43.0389, "lng": -87.9065, "display_name": "Milwaukee, WI, USA"},
    "albuquerque, nm": {"lat": 35.0844, "lng": -106.6504, "display_name": "Albuquerque, NM, USA"},
    "tucson, az": {"lat": 32.2226, "lng": -110.9747, "display_name": "Tucson, AZ, USA"},
    "fresno, ca": {"lat": 36.7468, "lng": -119.7726, "display_name": "Fresno, CA, USA"},
    "sacramento, ca": {"lat": 38.5816, "lng": -121.4944, "display_name": "Sacramento, CA, USA"},
    "kansas city, mo": {"lat": 39.0997, "lng": -94.5786, "display_name": "Kansas City, MO, USA"},
    "mesa, az": {"lat": 33.4152, "lng": -111.8315, "display_name": "Mesa, AZ, USA"},
    "atlanta, ga": {"lat": 33.7490, "lng": -84.3880, "display_name": "Atlanta, GA, USA"},
    "atlanta": {"lat": 33.7490, "lng": -84.3880, "display_name": "Atlanta, GA, USA"},
    "omaha, ne": {"lat": 41.2565, "lng": -95.9345, "display_name": "Omaha, NE, USA"},
    "raleigh, nc": {"lat": 35.7796, "lng": -78.6382, "display_name": "Raleigh, NC, USA"},
    "miami, fl": {"lat": 25.7617, "lng": -80.1918, "display_name": "Miami, FL, USA"},
    "miami": {"lat": 25.7617, "lng": -80.1918, "display_name": "Miami, FL, USA"},
    "minneapolis, mn": {"lat": 44.9778, "lng": -93.2650, "display_name": "Minneapolis, MN, USA"},
    "cleveland, oh": {"lat": 41.4993, "lng": -81.6944, "display_name": "Cleveland, OH, USA"},
    "tulsa, ok": {"lat": 36.1540, "lng": -95.9928, "display_name": "Tulsa, OK, USA"},
    "orlando, fl": {"lat": 28.5383, "lng": -81.3792, "display_name": "Orlando, FL, USA"},
    "tampa, fl": {"lat": 27.9506, "lng": -82.4572, "display_name": "Tampa, FL, USA"},
    "new orleans, la": {"lat": 29.9511, "lng": -90.0715, "display_name": "New Orleans, LA, USA"},
    "salt lake city, ut": {"lat": 40.7608, "lng": -111.8910, "display_name": "Salt Lake City, UT, USA"},
    "pittsburgh, pa": {"lat": 40.4406, "lng": -79.9959, "display_name": "Pittsburgh, PA, USA"},
    "cincinnati, oh": {"lat": 39.1031, "lng": -84.5120, "display_name": "Cincinnati, OH, USA"},
    "st. louis, mo": {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, MO, USA"},
    "saint louis, mo": {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, MO, USA"},
    "st louis": {"lat": 38.6270, "lng": -90.1994, "display_name": "St. Louis, MO, USA"},
    "richmond, va": {"lat": 37.5407, "lng": -77.4360, "display_name": "Richmond, VA, USA"},
    "newark, nj": {"lat": 40.7357, "lng": -74.1724, "display_name": "Newark, NJ, USA"},
    "fredericksburg, va": {"lat": 38.3032, "lng": -77.4605, "display_name": "Fredericksburg, VA, USA"},
    "cherry hill, nj": {"lat": 39.9348, "lng": -74.9782, "display_name": "Cherry Hill, NJ, USA"},
}

_GEO_CACHE = {}

def geocode_location(query: str):
    """
    Geocodes a location query string to {lat, lng, display_name, city, state}.
    Tries Nominatim OpenStreetMap first with User-Agent, falls back to offline dictionary.
    """
    if not query:
        raise ValueError("Location query is empty")
    
    clean_q = query.strip()
    cache_key = clean_q.lower()
    
    if cache_key in _GEO_CACHE:
        return _GEO_CACHE[cache_key]

    # Check fallback dictionary directly first if exact match
    if cache_key in MAJOR_US_CITIES:
        data = MAJOR_US_CITIES[cache_key]
        res = {
            "lat": data["lat"],
            "lng": data["lng"],
            "display_name": data["display_name"],
            "name": clean_q
        }
        _GEO_CACHE[cache_key] = res
        return res

    # Attempt OpenStreetMap Nominatim
    try:
        url = "https://nominatim.openstreetmap.org/search"
        headers = {
            "User-Agent": "ApexLog-Trucker-HOS-Application/1.0 (contact@trucker-hos.dev)"
        }
        params = {
            "q": clean_q,
            "format": "json",
            "limit": 1,
            "countrycodes": "us,ca,mx"
        }
        resp = requests.get(url, params=params, headers=headers, timeout=5)
        if resp.status_code == 200:
            results = resp.json()
            if results and len(results) > 0:
                first = results[0]
                res = {
                    "lat": float(first["lat"]),
                    "lng": float(first["lon"]),
                    "display_name": first.get("display_name", clean_q),
                    "name": clean_q
                }
                _GEO_CACHE[cache_key] = res
                return res
    except Exception as e:
        logger.warning(f"Nominatim geocoding failed for '{query}': {e}")

    # Partial search in offline list
    for key, val in MAJOR_US_CITIES.items():
        if key in cache_key or cache_key in key:
            res = {
                "lat": val["lat"],
                "lng": val["lng"],
                "display_name": val["display_name"],
                "name": clean_q
            }
            _GEO_CACHE[cache_key] = res
            return res

    # If completely unknown, return default central US coordinates (Kansas City) with warning
    res = {
        "lat": 39.0997,
        "lng": -94.5786,
        "display_name": f"{clean_q} (Approximate US location)",
        "name": clean_q
    }
    _GEO_CACHE[cache_key] = res
    return res
