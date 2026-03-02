# providers.py — Provider Profile Router
#
# Prefix: /api/providers
#
# Endpoints to build:
#
# 1. POST /              — Create provider profile (requires auth, role=provider)
# 2. GET  /me            — Get own provider profile (requires auth)
# 3. PUT  /me            — Update own provider profile (requires auth)
# 4. GET  /{provider_id} — Get public provider profile
# 5. GET  /              — List/search providers with filters and pagination
#
# Create the router:
#   router = APIRouter(prefix="/api/providers", tags=["Providers"])
