from __future__ import annotations

import uuid
from typing import AsyncGenerator, Optional

from fastapi import Cookie, Depends, HTTPException, Request, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal
from app.models.user import User
from app.services.auth import decode_access_token


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


def _extract_token(request: Request) -> Optional[str]:
    """Extract bearer token from Authorization header or access_token cookie."""
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header.removeprefix("Bearer ").strip()
    # Fall back to httpOnly cookie
    return request.cookies.get("access_token")


async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> User:
    """Require an authenticated user. Raises 401 if not authenticated."""
    token = _extract_token(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = decode_access_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """Return authenticated user or None for anonymous requests."""
    token = _extract_token(request)
    if not token:
        return None

    user_id = decode_access_token(token)
    if user_id is None:
        return None

    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalars().first()
