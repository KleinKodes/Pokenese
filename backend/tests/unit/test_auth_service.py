"""Unit tests for auth service pure functions."""
from __future__ import annotations

import uuid
from datetime import datetime, timedelta, timezone

import pytest
from jose import jwt

from app.config import get_settings
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    hash_password,
    hash_token,
    verify_password,
)


# ── hash_password / verify_password ──────────────────────────────────────────

def test_hash_password_is_not_plaintext():
    h = hash_password("mysecret")
    assert h != "mysecret"
    assert len(h) > 20


def test_verify_password_correct():
    h = hash_password("password123")
    assert verify_password("password123", h) is True


def test_verify_password_wrong():
    h = hash_password("password123")
    assert verify_password("wrongpass", h) is False


def test_different_hashes_for_same_password():
    """bcrypt uses a random salt so two hashes of the same password differ."""
    h1 = hash_password("same-password")
    h2 = hash_password("same-password")
    assert h1 != h2


# ── hash_token ────────────────────────────────────────────────────────────────

def test_hash_token_deterministic():
    t = "some-refresh-token"
    assert hash_token(t) == hash_token(t)


def test_hash_token_is_sha256():
    import hashlib
    t = "my-token"
    expected = hashlib.sha256(t.encode()).hexdigest()
    assert hash_token(t) == expected


def test_hash_token_different_inputs_different_output():
    assert hash_token("token-a") != hash_token("token-b")


# ── create_access_token + decode_access_token ─────────────────────────────────

def test_access_token_round_trip():
    user_id = uuid.uuid4()
    token = create_access_token(user_id)
    decoded = decode_access_token(token)
    assert decoded == user_id


def test_access_token_expired_returns_none():
    """Create a token with a past expiry manually."""
    settings = get_settings()
    user_id = uuid.uuid4()
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        "type": "access",
    }
    expired_token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    result = decode_access_token(expired_token)
    assert result is None


def test_access_token_wrong_type_returns_none():
    """A refresh token should not be accepted as an access token."""
    user_id = uuid.uuid4()
    refresh_token = create_refresh_token(user_id)
    result = decode_access_token(refresh_token)
    assert result is None


def test_access_token_invalid_string_returns_none():
    result = decode_access_token("not-a-valid-jwt-token")
    assert result is None


# ── create_refresh_token + decode_refresh_token ───────────────────────────────

def test_refresh_token_round_trip():
    user_id = uuid.uuid4()
    token = create_refresh_token(user_id)
    decoded = decode_refresh_token(token)
    assert decoded == user_id


def test_refresh_token_expired_returns_none():
    settings = get_settings()
    user_id = uuid.uuid4()
    payload = {
        "sub": str(user_id),
        "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        "type": "refresh",
        "jti": str(uuid.uuid4()),
    }
    expired_token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
    result = decode_refresh_token(expired_token)
    assert result is None


def test_access_token_rejected_as_refresh():
    """An access token should not be accepted as a refresh token."""
    user_id = uuid.uuid4()
    access_token = create_access_token(user_id)
    result = decode_refresh_token(access_token)
    assert result is None


def test_refresh_token_invalid_string_returns_none():
    result = decode_refresh_token("garbage-token")
    assert result is None
