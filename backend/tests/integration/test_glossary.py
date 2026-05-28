"""Integration tests for the glossary endpoint."""
from __future__ import annotations

from datetime import date

import pytest
from httpx import AsyncClient

from app.models.daily import DailyChallenge


class TestGlossary:
    async def test_glossary_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/glossary")
        assert resp.status_code == 401

    async def test_glossary_empty(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/glossary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["entries"] == []

    async def test_glossary_after_daily_completion(
        self,
        client: AsyncClient,
        daily_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        # Complete challenge 1 — this calls unlock_or_increment in the route
        await client.post(
            "/api/v1/daily/guess",
            json={"date": str(date.today()), "challenge_num": 1, "guess": "Bulbasaur"},
            headers=auth_headers,
        )

        resp = await client.get("/api/v1/glossary", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["entries"]) >= 1
        pokemon_ids = [e["pokemon_id"] for e in data["entries"]]
        assert 1 in pokemon_ids  # Bulbasaur's ID
