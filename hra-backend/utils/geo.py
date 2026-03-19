"""
Geolocation utilities for attendance validation.
All geo validation runs server-side — never trust client-only checks.
"""
import math
from django.conf import settings


def haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Calculate the great-circle distance (km) between two points
    using the Haversine formula.
    """
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lng2 - lng1)

    a = (math.sin(d_phi / 2) ** 2
         + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2)

    return 2 * R * math.asin(math.sqrt(a))


def is_within_office_radius(lat: float, lng: float) -> tuple[bool, float]:
    """
    Check whether given coordinates are within the configured office radius.
    Returns (is_valid, distance_km).
    """
    office_lat = settings.OFFICE_LATITUDE
    office_lng = settings.OFFICE_LONGITUDE
    radius_km = settings.OFFICE_RADIUS_KM

    distance = haversine_distance(office_lat, office_lng, lat, lng)
    return distance <= radius_km, round(distance, 4)


def validate_coordinates(lat: float, lng: float) -> bool:
    """Basic coordinate bounds check."""
    return -90 <= lat <= 90 and -180 <= lng <= 180
