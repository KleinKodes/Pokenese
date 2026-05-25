from __future__ import annotations

from datetime import date, datetime, timedelta, timezone
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.dependencies import get_current_user, get_db, get_optional_user
from app.models.user import User
from app.schemas.daily import (
    ChallengeResultData,
    DailyChallengeInfo,
    DailyHistoryChallenge,
    DailyHistoryDay,
    DailyHistoryResponse,
    DailyShareResponse,
    DailyTodayResponse,
    GuessRequest,
    GuessResponse,
    HintRevealed,
    ShareChallengeData,
)
from app.services.daily import (
    calculate_streak,
    get_all_user_daily_results,
    get_challenge_for_date,
    get_today_challenge,
    get_user_results_for_date,
    is_challenge_unlocked,
    next_daily_reset,
    process_daily_guess,
)
from app.services.glossary import unlock_or_increment

router = APIRouter(prefix="/api/v1/daily", tags=["daily"])


@router.get("/today", response_model=DailyTodayResponse)
async def get_today(
    db: AsyncSession = Depends(get_db),
    user: Optional[User] = Depends(get_optional_user),
) -> Any:
    challenge = await get_today_challenge(db)
    if challenge is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No daily challenge configured for today. Run the seed script.",
        )

    today = date.today()
    user_results = []
    if user is not None:
        user_results = await get_user_results_for_date(db, user.id, today)

    def _build_challenge_info(num: int) -> DailyChallengeInfo:
        pokemon_id = getattr(challenge, f"pokemon_id_{num}")
        unlocked = is_challenge_unlocked(num, user_results)
        result = None
        if user is not None:
            completed = next(
                (r for r in user_results if r.challenge_num == num and r.score >= 0),
                None,
            )
            if completed:
                result = ChallengeResultData(
                    guesses=completed.guesses,
                    score=completed.score,
                    hints_used=completed.hints_used,
                    completed_at=completed.completed_at,
                )
        return DailyChallengeInfo(
            pokemon_id=pokemon_id,
            unlocked=unlocked,
            result=result,
        )

    return DailyTodayResponse(
        date=today,
        challenge_1=_build_challenge_info(1),
        challenge_2=_build_challenge_info(2),
        challenge_3=_build_challenge_info(3),
        next_daily_at=next_daily_reset(),
    )


@router.post("/guess", response_model=GuessResponse)
async def submit_guess(
    body: GuessRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    # Validate the date is today (can't guess on past/future days)
    if body.date != date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Can only submit guesses for today's challenge",
        )

    # Check challenge is unlocked
    user_results = await get_user_results_for_date(db, user.id, body.date)
    if not is_challenge_unlocked(body.challenge_num, user_results):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Challenge {body.challenge_num} is locked. Complete the previous challenge first.",
        )

    try:
        (
            correct,
            hint_revealed,
            guesses_so_far,
            score,
            failed,
            proximity_score,
        ) = await process_daily_guess(
            db, user.id, body.date, body.challenge_num, body.guess
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )

    # Unlock Pokemon in glossary on any completion
    if correct or failed:
        challenge = await get_challenge_for_date(db, body.date)
        if challenge:
            pokemon_id = getattr(challenge, f"pokemon_id_{body.challenge_num}")
            await unlock_or_increment(db, user.id, pokemon_id)

    hint = (
        HintRevealed(type=hint_revealed["type"], data=hint_revealed["data"])
        if hint_revealed
        else None
    )

    return GuessResponse(
        correct=correct,
        hint_revealed=hint,
        guesses_so_far=guesses_so_far,
        score=score,
        failed=failed,
        proximity_score=proximity_score if failed else None,
    )


@router.get("/history", response_model=DailyHistoryResponse)
async def get_history(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    from collections import defaultdict

    all_results = await get_all_user_daily_results(db, user.id)
    # Filter completed results only (score >= 0)
    completed = [r for r in all_results if r.score >= 0]

    by_date: dict[date, list] = defaultdict(list)
    for r in completed:
        by_date[r.date].append(r)

    history = []
    for d in sorted(by_date.keys(), reverse=True):
        day_results = by_date[d]
        total = sum(r.score for r in day_results)
        challenges = [
            DailyHistoryChallenge(
                challenge_num=r.challenge_num,
                score=r.score,
                hints_used=r.hints_used,
            )
            for r in sorted(day_results, key=lambda x: x.challenge_num)
        ]
        history.append(
            DailyHistoryDay(date=d, total_score=total, challenges=challenges)
        )

    return DailyHistoryResponse(history=history)


@router.get("/share/{date}", response_model=DailyShareResponse)
async def get_share_data(
    date: date,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
) -> Any:
    user_results = await get_user_results_for_date(db, user.id, date)
    completed = [r for r in user_results if r.score >= 0]

    if not completed:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No completed challenges found for this date",
        )

    total_score = sum(r.score for r in completed)
    current_streak, _ = await calculate_streak(db, user.id)

    challenges = [
        ShareChallengeData(
            guesses=len(r.guesses),
            score=r.score,
        )
        for r in sorted(completed, key=lambda x: x.challenge_num)
    ]

    return DailyShareResponse(
        date=date,
        username=user.username,
        total_score=total_score,
        challenges=challenges,
        streak=current_streak,
    )
