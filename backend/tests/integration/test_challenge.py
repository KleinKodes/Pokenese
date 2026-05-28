"""Integration tests for the challenge mode endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient

from app.pokemon_data import get_pokemon_by_id


class TestChallengeState:
    async def test_get_state_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/challenge/state")
        assert resp.status_code == 401

    async def test_get_state_initial(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/challenge/state", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["total_score"] == 0
        assert data["seen_count"] == 0


class TestChallengeNext:
    async def test_get_next_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/challenge/next")
        assert resp.status_code == 401

    async def test_get_next_returns_pokemon_id(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/challenge/next", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data.get("pokemon_id") is not None


class TestChallengeGuess:
    async def test_guess_requires_auth(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/challenge/guess",
            json={"pokemon_id": 1, "guess": "Bulbasaur"},
        )
        assert resp.status_code == 401

    async def test_challenge_guess_wrong(self, client: AsyncClient, auth_headers: dict):
        # Get next pokemon
        next_resp = await client.get("/api/v1/challenge/next", headers=auth_headers)
        assert next_resp.status_code == 200
        pokemon_id = next_resp.json()["pokemon_id"]

        # Guess something obviously wrong
        resp = await client.post(
            "/api/v1/challenge/guess",
            json={"pokemon_id": pokemon_id, "guess": "XXXNOTAPOKEMONXXX"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["correct"] is False
        assert data["hint_revealed"] is not None

    async def test_challenge_guess_correct(self, client: AsyncClient, auth_headers: dict):
        # Get next pokemon ID
        next_resp = await client.get("/api/v1/challenge/next", headers=auth_headers)
        assert next_resp.status_code == 200
        pokemon_id = next_resp.json()["pokemon_id"]

        # Look up its correct name
        pokemon = get_pokemon_by_id(pokemon_id)
        assert pokemon is not None
        correct_name = pokemon["name_en"]

        # Submit correct guess
        resp = await client.post(
            "/api/v1/challenge/guess",
            json={"pokemon_id": pokemon_id, "guess": correct_name},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["correct"] is True
        assert data["score"] is not None
        assert data["score"] > 0
        assert data["run_reset"] is False
