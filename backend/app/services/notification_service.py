# notification_service.py — Notification Business Logic
#
# Functions to build:
#
# 1. create_notification(user_id, title, body, type, reference_id)
#      — Save to DB and push via WebSocket if user is online
# 2. get_user_notifications(user_id, page) — Paginated notification list
# 3. get_unread_count(user_id) — Count unread notifications
# 4. mark_as_read(user_id, notification_ids) — Mark specific or all as read
# 5. delete_notification(notification_id) — Remove a notification
