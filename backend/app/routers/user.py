from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.challenge import ChallengeResult
from app.models.daily import DailyResult
from app.models.glossary import GlossaryEntry
from app.models.user import User
from app.schemas.user import UserMeResponse, UserStats
from app.services.challenge import get_challenge_high_score
from app.services.daily import calculate_streak

router = APIRouter(prefix="/api/v1/user", tags=["user"])


@router.get("/me", response_model=UserMeResponse)
async def get_me(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    # Glossary count
    glossary_count_result = await db.execute(
        select(func.count(GlossaryEntry.pokemon_id)).where(
            GlossaryEntry.user_id == user.id
        )
    )
    glossary_count = glossary_count_result.scalar_one() or 0

    # Total daily score
    total_daily_result = await db.execute(
        select(func.sum(DailyResult.score)).where(
            DailyResult.user_id == user.id,
            DailyResult.score >= 0,
        )
    )
    total_daily_score = total_daily_result.scalar_one() or 0

    # Streaks
    current_streak, longest_streak = await calculate_streak(db, user.id)

    # Challenge high score
    challenge_high = await get_challenge_high_score(db, user.id)

    stats = UserStats(
        daily_streak=current_streak,
        daily_longest_streak=longest_streak,
        total_daily_score=total_daily_score,
        challenge_high_score=challenge_high,
        glossary_count=glossary_count,
    )

    return UserMeResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        created_at=user.created_at,
        stats=stats,
    )
