# requests.py — Service Request Router
#
# Prefix: /api/requests
#
# Endpoints to build:
#
# 1. POST /              — Create a service request (client → provider)
# 2. GET  /my            — List current user's requests (as client or provider)
# 3. GET  /{id}          — Get request details
# 4. PUT  /{id}          — Update request (status, price)
# 5. POST /{id}/accept   — Provider accepts a request
# 6. POST /{id}/complete — Mark job as complete (both parties must confirm)
# 7. POST /{id}/cancel   — Cancel a request
#
# Create the router:
#   router = APIRouter(prefix="/api/requests", tags=["Requests"])
