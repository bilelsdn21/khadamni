"""
Integration Test — IT-001: Service Request Status Transitions
============================================================
Uses an existing COMPLETED request to verify that invalid status
transitions are correctly rejected with HTTP 400.

FILL IN THESE 3 VARIABLES BEFORE RUNNING:
  COMPLETED_REQUEST_ID  — _id of any completed request in the DB
  PROVIDER_TOKEN        — JWT of the provider assigned to that request
  CLIENT_TOKEN          — JWT of the client who created that request

Run:
    cd backend
    venv/Scripts/python -m pytest tests/test_request_transitions.py -v
    
"""

import httpx
import pytest
from app.utils.security import create_access_token
from datetime import timedelta

BASE_URL = "http://localhost:8000"

COMPLETED_REQUEST_ID = "69fb8321092d64363dc58d40"
PROVIDER_ID          = "69ea0184d83b709939f02a19"
CLIENT_ID            = "69fb81e0092d64363dc58d3d"

# Generate fresh tokens that won't expire during tests
PROVIDER_TOKEN = create_access_token({"sub": PROVIDER_ID}, expires_delta=timedelta(hours=1))
CLIENT_TOKEN   = create_access_token({"sub": CLIENT_ID},   expires_delta=timedelta(hours=1))

provider_headers = {"Authorization": f"Bearer {PROVIDER_TOKEN}"}
client_headers   = {"Authorization": f"Bearer {CLIENT_TOKEN}"}


class TestInvalidStatusTransitions:
    """
    Verifies that the backend rejects all transitions out of a
    completed request with HTTP 400 (invalid_status).
    """

    def test_cannot_accept_completed_request(self):
        """completed → in_progress must be rejected (provider tries to re-accept)."""
        r = httpx.post(
            f"{BASE_URL}/api/requests/{COMPLETED_REQUEST_ID}/accept",
            headers=provider_headers,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_cannot_complete_already_completed_request(self):
        """completed → completed must be rejected (provider tries to re-complete)."""
        r = httpx.post(
            f"{BASE_URL}/api/requests/{COMPLETED_REQUEST_ID}/complete",
            headers=provider_headers,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_cannot_cancel_completed_request(self):
        """completed → cancelled must be rejected (client tries to cancel)."""
        r = httpx.post(
            f"{BASE_URL}/api/requests/{COMPLETED_REQUEST_ID}/cancel",
            headers=client_headers,
        )
        assert r.status_code == 400, f"Expected 400, got {r.status_code}: {r.text}"

    def test_completed_request_is_readable(self):
        """Sanity check — the request exists and status is indeed 'completed'."""
        r = httpx.get(
            f"{BASE_URL}/api/requests/{COMPLETED_REQUEST_ID}",
            headers=client_headers,
        )
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"
        assert r.json()["status"] == "completed"


class TestJWTProtection:
    """Verifies that protected endpoints reject requests with missing or invalid tokens."""

    def test_invalid_token_returns_401(self):
        """Request with a clearly invalid token must be rejected with 401."""
        r = httpx.get(
            f"{BASE_URL}/api/requests/{COMPLETED_REQUEST_ID}",
            headers={"Authorization": "Bearer thisisnotavalidtoken"},
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"

    def test_tampered_token_returns_401(self):
        """Request with a tampered JWT signature must be rejected with 401."""
        tampered = CLIENT_TOKEN[:-5] + "XXXXX"
        r = httpx.get(
            f"{BASE_URL}/api/requests/{COMPLETED_REQUEST_ID}",
            headers={"Authorization": f"Bearer {tampered}"},
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"
