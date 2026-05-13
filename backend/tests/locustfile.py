"""
Performance Tests — Khadamni Platform
======================================
PERF-001 : Normal load      → locust -u 50  -r 5  -t 3m
PERF-002 : Peak load        → locust -u 200 -r 10 -t 3m
PERF-003 : Stress test      → locust -u 500 -r 20 -t 3m
PERF-005 : AI analysis      → locust -u 10  -r 2  -t 2m  --tags ai
PERF-006 : Geospatial search→ locust -u 50  -r 5  -t 2m  --tags geo

Run from backend/ directory:
  venv\Scripts\locust -f tests/locustfile.py --headless -u 50 -r 5 -t 3m --host http://localhost:8000
"""

from locust import HttpUser, task, between, tag
from app.utils.security import create_access_token
from datetime import timedelta

CLIENT_ID        = "69fb81e0092d64363dc58d3d"
PROVIDER_ID      = "69ea0184d83b709939f02a19"
REQUEST_ID       = "69fb8321092d64363dc58d40"

CLIENT_TOKEN   = create_access_token({"sub": CLIENT_ID},   expires_delta=timedelta(hours=2))
PROVIDER_TOKEN = create_access_token({"sub": PROVIDER_ID}, expires_delta=timedelta(hours=2))

CH = {"Authorization": f"Bearer {CLIENT_TOKEN}"}
PH = {"Authorization": f"Bearer {PROVIDER_TOKEN}"}


class GeneralUser(HttpUser):
    """
    Mixed workload — used for PERF-001, PERF-002, PERF-003.
    Simulates clients and providers doing typical platform actions.
    """
    wait_time = between(1, 3)

    @task(4)
    @tag("geo")
    def search_all_providers(self):
        self.client.get(
            "/api/providers/all_providers?category=Plumbing",
            headers=CH,
            name="GET /api/providers/all_providers"
        )

    @task(3)
    @tag("geo")
    def search_remote_providers(self):
        self.client.get(
            "/api/providers/remote",
            headers=CH,
            name="GET /api/providers/remote"
        )

    @task(3)
    def get_my_requests(self):
        self.client.get(
            "/api/requests/my",
            headers=CH,
            name="GET /api/requests/my"
        )

    @task(2)
    def get_request_detail(self):
        self.client.get(
            f"/api/requests/{REQUEST_ID}",
            headers=CH,
            name="GET /api/requests/:id"
        )

    @task(2)
    def get_chat_history(self):
        self.client.get(
            f"/api/chat/{REQUEST_ID}/messages",
            headers=CH,
            name="GET /api/chat/:id/messages"
        )

    @task(1)
    def get_provider_requests(self):
        self.client.get(
            "/api/requests/my",
            headers=PH,
            name="GET /api/requests/my (provider)"
        )

    @task(1)
    @tag("ai")
    def ai_analysis(self):
        self.client.post(
            "/api/ai/analyze-request",
            json={"description": "3andi mushkla fil robiniyya"},
            headers=CH,
            name="POST /api/ai/analyze-request",
            timeout=15
        )
