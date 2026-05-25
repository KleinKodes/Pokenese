from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.dependencies import get_db, get_current_user
from app.models.user import RefreshToken, User
from app.models.glossary import GlossaryEntry
from app.models.daily import DailyResult
from app.models.challenge import ChallengeState
from app.schemas.auth import (
    LoginRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    TokenResponse,
    UserInfo,
)
from app.services.auth import (
    create_access_token,
    create_refresh_token,
    decode_refresh_token,
    get_refresh_token_expiry,
    hash_password,
    hash_token,
    verify_password,
)

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])
settings = get_settings()


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str) -> None:
    is_secure = settings.is_production
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.refresh_token_expire_days * 86400,
    )


def _clear_auth_cookies(response: Response) -> None:
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")


@router.post("/register", response_model=TokenResponse)
async def register(
    body: RegisterRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Check email uniqueness
    result = await db.execute(select(User).where(User.email == body.email))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    # Check username uniqueness
    result = await db.execute(select(User).where(User.username == body.username))
    if result.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    # Create user
    user = User(
        email=body.email,
        username=body.username,
        password_hash=hash_password(body.password),
    )
    db.add(user)
    await db.flush()  # get user.id without full commit

    # Migrate local state if provided
    if body.migrate_local_state:
        await _migrate_local_state(db, user, body.migrate_local_state)

    # Issue tokens
    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    token_row = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=get_refresh_token_expiry(),
    )
    db.add(token_row)
    await db.commit()

    _set_auth_cookies(response, access_token, refresh_token)

    return TokenResponse(
        user=UserInfo(id=user.id, email=user.email, username=user.username),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> Any:
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalars().first()

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    access_token = create_access_token(user.id)
    refresh_token = create_refresh_token(user.id)

    token_row = RefreshToken(
        user_id=user.id,
        token_hash=hash_token(refresh_token),
        expires_at=get_refresh_token_expiry(),
    )
    db.add(token_row)
    await db.commit()

    _set_auth_cookies(response, access_token, refresh_token)

    return TokenResponse(
        user=UserInfo(id=user.id, email=user.email, username=user.username),
        access_token=access_token,
        refresh_token=refresh_token,
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_token(
    request: Request,
    response: Response,
    body: RefreshRequest = None,
    db: AsyncSession = Depends(get_db),
) -> Any:
    # Get token from cookie or request body
    token = request.cookies.get("refresh_token")
    if not token and body:
        token = body.refresh_token
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No refresh token provided",
        )

    user_id = decode_refresh_token(token)
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    # Validate token exists in DB (not revoked)
    token_hash = hash_token(token)
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.user_id == user_id,
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
    )
    stored_token = result.scalars().first()
    if stored_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token has been revoked or expired",
        )

    # Issue new access token
    new_access_token = create_access_token(user_id)
    is_secure = settings.is_production
    response.set_cookie(
        key="access_token",
        value=new_access_token,
        httponly=True,
        secure=is_secure,
        samesite="lax",
        max_age=settings.access_token_expire_minutes * 60,
    )

    return RefreshResponse(access_token=new_access_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
) -> None:
    token = request.cookies.get("refresh_token")
    if token:
        token_hash = hash_token(token)
        result = await db.execute(
            select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        )
        stored = result.scalars().first()
        if stored:
            await db.delete(stored)
            await db.commit()

    _clear_auth_cookies(response)


async def _migrate_local_state(
    db: AsyncSession,
    user: User,
    local_state: Dict[str, Any],
) -> None:
    """
    Migrate localStorage state to the database after registration.
    Handles: glossary entries, daily results, challenge state.
    """
    import json
    from datetime import date

    # Migrate glossary
    glossary_ids: list = local_state.get("glossary", [])
    glossary_seen: dict = local_state.get("glossary_seen_count", {})
    for pid in glossary_ids:
        try:
            pid_int = int(pid)
            times = int(glossary_seen.get(str(pid), glossary_seen.get(pid, 1)))
            entry = GlossaryEntry(
                user_id=user.id,
                pokemon_id=pid_int,
                times_seen=times,
            )
            db.add(entry)
        except (ValueError, TypeError):
            continue

    # Migrate daily results
    daily_data: dict = local_state.get("daily", {})
    for date_str, challenges in daily_data.items():
        try:
            d = date.fromisoformat(date_str)
        except ValueError:
            continue
        for key in ["challenge_1", "challenge_2", "challenge_3"]:
            cdata = challenges.get(key)
            if cdata is None:
                continue
            try:
                num = int(key.split("_")[1])
                guesses = cdata.get("guesses", [])
                score = int(cdata.get("score", 0))
                hints_used = int(cdata.get("hints_used", 0))
                row = DailyResult(
                    user_id=user.id,
                    date=d,
                    challenge_num=num,
                    guesses=guesses,
                    score=score,
                    hints_used=hints_used,
                )
                db.add(row)
            except (ValueError, TypeError, KeyError):
                continue

    # Migrate challenge state
    challenge_data: dict = local_state.get("challenge", {})
    if challenge_data:
        try:
            state = ChallengeState(
                user_id=user.id,
                seen_ids=[int(x) for x in challenge_data.get("seen_ids", [])],
                total_score=int(challenge_data.get("total_score", 0)),
                is_active=bool(challenge_data.get("is_active", True)),
                run_number=int(challenge_data.get("run_number", 1)),
            )
            db.add(state)
        except (ValueError, TypeError):
            pass
