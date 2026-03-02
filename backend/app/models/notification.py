# notification.py — Notification Pydantic Schemas
#
# What to build here:
#
# 1. NotificationCreate — create a notification (internal use)
#      Fields: user_id, title, body, notification_type (general/request/chat/rating/system),
#              reference_id (optional — links to request_id, chat_room_id, etc.)
#
# 2. NotificationResponse — data returned to frontend
#      Fields: id, user_id, title, body, notification_type, reference_id, is_read, created_at
#
# 3. NotificationList — paginated list
#      Fields: items (list), total, unread_count, page, per_page
#
# 4. NotificationMarkRead — mark notifications as read
#      Fields: notification_ids (list), mark_all (bool)
