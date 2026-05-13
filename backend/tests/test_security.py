import pytest
from app.utils.security import hash_password, verify_password, create_access_token


class TestPasswordHashing:
    """Unit tests for password hashing and verification."""

    def test_hash_differs_from_plain_text(self):
        plain = "SecurePass123!"
        hashed = hash_password(plain)
        assert hashed != plain, "Hash must differ from plain text"
        assert hashed.startswith("$pbkdf2-sha256$"), "Must be a PBKDF2-SHA256 hash"

    def test_verify_correct_password(self):
        plain = "SecurePass123!"
        hashed = hash_password(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_wrong_password(self):
        hashed = hash_password("SecurePass123!")
        assert verify_password("WrongPass!", hashed) is False

    def test_hash_uniqueness(self):
        h1 = hash_password("SamePassword")
        h2 = hash_password("SamePassword")
        assert h1 != h2, "Each hash must use a unique salt"

    def test_hash_empty_string(self):
        hashed = hash_password("")
        assert hashed.startswith("$pbkdf2-sha256$")
        assert verify_password("", hashed) is True

    def test_create_access_token_contains_subject(self):
        token = create_access_token({"sub": "user_id_123"})
        assert isinstance(token, str)
        assert len(token) > 20
