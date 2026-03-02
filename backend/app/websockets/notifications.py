# notifications.py — Notifications WebSocket Endpoint
#
# What to build here:
#
# 1. Create a WebSocket endpoint: /ws/notifications/{user_id}
# 2. On connect:
#      - Validate the JWT token from query params (?token=xxx)
#      - Register connection in ConnectionManager
# 3. While connected:
#      - Listen for incoming messages (acknowledgements, mark-read)
#      - Server pushes notifications when they happen
# 4. On disconnect:
#      - Remove from ConnectionManager
#
# This stays open as long as the user is logged in
