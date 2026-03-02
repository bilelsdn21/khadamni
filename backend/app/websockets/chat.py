# chat.py — Chat WebSocket Endpoint
#
# What to build here:
#
# 1. Create a WebSocket endpoint: /ws/chat/{room_id}/{user_id}
# 2. On connect:
#      - Validate JWT token
#      - Verify user is a participant of this chat room
#      - Register connection
# 3. While connected:
#      - Receive messages from this user
#      - Save messages to MongoDB via chat_service
#      - Broadcast to other participants in the room
#      - Handle typing indicators
# 4. On disconnect:
#      - Clean up connection
#      - Notify other participant
