# jobs.py — Job History Router
#
# Prefix: /api/jobs
#
# Endpoints to build:
#
# 1. GET /          — List user's jobs with filters (status, date range)
# 2. GET /{id}      — Get full job details (request + chat + rating)
# 3. GET /stats     — Get user's job statistics (total, completed, etc.)
#
# Create the router:
#   router = APIRouter(prefix="/api/jobs", tags=["Jobs"])
