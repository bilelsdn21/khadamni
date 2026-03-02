# chat.py — Chat Router
#
# Prefix: /api/chat
#
# Endpoints to build:
#
# 1. GET  /rooms              — List user's chat rooms (requires auth)
# 2. GET  /rooms/{id}         — Get chat room details
# 3. GET  /rooms/{id}/messages — Get paginated messages in a room
# 4. POST /rooms/{id}/messages — Send a message (REST fallback, main chat is WebSocket)
# 5. POST /rooms/{id}/read    — Mark messages as read
#
# Create the router:
#   router = APIRouter(prefix="/api/chat", tags=["Chat"])
