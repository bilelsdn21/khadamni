# chat_service.py — Chat Business Logic
#
# Functions to build:
#
# 1. get_or_create_chat_room(request_id, participants) — Find or create chat room
# 2. get_user_chat_rooms(user_id) — List all rooms for a user
# 3. get_room_messages(room_id, page, per_page) — Paginated message history
# 4. save_message(room_id, sender_id, content, type) — Save message to DB
# 5. mark_messages_as_read(room_id, user_id) — Update is_read flag
