# location_service.py — Live Location Tracking Business Logic
#
# Functions to build:
#
# 1. update_provider_location(user_id, lat, lng) — Store latest GPS position
# 2. get_provider_location(user_id) — Get current location
# 3. get_providers_in_bounds(sw_lat, sw_lng, ne_lat, ne_lng) — Providers in map viewport
# 4. calculate_distance(lat1, lng1, lat2, lng2) — Use haversine from utils.geo
#
# This service is used by the WebSocket location handler
