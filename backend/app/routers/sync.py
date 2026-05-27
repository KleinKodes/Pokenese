from __future__ import annotations

from typing import Any
from collections import defaultdict

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db
from app.models.user import User
from app.schemas.sync import (
    SyncRequest,
    SyncResponse,
    SyncGlossaryEntry,
    SyncDailyDay,
    SyncDailyResult,
)
from app.services.glossary import unlock_or_increment, get_glossary
from app.services.daily import get_all_user_daily_results, calculate_streak

router = APIRouter(prefix="/api/v1/sync", tags=["sync"])


@router.post("", response_model=SyncResponse)
async def sync_state(
    body: SyncRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    # Merge glossary: unlock any IDs in body that aren't on server yet
    for pokemon_id in body.glossary:
        await unlock_or_increment(db, user.id, pokemon_id)

    # Merge daily: save results not yet on server
    # (Skip complex daily merge for now - just trust server state)

    # Fetch canonical server state to return
    all_glossary = await get_glossary(db, user.id)
    all_daily = await get_all_user_daily_results(db, user.id)
    current_streak, longest_streak = await calculate_streak(db, user.id)

    # Build daily response
    by_date: dict = defaultdict(lambda: {"challenge_1": None, "challenge_2": None, "challenge_3": None})
    for r in all_daily:
        if r.score >= 0:
            key = f"challenge_{r.challenge_num}"
            by_date[str(r.date)][key] = SyncDailyResult(
                score=r.score,
                hints_used=r.hints_used,
                guesses=r.guesses,
            )

    daily_out = {
        date_str: SyncDailyDay(
            challenge_1=v["challenge_1"],
            challenge_2=v["challenge_2"],
            challenge_3=v["challenge_3"],
        )
        for date_str, v in by_date.items()
    }

    return SyncResponse(
        glossary=[SyncGlossaryEntry(pokemon_id=e.pokemon_id, times_seen=e.times_seen) for e in all_glossary],
        daily=daily_out,
        streak_current=current_streak,
        streak_longest=longest_streak,
    )
