# map_service.py — Geospatial Business Logic
#
# Functions to build:
#
# 1. find_nearby_providers(lat, lng, radius_km, category)
#      — Use MongoDB $geoNear or $geoWithin with 2dsphere index
#      — Return providers sorted by distance
#      — Filter by category and availability
#
# 2. update_provider_location(user_id, lat, lng)
#      — Update the provider's GeoJSON location in MongoDB
#      — Format: { type: "Point", coordinates: [lng, lat] }
#
# Key MongoDB concept: geospatial queries with 2dsphere indexes
