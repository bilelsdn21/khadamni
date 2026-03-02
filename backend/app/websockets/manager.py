# manager.py — WebSocket Connection Manager
#
# What to build here:
#
# 1. Create a ConnectionManager class that tracks all active WebSocket connections
# 2. It should have:
#      - self.active_connections: dict mapping user_id → list of WebSocket objects
#      - connect(user_id, websocket) — Accept and store the connection
#      - disconnect(user_id, websocket) — Remove the connection
#      - send_personal(user_id, message) — Send JSON to a specific user
#      - broadcast(message) — Send to all connected users
#      - is_user_online(user_id) — Check if user has active connections
#
# 3. Create a singleton instance: manager = ConnectionManager()
#
# This is the core of all real-time features in Khadamni
