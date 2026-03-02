# request.py — Service Request Pydantic Schemas
#
# What to build here:
#
# 1. ServiceRequestCreate — client sends a request to a provider
#      Fields: provider_id, title, description, location_lat, location_lng, proposed_price
#
# 2. ServiceRequestUpdate — update request status
#      Fields: status (pending/accepted/in_progress/completed/cancelled), proposed_price
#
# 3. ServiceRequestResponse — data returned to frontend
#      Fields: id, client_id, provider_id, title, description, status,
#              location_lat, location_lng, proposed_price, created_at, updated_at
#
# 4. ServiceRequestList — paginated list
#      Fields: items (list), total, page, per_page
#
# Remember the state machine:
#   PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
#   PENDING → REJECTED / CANCELLED
