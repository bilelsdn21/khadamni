# users.py — User Profile Router
#
# Prefix: /api/users
#
# Endpoints to build:
#
# 1. GET    /me          — Get current user's profile (requires auth)
# 2. PUT    /me          — Update current user's profile (requires auth)
# 3. GET    /{user_id}   — Get public profile of any user
# 4. DELETE /me          — Delete current user's account (requires auth)
#
# All protected endpoints use: Depends(get_current_user)
#
# Create the router:
#   router = APIRouter(prefix="/api/users", tags=["Users"])
