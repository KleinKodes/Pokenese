"""Integration tests for daily challenge endpoints."""
from __future__ import annotations

from datetime import date

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily import DailyChallenge
from app.models.user import User


class TestGetToday:
    async def test_get_today_no_challenge(self, client: AsyncClient):
        """No challenge seeded → 404."""
        resp = await client.get("/api/v1/daily/today")
        assert resp.status_code == 404

    async def test_get_today_with_challenge(
        self, client: AsyncClient, daily_challenge: DailyChallenge
    ):
        resp = await client.get("/api/v1/daily/today")
        assert resp.status_code == 200
        data = resp.json()
        assert "challenge_1" in data
        assert "challenge_2" in data
        assert "challenge_3" in data
        assert data["challenge_1"]["pokemon_id"] == 1

    async def test_get_today_authenticated(
        self,
        client: AsyncClient,
        daily_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        resp = await client.get("/api/v1/daily/today", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "challenge_1" in data
        # challenge 1 should always be unlocked
        assert data["challenge_1"]["unlocked"] is True
        # challenge 2 should be locked (challenge 1 not completed)
        assert data["challenge_2"]["unlocked"] is False


class TestGuess:
    async def test_guess_requires_auth(self, client: AsyncClient, daily_challenge: DailyChallenge):
        resp = await client.post(
            "/api/v1/daily/guess",
            json={"date": str(date.today()), "challenge_num": 1, "guess": "Bulbasaur"},
        )
        assert resp.status_code == 401

    async def test_guess_wrong_answer(
        self,
        client: AsyncClient,
        daily_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        resp = await client.post(
            "/api/v1/daily/guess",
            json={"date": str(date.today()), "challenge_num": 1, "guess": "Pikachu"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["correct"] is False
        assert data["hint_revealed"] is not None  # hint revealed after first wrong guess

    async def test_guess_correct_answer(
        self,
        client: AsyncClient,
        daily_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        resp = await client.post(
            "/api/v1/daily/guess",
            json={"date": str(date.today()), "challenge_num": 1, "guess": "Bulbasaur"},
            headers=auth_headers,
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data["correct"] is True
        assert data["score"] is not None
        assert data["score"] > 0

    async def test_guess_challenge_2_locked(
        self,
        client: AsyncClient,
        daily_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        """Challenge 2 is locked before challenge 1 is complete."""
        resp = await client.post(
            "/api/v1/daily/guess",
            json={"date": str(date.today()), "challenge_num": 2, "guess": "Charmander"},
            headers=auth_headers,
        )
        assert resp.status_code == 403


class TestHistory:
    async def test_history_empty(self, client: AsyncClient, auth_headers: dict):
        resp = await client.get("/api/v1/daily/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["history"] == []

    async def test_history_requires_auth(self, client: AsyncClient):
        resp = await client.get("/api/v1/daily/history")
        assert resp.status_code == 401

    async def test_history_after_completion(
        self,
        client: AsyncClient,
        daily_challenge: DailyChallenge,
        auth_headers: dict,
    ):
        # Complete challenge 1
        await client.post(
            "/api/v1/daily/guess",
            json={"date": str(date.today()), "challenge_num": 1, "guess": "Bulbasaur"},
            headers=auth_headers,
        )
        resp = await client.get("/api/v1/daily/history", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert len(data["history"]) == 1
        assert data["history"][0]["challenges"][0]["challenge_num"] == 1
