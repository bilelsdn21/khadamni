# map.py — Map / Geolocation Router
#
# Prefix: /api/map
#
# Endpoints to build:
#
# 1. GET  /nearby          — Find providers near a location
#                            Query params: lat, lng, radius_km, category
#                            Uses MongoDB $geoNear or $geoWithin
#
# 2. POST /update-location — Update provider's current GPS location (requires auth)
#                            Body: { latitude, longitude }
#
# Create the router:
#   router = APIRouter(prefix="/api/map", tags=["Map"])
