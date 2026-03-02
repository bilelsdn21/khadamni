# request_service.py — Service Request Business Logic
#
# Functions to build:
#
# 1. create_request(client_id, data) — Create request with status "pending"
# 2. get_request_by_id(request_id) — Fetch request details
# 3. get_user_requests(user_id, role, filters) — List requests for user
# 4. accept_request(request_id, provider_id) — Change status to "accepted", create chat room
# 5. complete_request(request_id, user_id) — Handle dual-confirmation completion
# 6. cancel_request(request_id, user_id) — Cancel with policy checks
#
# State machine: PENDING → ACCEPTED → IN_PROGRESS → COMPLETED
#                PENDING → REJECTED / CANCELLED
