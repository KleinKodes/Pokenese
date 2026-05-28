"""Integration tests for the /user/me endpoint."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestUserMe:
    async def test_me_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/user/me")
        assert resp.status_code == 401

    async def test_me_returns_profile(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/user/me", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "id" in data
        assert "username" in data
        assert "email" in data
        assert "stats" in data

    async def test_me_stats_initial(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/user/me", headers=auth_headers)
        assert resp.status_code == 200
        stats = resp.json()["stats"]
        assert stats["daily_streak"] == 0
        assert stats["glossary_count"] == 0
        assert stats["challenge_high_score"] == 0
