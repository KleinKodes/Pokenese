from __future__ import annotations

import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily import DailyChallenge, DailyResult
from app.pokemon_data import get_pokemon_by_id, get_pokemon_by_name
from app.services.scoring import (
    MAX_GUESSES,
    calculate_failure_score,
    calculate_success_score,
    get_hint_for_wrong_guess,
    hints_shown_from_guess_count,
)


async def get_today_challenge(db: AsyncSession) -> Optional[DailyChallenge]:
    today = date.today()
    result = await db.execute(
        select(DailyChallenge).where(DailyChallenge.date == today)
    )
    return result.scalars().first()


async def get_challenge_for_date(
    db: AsyncSession, target_date: date
) -> Optional[DailyChallenge]:
    result = await db.execute(
        select(DailyChallenge).where(DailyChallenge.date == target_date)
    )
    return result.scalars().first()


async def get_user_results_for_date(
    db: AsyncSession, user_id: uuid.UUID, target_date: date
) -> List[DailyResult]:
    result = await db.execute(
        select(DailyResult)
        .where(
            DailyResult.user_id == user_id,
            DailyResult.date == target_date,
        )
        .order_by(DailyResult.challenge_num)
    )
    return list(result.scalars().all())


async def get_user_result_for_challenge(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_date: date,
    challenge_num: int,
) -> Optional[DailyResult]:
    result = await db.execute(
        select(DailyResult).where(
            DailyResult.user_id == user_id,
            DailyResult.date == target_date,
            DailyResult.challenge_num == challenge_num,
        )
    )
    return result.scalars().first()


async def get_all_user_daily_results(
    db: AsyncSession, user_id: uuid.UUID
) -> List[DailyResult]:
    result = await db.execute(
        select(DailyResult)
        .where(DailyResult.user_id == user_id)
        .order_by(DailyResult.date.desc(), DailyResult.challenge_num)
    )
    return list(result.scalars().all())


def next_daily_reset() -> datetime:
    """UTC midnight for the next day."""
    today = date.today()
    tomorrow = today + timedelta(days=1)
    return datetime(tomorrow.year, tomorrow.month, tomorrow.day, tzinfo=timezone.utc)


def is_challenge_unlocked(
    challenge_num: int, results: List[DailyResult]
) -> bool:
    """
    Challenge 1 is always unlocked.
    Challenge N is unlocked only after challenge N-1 is completed.
    """
    if challenge_num == 1:
        return True
    completed_nums = {r.challenge_num for r in results}
    return (challenge_num - 1) in completed_nums


async def process_daily_guess(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_date: date,
    challenge_num: int,
    guess: str,
) -> Tuple[bool, Optional[Dict], List[str], Optional[int], bool, Optional[int]]:
    """
    Process a daily guess.

    Returns: (correct, hint_revealed, guesses_so_far, score, failed, proximity_score)
    """
    # Validate challenge exists
    challenge = await get_challenge_for_date(db, target_date)
    if challenge is None:
        raise ValueError(f"No daily challenge for date {target_date}")

    pokemon_id = getattr(challenge, f"pokemon_id_{challenge_num}")
    pokemon = get_pokemon_by_id(pokemon_id)
    if pokemon is None:
        raise ValueError(f"Pokemon {pokemon_id} not found in data")

    # Load or build in-progress state from existing incomplete result
    # We store guesses in the DB only on completion, so we need to track
    # in-progress via a transient approach. For in-progress challenges we
    # keep guesses in the session via a temporary state.
    # NOTE: Since DailyResult has UNIQUE(user_id, date, challenge_num), a
    # completed challenge blocks further guesses.

    existing = await get_user_result_for_challenge(
        db, user_id, target_date, challenge_num
    )
    if existing is not None:
        raise ValueError("Challenge already completed")

    # We need an in-progress state. Fetch or create it from a "pending" row.
    # Strategy: use an in-progress record with a negative score as a sentinel,
    # OR simply keep guesses accumulating in a separate in-memory key.
    # For simplicity and correctness we use a "pending" approach:
    # store partial guesses in daily_results with score=-1 and reuse on each guess.
    pending = await _get_pending_result(db, user_id, target_date, challenge_num)

    if pending is None:
        guesses_so_far: List[str] = []
    else:
        guesses_so_far = list(pending.guesses or [])

    # Check if max guesses reached somehow
    if len(guesses_so_far) >= MAX_GUESSES:
        raise ValueError("No more guesses available")

    # Normalize guess
    guess_normalized = guess.strip()
    correct_name = pokemon["name_en"]
    correct = guess_normalized.lower() == correct_name.lower()

    guesses_so_far.append(guess_normalized)
    wrong_count = len(guesses_so_far)  # total guesses made so far

    hint_revealed = None
    score = None
    failed = False
    proximity_score = None

    if correct:
        hints_shown = hints_shown_from_guess_count(wrong_count - 1)
        score = calculate_success_score(hints_shown)
        await _save_completed_result(
            db, user_id, target_date, challenge_num,
            guesses_so_far, score, hints_shown, pending
        )
    elif wrong_count >= MAX_GUESSES:
        # All guesses exhausted
        failed = True
        hints_shown = MAX_GUESSES - 1  # 4 hints revealed
        proximity_score = calculate_failure_score(guesses_so_far, pokemon)
        score = proximity_score
        await _save_completed_result(
            db, user_id, target_date, challenge_num,
            guesses_so_far, score, hints_shown, pending
        )
    else:
        # Wrong guess but still have guesses left — reveal hint
        hint_revealed = get_hint_for_wrong_guess(wrong_count, pokemon)
        await _upsert_pending_result(
            db, user_id, target_date, challenge_num, guesses_so_far, pending
        )

    return correct, hint_revealed, guesses_so_far, score, failed, proximity_score


async def _get_pending_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_date: date,
    challenge_num: int,
) -> Optional[DailyResult]:
    """Get the in-progress (score=-1) daily result row."""
    result = await db.execute(
        select(DailyResult).where(
            DailyResult.user_id == user_id,
            DailyResult.date == target_date,
            DailyResult.challenge_num == challenge_num,
            DailyResult.score == -1,
        )
    )
    return result.scalars().first()


async def _upsert_pending_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_date: date,
    challenge_num: int,
    guesses: List[str],
    existing: Optional[DailyResult],
) -> None:
    """Save or update an in-progress result (score=-1 sentinel)."""
    if existing is None:
        row = DailyResult(
            user_id=user_id,
            date=target_date,
            challenge_num=challenge_num,
            guesses=guesses,
            score=-1,
            hints_used=len(guesses),
        )
        db.add(row)
    else:
        existing.guesses = guesses
        existing.hints_used = len(guesses)
        db.add(existing)
    await db.commit()


async def _save_completed_result(
    db: AsyncSession,
    user_id: uuid.UUID,
    target_date: date,
    challenge_num: int,
    guesses: List[str],
    score: int,
    hints_used: int,
    pending: Optional[DailyResult],
) -> None:
    """Finalize the daily result row with actual score."""
    if pending is not None:
        pending.guesses = guesses
        pending.score = score
        pending.hints_used = hints_used
        db.add(pending)
    else:
        row = DailyResult(
            user_id=user_id,
            date=target_date,
            challenge_num=challenge_num,
            guesses=guesses,
            score=score,
            hints_used=hints_used,
        )
        db.add(row)
    await db.commit()


async def calculate_streak(db: AsyncSession, user_id: uuid.UUID) -> Tuple[int, int]:
    """
    Returns (current_streak, longest_streak).
    Streak = consecutive days with all 3 challenges completed before UTC midnight.
    """
    results = await get_all_user_daily_results(db, user_id)

    # Group by date → only count dates with 3 completed challenges (score >= 0)
    from collections import defaultdict
    by_date: dict[date, int] = defaultdict(int)
    for r in results:
        if r.score >= 0:
            by_date[r.date] += 1

    completed_dates = sorted(
        [d for d, count in by_date.items() if count == 3], reverse=True
    )

    if not completed_dates:
        return 0, 0

    today = date.today()
    current_streak = 0
    longest_streak = 0
    streak = 0
    prev_date = None

    for d in completed_dates:
        if prev_date is None:
            # Must be today or yesterday to start a current streak
            if d == today or d == today - timedelta(days=1):
                streak = 1
            else:
                streak = 1  # historical, will compute longest
        else:
            if (prev_date - d).days == 1:
                streak += 1
            else:
                streak = 1
        longest_streak = max(longest_streak, streak)
        prev_date = d

    # Current streak: streak from today backward
    current_streak = 0
    check_date = today
    for d in completed_dates:
        if d == check_date:
            current_streak += 1
            check_date -= timedelta(days=1)
        elif d < check_date:
            break

    return current_streak, longest_streak
