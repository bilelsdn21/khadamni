# dependencies.py — Shared FastAPI Dependencies
#
# What to build here:
#
# 1. Import HTTPBearer from fastapi.security
# 2. Import your verify_token from app.utils.security
# 3. Import get_db from app.database
# 4. Create a get_current_user dependency that:
#      - Extracts the Bearer token from the Authorization header
#      - Verifies the JWT token using verify_token()
#      - Looks up the user in MongoDB by the "sub" claim
#      - Returns the user dict, or raises 401 if invalid
# 5. This dependency will be used in routers: Depends(get_current_user)
#
# Packages to learn:
#   - fastapi (Depends, HTTPException, status)
#   - fastapi.security (HTTPBearer, HTTPAuthorizationCredentials)
