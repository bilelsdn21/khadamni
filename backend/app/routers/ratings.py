# ratings.py — Rating & Review Router
#
# Prefix: /api/ratings
#
# Endpoints to build:
#
# 1. POST /             — Submit a rating for a completed job (requires auth)
# 2. GET  /user/{id}    — Get all ratings for a specific user
# 3. GET  /user/{id}/summary — Get aggregated rating stats
# 4. GET  /job/{id}     — Get ratings for a specific job
#
# Create the router:
#   router = APIRouter(prefix="/api/ratings", tags=["Ratings"])
