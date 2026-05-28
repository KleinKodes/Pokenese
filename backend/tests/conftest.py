"""
Shared fixtures for all tests.

Integration tests use a real PostgreSQL test database (pokenese_test).
All tests using the DB fixture are wrapped in a SAVEPOINT that is rolled
back after each test, keeping tests isolated without recreation overhead.
"""
from __future__ import annotations

import asyncio
import os
import uuid
from datetime import date, timedelta
from typing import AsyncGenerator

import asyncpg
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

# ── Set env vars BEFORE importing app modules ─────────────────────────────────
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://pokenese:pokenese@localhost:5432/pokenese_test")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("ENVIRONMENT", "testing")
os.environ.setdefault("SEED_SALT", "test-seed-salt")

# Clear settings cache so test env vars take effect
from app.config import get_settings
get_settings.cache_clear()

# Now import app modules
from app.database import Base
from app.dependencies import get_db
from app.main import app
from app.models import challenge, daily, etymology, glossary, user  # noqa: F401 — register models
from app.services.auth import create_access_token, hash_password
from app.models.daily import DailyChallenge
from app.models.user import User

TEST_DB_URL = "postgresql+asyncpg://pokenese:pokenese@localhost:5432/pokenese_test"
ADMIN_DB_URL = "postgresql://pokenese:pokenese@localhost:5432/postgres"


async def _ensure_test_db() -> None:
    """Create pokenese_test database if it doesn't exist."""
    try:
        conn = await asyncpg.connect(
            "postgresql://pokenese:pokenese@localhost:5432/postgres"
        )
        try:
            exists = await conn.fetchval(
                "SELECT 1 FROM pg_database WHERE datname = 'pokenese_test'"
            )
            if not exists:
                await conn.execute("CREATE DATABASE pokenese_test")
        finally:
            await conn.close()
    except Exception as e:
        pytest.skip(f"PostgreSQL not available: {e}")


@pytest_asyncio.fixture(scope="session")
async def engine():
    await _ensure_test_db()
    eng = create_async_engine(TEST_DB_URL, echo=False, pool_pre_ping=True)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await eng.dispose()


@pytest_asyncio.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """
    Provide a transactional session per test. Each test runs inside a
    SAVEPOINT; on teardown the outer transaction is rolled back so the
    DB is clean for the next test.
    """
    async with engine.connect() as conn:
        await conn.begin()
        await conn.begin_nested()  # SAVEPOINT
        session = AsyncSession(conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
        await conn.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """HTTPX async test client with DB dependency overridden."""
    async def _override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = _override_get_db
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as ac:
        yield ac
    app.dependency_overrides.pop(get_db, None)


# ── Seed helpers ──────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    u = User(
        id=uuid.uuid4(),
        email="testuser@example.com",
        username="testuser",
        password_hash=hash_password("password123"),
    )
    db_session.add(u)
    await db_session.flush()
    return u


@pytest_asyncio.fixture
async def test_user_token(test_user: User) -> str:
    return create_access_token(test_user.id)


@pytest_asyncio.fixture
async def auth_headers(test_user_token: str) -> dict:
    return {"Authorization": f"Bearer {test_user_token}"}


@pytest_asyncio.fixture
async def daily_challenge(db_session: AsyncSession) -> DailyChallenge:
    """Seed today's daily challenge using known sample Pokemon IDs."""
    today = date.today()
    dc = DailyChallenge(date=today, pokemon_id_1=1, pokemon_id_2=4, pokemon_id_3=7)
    db_session.add(dc)
    await db_session.flush()
    return dc
