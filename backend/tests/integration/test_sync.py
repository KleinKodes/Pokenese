"""Integration tests for the /sync endpoint."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


class TestSync:
    async def test_sync_requires_auth(self, client: AsyncClient):
        resp = await client.post("/api/v1/sync", json={"glossary": [], "daily": {}})
        assert resp.status_code == 401

    async def test_sync_empty_payload(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/api/v1/sync",
            json={"glossary": [], "daily": {}},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["glossary"] == []
        assert data["streak_current"] == 0

    async def test_sync_glossary_merge(self, client: AsyncClient, auth_headers: dict):
        resp = await client.post(
            "/api/v1/sync",
            json={"glossary": [1, 4], "daily": {}},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        glossary_ids = [e["pokemon_id"] for e in data["glossary"]]
        assert 1 in glossary_ids
        assert 4 in glossary_ids

    async def test_sync_idempotent(self, client: AsyncClient, auth_headers: dict):
        """Syncing same glossary twice should not create duplicate entries."""
        payload = {"glossary": [1, 4], "daily": {}}

        resp1 = await client.post("/api/v1/sync", json=payload, headers=auth_headers)
        assert resp1.status_code == 200
        count_after_first = len(resp1.json()["glossary"])

        resp2 = await client.post("/api/v1/sync", json=payload, headers=auth_headers)
        assert resp2.status_code == 200
        count_after_second = len(resp2.json()["glossary"])

        # The count of unique pokemon entries should be the same (idempotent inserts)
        assert count_after_first == count_after_second
