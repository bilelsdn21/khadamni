# message.py — Chat Message Pydantic Schemas
#
# What to build here:
#
# 1. MessageCreate — sending a message
#      Fields: chat_room_id, content, message_type (text/image/location/system)
#
# 2. MessageResponse — data returned to frontend
#      Fields: id, chat_room_id, sender_id, content, message_type, is_read, created_at
#
# 3. ChatRoomResponse — a chat room between client and provider
#      Fields: id, request_id, participants (list), last_message, unread_count, created_at
#
# 4. MessageList — paginated message list
#      Fields: items (list), total, page, per_page
