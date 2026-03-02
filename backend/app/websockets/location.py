# location.py — Live Location WebSocket Endpoint
#
# What to build here:
#
# 1. Create a WebSocket endpoint: /ws/location/{job_id}
# 2. On connect:
#      - Validate JWT token
#      - Verify user is part of this active job
# 3. While connected:
#      - Receive GPS coordinates from provider (every 3-5 seconds)
#      - Broadcast location to the client tracking this job
#      - Calculate and send distance updates
# 4. On disconnect:
#      - Stop tracking
#
# Only active during IN_PROGRESS jobs
