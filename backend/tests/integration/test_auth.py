"""Integration tests for the auth endpoints."""
from __future__ import annotations

import pytest
from httpx import AsyncClient


async def _register(client: AsyncClient, email: str, username: str, password: str = "password123") -> dict:
    resp = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "username": username, "password": password},
    )
    return resp


class TestRegister:
    async def test_register_success(self, client: AsyncClient):
        resp = await _register(client, "new@example.com", "newuser")
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@example.com"
        assert data["user"]["username"] == "newuser"

    async def test_register_duplicate_email(self, client: AsyncClient):
        await _register(client, "dup@example.com", "dupuser1")
        resp = await _register(client, "dup@example.com", "dupuser2")
        assert resp.status_code in (400, 409)
        assert "email" in resp.json()["detail"].lower()

    async def test_register_duplicate_username(self, client: AsyncClient):
        await _register(client, "user1@example.com", "sharedname")
        resp = await _register(client, "user2@example.com", "sharedname")
        assert resp.status_code in (400, 409)
        assert "username" in resp.json()["detail"].lower()

    async def test_register_weak_password(self, client: AsyncClient):
        resp = await _register(client, "weak@example.com", "weakuser", password="short")
        assert resp.status_code == 422


class TestLogin:
    async def test_login_success(self, client: AsyncClient):
        # Register first
        await _register(client, "login@example.com", "loginuser", "mypassword123")
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "login@example.com", "password": "mypassword123"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "login@example.com"

    async def test_login_wrong_password(self, client: AsyncClient):
        await _register(client, "wrongpw@example.com", "wrongpwuser", "correctpassword")
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "wrongpw@example.com", "password": "wrongpassword"},
        )
        assert resp.status_code == 401

    async def test_login_unknown_email(self, client: AsyncClient):
        resp = await client.post(
            "/api/v1/auth/login",
            json={"email": "nonexistent@example.com", "password": "somepassword"},
        )
        assert resp.status_code in (401, 404)
